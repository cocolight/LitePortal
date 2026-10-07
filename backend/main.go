package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/schema"

	"backend/internal/config"
	"backend/internal/handler"
	"backend/internal/iconproxy"
	"backend/internal/middleware"
	"backend/internal/repository"
	"backend/internal/service"
	"backend/internal/version"
)

func main() {
	config.LoadEnv()    // 加载 .env / .env.<NODE_ENV>（进程环境变量优先级最高）
	cfg := config.New() // 从环境构建配置，套用默认值

	// 非 debug 模式时，Gin 切换到 ReleaseMode（关闭调试日志与多余输出）
	if cfg.LogLevel != "debug" {
		gin.SetMode(gin.ReleaseMode)
	}

	// 确保数据库文件所在目录存在，避免首次启动因目录缺失而打开失败
	if dir := filepath.Dir(cfg.DBPath); dir != "" && dir != "." {
		_ = os.MkdirAll(dir, 0o755)
	}

	// 打开 SQLite（modernc.org/sqlite 纯 Go 实现，无 CGO）；使用单数表名策略以对齐 schema.sql
	db, err := gorm.Open(sqlite.Open(cfg.DBPath), &gorm.Config{
		NamingStrategy: schema.NamingStrategy{SingularTable: true},
	})
	if err != nil {
		log.Fatalf("open db: %v", err)
	}
	// 启动时按 migrations/schema.sql 建表（生产环境的建表依据）
	if err := runSchema(db); err != nil {
		log.Fatalf("run schema: %v", err)
	}

	// 组装仓储 → 服务层
	repo := repository.New(db)
	svc := service.New(repo)
	// 若开启 INIT_DATA，则幂等写入 guest 用户与示例链接
	if cfg.InitData {
		if err := svc.Seed(); err != nil {
			log.Fatalf("seed: %v", err)
		}
	}

	// 在线图标代理 + 磁盘缓存（F8）：缓存目录与数据库同属 data/ 下
	iconProxy, err := iconproxy.New(iconCacheDir(cfg))
	if err != nil {
		log.Fatalf("init icon proxy: %v", err)
	}

	// 初始化 Gin 引擎，注册日志与恢复中间件，以及 CORS
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())
	r.Use(corsMiddleware())

	// 图标代理：公共资源，不经 UserGuard（浏览器 <img> 不会携带 x-user）
	r.GET("/icons/proxy", handler.ProxyIcon(iconProxy))

	// 版本信息：公共资源，供运维探活与问题排查使用，不涉及用户数据
	r.GET("/version", handler.Version())

	// 业务路由（无 /api 前缀，与前端约定一致）；全部经过 UserGuard 注入 userId
	api := r.Group("")
	api.Use(middleware.UserGuard(svc))
	api.GET("/links", handler.ListLinks(svc))
	api.GET("/links/:linkId", handler.GetLink(svc))
	api.POST("/links", handler.CreateLink(svc))
	api.PUT("/links/:linkId", handler.UpdateLink(svc))
	api.DELETE("/links/:linkId", handler.DeleteLink(svc))
	// CORS 预检：对 links 相关路由直接返回 204
	api.OPTIONS("/links", func(c *gin.Context) { c.AbortWithStatus(http.StatusNoContent) })
	api.OPTIONS("/links/:linkId", func(c *gin.Context) { c.AbortWithStatus(http.StatusNoContent) })

	// 静态资源托管 + history 模式回退（深链刷新不再 404）
	webDir := resolveWebDir(cfg)
	if webDir != "" {
		r.NoRoute(spaFallback(webDir))
	} else {
		// 未找到前端资源时，非 API 路径返回 404
		r.NoRoute(func(c *gin.Context) {
			handler.Fail(c, http.StatusNotFound, "Not Found", "NotFound")
		})
	}

	addr := ":" + cfg.Port
	// 启动日志带上版本，便于用户报告问题时直接对照
	log.Printf("LitePortal %s listening on %s", version.String(), addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("run: %v", err)
	}
}

// runSchema 执行 migrations/schema.sql 建立生产表结构。
func runSchema(db *gorm.DB) error {
	path := resolveSchemaPath()
	if path == "" {
		return fmt.Errorf("migrations/schema.sql not found")
	}
	content, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	// 按分号切分逐条执行（简单建表语句，无需事务）
	for _, stmt := range strings.Split(string(content), ";") {
		stmt = strings.TrimSpace(stmt)
		if stmt == "" {
			continue
		}
		if err := db.Exec(stmt).Error; err != nil {
			return fmt.Errorf("exec schema stmt: %w", err)
		}
	}
	return nil
}

// iconCacheDir 返回图标磁盘缓存目录：与 SQLite 数据库同处一个 data/ 层级，
// 例如 DB_PATH=./data/liteportal.sqlite → ./data/icons。
func iconCacheDir(cfg *config.Config) string {
	base := filepath.Dir(cfg.DBPath)
	if base == "" || base == "." {
		return "icons"
	}
	return filepath.Join(base, "icons")
}

// resolveSchemaPath 在候选目录中查找 migrations/schema.sql，返回首个命中的路径。
func resolveSchemaPath() string {
	for _, dir := range candidateDirs() {
		p := filepath.Join(dir, "migrations", "schema.sql")
		if _, err := os.Stat(p); err == nil {
			return p
		}
	}
	return ""
}

// resolveWebDir 在候选目录中查找前端静态资源目录（WebRoot），返回首个命中的目录。
func resolveWebDir(cfg *config.Config) string {
	for _, dir := range candidateDirs() {
		p := filepath.Join(dir, cfg.WebRoot)
		if info, err := os.Stat(p); err == nil && info.IsDir() {
			return p
		}
	}
	return ""
}

// candidateDirs 返回查找资源（schema.sql / web）的候选目录：可执行文件目录 + 当前工作目录（去重）。
// 这样 `go run .`（cwd=backend）与打包运行（exe=dist/server, cwd=dist）都能正确定位。
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

// corsMiddleware 实现全局 CORS：允许任意来源与常见方法/请求头；预检直接返回 204。
// 当前为放开策略（Allow-Origin: *），后续如需限制可在此收紧。
func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "*")
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}

// spaFallback 从 webDir 提供静态文件；其余 GET 请求统一回退到 index.html（history 模式回退）。
// 以 /api 开头的路径视为未匹配接口，返回 404 而非 index.html，避免吞掉真实 404。
func spaFallback(webDir string) gin.HandlerFunc {
	webAbs, _ := filepath.Abs(webDir)
	return func(c *gin.Context) {
		if c.Request.Method != http.MethodGet {
			handler.Fail(c, http.StatusNotFound, "Not Found", "NotFound")
			return
		}
		reqPath := c.Request.URL.Path
		// API 路径不回退到 index.html，直接 404
		if strings.HasPrefix(reqPath, "/api") {
			handler.Fail(c, http.StatusNotFound, "Not Found", "NotFound")
			return
		}
		filePath := filepath.Join(webAbs, filepath.Clean(reqPath))
		// 防目录穿越：拼接后必须仍位于 web 目录内
		if !strings.HasPrefix(filePath, webAbs) {
			handler.Fail(c, http.StatusNotFound, "Not Found", "NotFound")
			return
		}
		if info, err := os.Stat(filePath); err == nil && !info.IsDir() {
			c.File(filePath)
			return
		}
		// 文件不存在则回退到 index.html（SPA 路由由前端处理）
		index := filepath.Join(webAbs, "index.html")
		if _, err := os.Stat(index); err == nil {
			c.File(index)
			return
		}
		handler.Fail(c, http.StatusNotFound, "Not Found", "NotFound")
	}
}
