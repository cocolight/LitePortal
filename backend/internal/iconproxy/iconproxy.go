// Package iconproxy 实现「在线图标」的服务端代理与磁盘缓存（F8）。
//
// 动机：此前前端 <img src> 直接指向 api.iconify.design 或目标站点，
// 导致 ① 每个访问者都回源一次；② 网络不通时图标全部裂图。
//
// 本包提供 GET /icons/proxy?url=<原图标地址>：
//   - 首次请求回源下载并落盘（data/icons/<sha256>.<ext>），随后直接返回本地文件；
//   - 进程重启后缓存仍在磁盘上，因此离线也能命中已缓存图标。
//
// 安全：仅允许 http/https；解析目标地址后拒绝环回与私有网段（防 SSRF）。
package iconproxy

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

// maxIconBytes 单张图标大小上限（1MB）。超过则拒绝，避免磁盘被恶意塞满。
const maxIconBytes = 1 << 20

// fetchTimeout 回源下载超时。图标很小，10s 足够。
const fetchTimeout = 10 * time.Second

// Proxy 持有缓存目录与 HTTP 客户端。
type Proxy struct {
	dir    string
	client *http.Client

	// allowPrivate 为 true 时跳过环回/私有网段拦截。
	// 仅测试使用：httptest 服务器监听 127.0.0.1，生产必须保持 false。
	allowPrivate bool

	// mu 串行化「同一 URL 的并发首次回源」，避免重复下载与半写文件。
	mu sync.Mutex
}

// New 在 cacheDir 下创建图标缓存代理；目录不存在时自动创建。
// 生产路径：启用 SSRF 防护（拒绝环回与私有网段）。
func New(cacheDir string) (*Proxy, error) {
	return newProxy(cacheDir, false)
}

// NewForTest 与 New 相同，但放开环回/私有网段拦截，供 httptest 上游使用。
// 仅为测试导出；生产代码不得调用。
func NewForTest(cacheDir string) (*Proxy, error) {
	return newProxy(cacheDir, true)
}

// newProxy 内部构造器，allowPrivate 仅供测试放开内网限制。
func newProxy(cacheDir string, allowPrivate bool) (*Proxy, error) {
	if err := os.MkdirAll(cacheDir, 0o755); err != nil {
		return nil, fmt.Errorf("create icon cache dir: %w", err)
	}
	return &Proxy{
		dir:          cacheDir,
		client:       &http.Client{Timeout: fetchTimeout},
		allowPrivate: allowPrivate,
	}, nil
}

// Dir 返回缓存目录（供测试与诊断使用）。
func (p *Proxy) Dir() string { return p.dir }

// extFrom 依据 URL 路径的扩展名推导缓存文件后缀；无法识别时按 Content-Type 兜底。
// 始终返回以 "." 开头的小写扩展名，兜底为 ".bin"。
func extFrom(rawURL string, contentType string) string {
	if u, err := url.Parse(rawURL); err == nil {
		ext := strings.ToLower(filepath.Ext(u.Path))
		if isAllowedExt(ext) {
			return ext
		}
	}
	ct := strings.ToLower(strings.TrimSpace(strings.Split(contentType, ";")[0]))
	switch ct {
	case "image/svg+xml":
		return ".svg"
	case "image/png":
		return ".png"
	case "image/jpeg":
		return ".jpg"
	case "image/gif":
		return ".gif"
	case "image/webp":
		return ".webp"
	case "image/x-icon", "image/vnd.microsoft.icon":
		return ".ico"
	}
	return ".bin"
}

// isAllowedExt 白名单：只接受常见图片后缀，防止把 .php/.js 之类写进缓存目录。
func isAllowedExt(ext string) bool {
	switch ext {
	case ".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico":
		return true
	}
	return false
}

// cacheKey 由 URL 计算缓存文件名（sha256 十六进制 + 扩展名）。
func cacheKey(rawURL, contentType string) string {
	sum := sha256.Sum256([]byte(rawURL))
	return hex.EncodeToString(sum[:]) + extFrom(rawURL, contentType)
}

// cachePath 由 URL 计算「不含扩展名」的缓存路径前缀，用于命中查找。
func (p *Proxy) cachePrefix(rawURL string) string {
	sum := sha256.Sum256([]byte(rawURL))
	return filepath.Join(p.dir, hex.EncodeToString(sum[:]))
}

// findCached 在缓存目录中查找该 URL 已落盘的文件（扩展名未知，逐个尝试）。
// 返回空字符串表示未命中。
func (p *Proxy) findCached(rawURL string) string {
	prefix := p.cachePrefix(rawURL)
	for _, ext := range []string{".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".bin"} {
		candidate := prefix + ext
		if info, err := os.Stat(candidate); err == nil && !info.IsDir() && info.Size() > 0 {
			return candidate
		}
	}
	return ""
}

