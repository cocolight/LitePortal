package iconproxy

import (
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
)

// newTestProxy 在临时目录建代理实例，并放开内网限制（httptest 服务器监听 127.0.0.1）。
func newTestProxy(t *testing.T) *Proxy {
	t.Helper()
	p, err := newProxy(t.TempDir(), true)
	if err != nil {
		t.Fatalf("newProxy: %v", err)
	}
	return p
}

// newStrictProxy 建一个启用 SSRF 防护的代理，用于安全相关断言。
func newStrictProxy(t *testing.T) *Proxy {
	t.Helper()
	p, err := New(t.TempDir())
	if err != nil {
		t.Fatalf("New: %v", err)
	}
	return p
}

// TestAcquireCachesToDisk 验证核心缓存行为：首次回源落盘、二次直接命中且不再回源。
func TestAcquireCachesToDisk(t *testing.T) {
	var hits int
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hits++
		w.Header().Set("Content-Type", "image/svg+xml")
		_, _ = w.Write([]byte(`<svg xmlns="http://www.w3.org/2000/svg"></svg>`))
	}))
	defer srv.Close()

	p := newTestProxy(t)

	path1, ct1, err := p.Acquire(srv.URL + "/icon.svg")
	if err != nil {
		t.Fatalf("first Acquire: %v", err)
	}
	if hits != 1 {
		t.Fatalf("首次应回源 1 次，实际 %d", hits)
	}
	if ct1 != "image/svg+xml" {
		t.Fatalf("contentType 应为 image/svg+xml，实际 %q", ct1)
	}
	if !strings.HasSuffix(path1, ".svg") {
		t.Fatalf("缓存文件应带 .svg 后缀，实际 %q", path1)
	}
	if info, err := os.Stat(path1); err != nil || info.Size() == 0 {
		t.Fatalf("缓存文件应已落盘且非空: %v", err)
	}

	// 二次请求：应命中缓存，不再回源
	path2, _, err := p.Acquire(srv.URL + "/icon.svg")
	if err != nil {
		t.Fatalf("second Acquire: %v", err)
	}
	if hits != 1 {
		t.Fatalf("二次请求不应回源，回源次数仍应为 1，实际 %d", hits)
	}
	if path2 != path1 {
		t.Fatalf("二次应命中同一文件：%q vs %q", path1, path2)
	}
}

// TestCachedSurvivesNewProxy 验证「重启后仍命中」——换一个 Proxy 实例指向同一目录。
func TestCachedSurvivesNewProxy(t *testing.T) {
	var hits int
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hits++
		w.Header().Set("Content-Type", "image/png")
		_, _ = w.Write([]byte("PNGDATA"))
	}))
	defer srv.Close()

	dir := t.TempDir()
	p1, err := newProxy(dir, true)
	if err != nil {
		t.Fatalf("New p1: %v", err)
	}
	if _, _, err := p1.Acquire(srv.URL + "/a.png"); err != nil {
		t.Fatalf("p1 Acquire: %v", err)
	}

	// 模拟进程重启：新实例、同目录
	p2, err := newProxy(dir, true)
	if err != nil {
		t.Fatalf("New p2: %v", err)
	}
	if _, _, err := p2.Acquire(srv.URL + "/a.png"); err != nil {
		t.Fatalf("p2 Acquire: %v", err)
	}
	if hits != 1 {
		t.Fatalf("重启后应命中磁盘缓存，回源次数仍为 1，实际 %d", hits)
	}
}

// TestAcquireRejectsNonHTTP 验证协议白名单。
func TestAcquireRejectsNonHTTP(t *testing.T) {
	p := newStrictProxy(t)
	for _, raw := range []string{"file:///etc/passwd", "ftp://example.com/a.png", "javascript:alert(1)"} {
		if _, _, err := p.Acquire(raw); err == nil {
			t.Fatalf("%q 应被拒绝", raw)
		}
	}
}

