package config

import (
	"bufio"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

// Config 保存 Go 后端的全部运行时配置。
type Config struct {
	Port        string // 监听端口，默认 "3000"
	NodeEnv     string // 运行环境：development / production，默认 development
	DBPath      string // SQLite 数据库文件路径，默认 ./data/liteportal.sqlite
	MaxBodySize string // 请求体大小上限，支持 "10kb" / "10mb"，默认 10kb
	LogLevel    string // 日志级别：debug / info / warn / error；debug 会开启 Gin 访问日志
	InitData    bool   // 是否在启动时写入初始化数据（guest + 示例链接）
	WebRoot     string // 前端静态资源目录名，默认 web（相对可执行文件或工作目录）
}

// LoadEnv 从「可执行文件所在目录」与「当前工作目录」加载 .env 与 .env.<NODE_ENV>。
// 优先级（高 → 低）：① 进程已有环境变量（永不被覆盖）→ ② 本地 .env（仓库外覆盖层）→ ③ 入库的 .env.<NODE_ENV>（默认值）。
// 先加载 plain .env（本地覆盖层），再加载入库的 .env.<NODE_ENV>（默认值）；
// applyEnvFile 仅在键未设置时写入，因此越早加载的文件越优先，使本地 .env 能覆盖入库默认值（ADR-0002：② > ③）。
func LoadEnv() {
	nodeEnv := os.Getenv("NODE_ENV")
	if nodeEnv == "" {
		nodeEnv = "development"
		os.Setenv("NODE_ENV", nodeEnv)
	}
	// 先加载本地 .env（仓库外覆盖层），再加载入库的 .env.<NODE_ENV>（默认值）。
	// applyEnvFile 只在键未设置时写入，故先加载者胜出：本地 .env 可覆盖入库默认值。
	loadDotEnvFile("")      // plain .env（本地覆盖层）
	loadDotEnvFile(nodeEnv) // .env.<NODE_ENV>（入库默认值）
}

// loadDotEnvFile 按给定后缀读取 .env 或 .env.<suffix>，从候选目录依次尝试。
func loadDotEnvFile(suffix string) {
	name := ".env"
	if suffix != "" {
		name = ".env." + suffix
	}
	for _, dir := range candidateDirs() {
		applyEnvFile(filepath.Join(dir, name))
	}
}

// candidateDirs 返回配置文件的候选目录：先可执行文件所在目录，再当前工作目录（去重）。
// 这样无论 `go run .`（cwd=backend）还是生产部署（exe=dist/server，cwd=dist）都能找到 .env 与 web/。
func candidateDirs() []string {
	dirs := []string{}
	if exe, err := os.Executable(); err == nil {
		dirs = append(dirs, filepath.Dir(exe))
	}
	if wd, err := os.Getwd(); err == nil {
		dirs = append(dirs, wd)
	}
	seen := map[string]bool{}
	out := make([]string, 0, len(dirs))
	for _, d := range dirs {
		if !seen[d] {
			seen[d] = true
			out = append(out, d)
		}
	}
	return out
}

// applyEnvFile 解析单个 .env 文件，仅把「进程环境中尚未存在」的键写入 os 环境。
// 这样可以保证：进程环境变量（①）最高；同文件内后出现的同名键不会覆盖先前的设置。
func applyEnvFile(path string) {
	f, err := os.Open(path)
	if err != nil {
		return // 文件不存在则跳过（.env 与 .env.<NODE_ENV> 都可能缺）
	}
	defer f.Close()
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue // 跳过空行与注释
		}
		idx := strings.Index(line, "=")
		if idx < 0 {
			continue // 非 KEY=VALUE 格式，跳过
		}
		key := strings.TrimSpace(line[:idx])
		val := strings.TrimSpace(line[idx+1:])
		val = strings.Trim(val, `"'`) // 去掉可能的引号包裹
		if os.Getenv(key) == "" {
			os.Setenv(key, val)
		}
	}
}

// New 从进程环境构建 Config，并套用文档化的默认值。
func New() *Config {
	return &Config{
		Port:        getEnv("PORT", "3000"),
		NodeEnv:     getEnv("NODE_ENV", "development"),
		DBPath:      getEnv("DB_PATH", "./data/liteportal.sqlite"),
		MaxBodySize: getEnv("MAX_BODY_SIZE", "10kb"),
		LogLevel:    getEnv("LOG_LEVEL", "info"),
		InitData:    os.Getenv("INIT_DATA") == "true",
		WebRoot:     getEnv("WEB_ROOT", "web"),
	}
}

// getEnv 读取环境变量，缺失或为空时返回默认值 def。
func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

// MaxBodyBytes 把 MaxBodySize（"10kb"/"10mb"）解析为字节数，供 Gin 的 body 限制使用。
// 解析失败时兜底返回 10MB，避免零值导致请求被全部拒绝。
func (c *Config) MaxBodyBytes() int64 {
	s := strings.ToLower(c.MaxBodySize)
	mult := int64(1)
	switch {
	case strings.HasSuffix(s, "mb"):
		mult = 1024 * 1024
		s = strings.TrimSuffix(s, "mb")
	case strings.HasSuffix(s, "kb"):
		mult = 1024
		s = strings.TrimSuffix(s, "kb")
	}
	n, err := strconv.ParseInt(strings.TrimSpace(s), 10, 64)
	if err != nil {
		return 10 * 1024 * 1024 // 解析失败兜底 10MB
	}
	return n * mult
}