// validateTarget 校验目标 URL：仅允许 http/https，且解析后的 IP 不得落在环回/私有/链路本地网段。
// 当 p.allowPrivate 为 true（仅测试）时跳过网段拦截。
func (p *Proxy) validateTarget(rawURL string) (*url.URL, error) {
	u, err := url.Parse(rawURL)
	if err != nil {
		return nil, fmt.Errorf("url 解析失败")
	}
	if u.Scheme != "http" && u.Scheme != "https" {
		return nil, fmt.Errorf("仅支持 http/https")
	}
	host := u.Hostname()
	if host == "" {
		return nil, fmt.Errorf("缺少主机名")
	}
	if p.allowPrivate {
		return u, nil
	}
	// 先做字面 IP 判定（含 localhost 等主机名）
	if strings.EqualFold(host, "localhost") {
		return nil, fmt.Errorf("不允许访问本机地址")
	}
	if ip := net.ParseIP(host); ip != nil && isBlockedIP(ip) {
		return nil, fmt.Errorf("不允许访问内网地址")
	}
	// 域名则解析后逐个校验，防止 DNS 指向内网
	ips, err := net.LookupIP(host)
	if err != nil {
		return nil, fmt.Errorf("域名解析失败")
	}
	for _, ip := range ips {
		if isBlockedIP(ip) {
			return nil, fmt.Errorf("不允许访问内网地址")
		}
	}
	return u, nil
}

// isBlockedIP 判定 IP 是否属于环回 / 私有 / 链路本地 / 未指定地址。
func isBlockedIP(ip net.IP) bool {
	return ip.IsLoopback() || ip.IsPrivate() || ip.IsLinkLocalUnicast() ||
		ip.IsLinkLocalMulticast() || ip.IsUnspecified()
}

// Acquire 返回该 URL 对应的本地缓存路径；未命中时回源下载并落盘。
// 返回的 contentType 仅用于响应头（命中时按扩展名反推）。
func (p *Proxy) Acquire(rawURL string) (path string, contentType string, err error) {
	// 命中：直接返回
	if hit := p.findCached(rawURL); hit != "" {
		return hit, mimeFromExt(filepath.Ext(hit)), nil
	}

	if _, err := p.validateTarget(rawURL); err != nil {
		return "", "", err
	}

	// 串行化首次回源：同一 URL 并发请求只下载一次
	p.mu.Lock()
	defer p.mu.Unlock()
	// double-check：等待锁期间可能已被别的请求写入
	if hit := p.findCached(rawURL); hit != "" {
		return hit, mimeFromExt(filepath.Ext(hit)), nil
	}

	resp, err := p.client.Get(rawURL)
	if err != nil {
		return "", "", fmt.Errorf("回源下载失败")
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", "", fmt.Errorf("回源返回 %d", resp.StatusCode)
	}

	// 限长读取，防止超大响应占满磁盘
	body, err := io.ReadAll(io.LimitReader(resp.Body, maxIconBytes+1))
	if err != nil {
		return "", "", fmt.Errorf("读取响应失败")
	}
	if len(body) > maxIconBytes {
		return "", "", fmt.Errorf("图标超过 %d 字节上限", maxIconBytes)
	}

	ct := resp.Header.Get("Content-Type")
	final := p.cachePrefix(rawURL) + extFrom(rawURL, ct)
	// 先写临时文件再原子重命名，避免并发读到半截文件
	tmp, err := os.CreateTemp(p.dir, "tmp-*")
	if err != nil {
		return "", "", fmt.Errorf("创建缓存文件失败")
	}
	tmpName := tmp.Name()
	if _, err := tmp.Write(body); err != nil {
		tmp.Close()
		os.Remove(tmpName)
		return "", "", fmt.Errorf("写入缓存失败")
	}
	if err := tmp.Close(); err != nil {
		os.Remove(tmpName)
		return "", "", fmt.Errorf("关闭缓存文件失败")
	}
	if err := os.Rename(tmpName, final); err != nil {
		os.Remove(tmpName)
		return "", "", fmt.Errorf("提交缓存失败")
	}
	return final, mimeFromExt(filepath.Ext(final)), nil
}

// mimeFromExt 由扩展名反推 Content-Type，供命中缓存时的响应头使用。
func mimeFromExt(ext string) string {
	switch strings.ToLower(ext) {
	case ".svg":
		return "image/svg+xml"
	case ".png":
		return "image/png"
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".gif":
		return "image/gif"
	case ".webp":
		return "image/webp"
	case ".ico":
		return "image/x-icon"
	}
	return "application/octet-stream"
}