// TestAcquireRejectsPrivateTargets 验证 SSRF 防护：环回 / 私有网段一律拒绝。
func TestAcquireRejectsPrivateTargets(t *testing.T) {
	p := newStrictProxy(t)
	for _, raw := range []string{
		"http://localhost/icon.svg",
		"http://127.0.0.1/icon.svg",
		"http://10.0.0.1/icon.svg",
		"http://192.168.1.1/icon.svg",
		"http://172.16.0.1/icon.svg",
		"http://169.254.169.254/latest/meta-data/", // 云元数据地址
	} {
		if _, _, err := p.Acquire(raw); err == nil {
			t.Fatalf("%q 应被 SSRF 白名单拒绝", raw)
		}
	}
}

// TestAcquireRejectsOversize 验证超过 1MB 上限的响应被拒绝且不落盘。
func TestAcquireRejectsOversize(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "image/png")
		big := make([]byte, maxIconBytes+1024)
		_, _ = w.Write(big)
	}))
	defer srv.Close()

	p := newTestProxy(t)
	if _, _, err := p.Acquire(srv.URL + "/big.png"); err == nil {
		t.Fatal("超大响应应被拒绝")
	}
	// 确认目录里没有留下残留文件
	entries, _ := os.ReadDir(p.Dir())
	for _, e := range entries {
		if strings.HasPrefix(e.Name(), "tmp-") {
			t.Fatalf("失败后不应留下临时文件: %s", e.Name())
		}
	}
}

// TestAcquireRejectsUpstreamError 验证上游非 200 时返回错误。
func TestAcquireRejectsUpstreamError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	}))
	defer srv.Close()

	p := newTestProxy(t)
	if _, _, err := p.Acquire(srv.URL + "/missing.svg"); err == nil {
		t.Fatal("上游 404 应返回错误")
	}
}

// TestExtFrom 覆盖扩展名推导与 Content-Type 兜底。
func TestExtFrom(t *testing.T) {
	cases := []struct {
		raw, ct, want string
	}{
		{"https://a.com/i.svg", "", ".svg"},
		{"https://a.com/i.png?v=2", "", ".png"},
		{"https://a.com/i.ico", "", ".ico"},
		{"https://a.com/noext", "image/webp", ".webp"},
		{"https://a.com/noext", "image/svg+xml; charset=utf-8", ".svg"},
		{"https://a.com/noext", "text/html", ".bin"},
		{"https://a.com/evil.php", "text/html", ".bin"}, // 非白名单后缀不得直接采用
	}
	for _, c := range cases {
		if got := extFrom(c.raw, c.ct); got != c.want {
			t.Errorf("extFrom(%q,%q)=%q, want %q", c.raw, c.ct, got, c.want)
		}
	}
}

// TestCacheKeyIsStableAndUnique 验证同一 URL 稳定、不同 URL 不碰撞。
func TestCacheKeyIsStableAndUnique(t *testing.T) {
	a := cacheKey("https://a.com/x.png", "image/png")
	b := cacheKey("https://a.com/x.png", "image/png")
	c := cacheKey("https://a.com/y.png", "image/png")
	if a != b {
		t.Fatalf("同 URL 应得同 key: %q vs %q", a, b)
	}
	if a == c {
		t.Fatalf("不同 URL 不应同 key: %q", a)
	}
	if !strings.HasSuffix(a, ".png") {
		t.Fatalf("key 应带扩展名: %q", a)
	}
}

// TestFindCachedIgnoresEmptyFile 验证零字节缓存文件不算命中（防止半写文件被当有效）。
func TestFindCachedIgnoresEmptyFile(t *testing.T) {
	p := newTestProxy(t)
	raw := "https://a.com/empty.svg"
	// 手动造一个空文件
	if err := os.WriteFile(p.cachePrefix(raw)+".svg", nil, 0o644); err != nil {
		t.Fatalf("write: %v", err)
	}
	if got := p.findCached(raw); got != "" {
		t.Fatalf("空文件不应算命中，实际返回 %q", got)
	}
}
