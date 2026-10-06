package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/schema"

	"backend/internal/middleware"
	"backend/internal/repository"
	"backend/internal/service"
)

// setupTest 构建一条带完整中间件与路由的测试引擎（使用临时 SQLite 库）。
func setupTest(t *testing.T) *gin.Engine {
	t.Helper()
	gin.SetMode(gin.TestMode)

	// 用临时目录下的 SQLite 文件，避免污染真实数据
	dbPath := filepath.Join(t.TempDir(), "test.sqlite")
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		NamingStrategy: schema.NamingStrategy{SingularTable: true},
	})
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	// 清理时关闭 SQLite 句柄，否则 Windows 上 t.TempDir 删除目录会因文件锁失败
	if sqlDB, cerr := db.DB(); cerr == nil {
		t.Cleanup(func() { _ = sqlDB.Close() })
	}
	// 复用与生产一致的 schema.sql 建表
	schemaPath := filepath.Join("..", "..", "migrations", "schema.sql")
	content, err := os.ReadFile(schemaPath)
	if err != nil {
		t.Fatalf("read schema: %v", err)
	}
	for _, stmt := range strings.Split(string(content), ";") {
		stmt = strings.TrimSpace(stmt)
		if stmt == "" {
			continue
		}
		if err := db.Exec(stmt).Error; err != nil {
			t.Fatalf("exec schema: %v", err)
		}
	}

	repo := repository.New(db)
	svc := service.New(repo)

	// 组装与 main 一致的路由（无 /api 前缀）
	r := gin.New()
	api := r.Group("")
	api.Use(middleware.UserGuard(svc))
	api.GET("/links", ListLinks(svc))
	api.GET("/links/:linkId", GetLink(svc))
	api.POST("/links", CreateLink(svc))
	api.PUT("/links/:linkId", UpdateLink(svc))
	api.DELETE("/links/:linkId", DeleteLink(svc))
	return r
}

// decodeBody 把响应体解析为 map，便于断言。
func decodeBody(t *testing.T, w *httptest.ResponseRecorder) map[string]interface{} {
	t.Helper()
	var out map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &out); err != nil {
		t.Fatalf("decode body: %v (body=%s)", err, w.Body.String())
	}
	return out
}

// TestLinksFlow 覆盖完整链路：空列表 → 创建 → 未知字段拦截 → 局部更新 → 软删排除 → 删不存在 404。
func TestLinksFlow(t *testing.T) {
	r := setupTest(t)

	// GET 空列表
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/links", nil))
	if w.Code != http.StatusOK {
		t.Fatalf("GET /links status = %d", w.Code)
	}
	body := decodeBody(t, w)
	if body["success"] != true {
		t.Fatalf("expected success")
	}
	data := body["data"].(map[string]interface{})
	if links, ok := data["links"].([]interface{}); !ok || len(links) != 0 {
		t.Fatalf("expected empty links, got %v", data["links"])
	}

	// POST 创建
	payload := `{"name":"Test","onlineIcon":"https://e/x.ico","intUrl":"https://e","extUrl":"https://e","iconType":"online_icon"}`
	w = httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodPost, "/links", bytes.NewBufferString(payload)))
	if w.Code != http.StatusCreated {
		t.Fatalf("POST /links status = %d body=%s", w.Code, w.Body.String())
	}
	body = decodeBody(t, w)
	data = body["data"].(map[string]interface{})
	link := data["link"].(map[string]interface{})
	linkID, _ := link["linkId"].(string)
	if linkID == "" {
		t.Fatalf("expected linkId in response, got %v", link)
	}
	if link["name"] != "Test" {
		t.Fatalf("expected name Test, got %v", link["name"])
	}

	// GET 详情：存在 → 200，且字段与创建一致
	w = httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/links/"+linkID, nil))
	if w.Code != http.StatusOK {
		t.Fatalf("GET detail status = %d body=%s", w.Code, w.Body.String())
	}
	body = decodeBody(t, w)
	data = body["data"].(map[string]interface{})
	link = data["link"].(map[string]interface{})
	if link["name"] != "Test" || link["onlineIcon"] != "https://e/x.ico" {
		t.Fatalf("unexpected detail payload: %v", link)
	}

	// GET 不存在的详情 → 404
	w = httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/links/does-not-exist", nil))
	if w.Code != http.StatusNotFound {
		t.Fatalf("GET detail missing status = %d (want 404)", w.Code)
	}

	// 未知字段 → 400
	w = httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodPost, "/links", bytes.NewBufferString(`{"name":"X","bogus":1}`)))
	if w.Code != http.StatusBadRequest {
		t.Fatalf("unknown field status = %d (want 400)", w.Code)
	}

	// PUT 局部更新（仅 name）
	w = httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodPut, "/links/"+linkID, bytes.NewBufferString(`{"name":"Renamed"}`)))
	if w.Code != http.StatusOK {
		t.Fatalf("PUT status = %d body=%s", w.Code, w.Body.String())
	}
	body = decodeBody(t, w)
	data = body["data"].(map[string]interface{})
	link = data["link"].(map[string]interface{})
	if link["name"] != "Renamed" {
		t.Fatalf("expected Renamed, got %v", link["name"])
	}
	// 未提供的字段应保留原值
	if link["onlineIcon"] != "https://e/x.ico" {
		t.Fatalf("expected onlineIcon preserved, got %v", link["onlineIcon"])
	}

	// 更新后 GET 应返回 1 条
	w = httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/links", nil))
	body = decodeBody(t, w)
	data = body["data"].(map[string]interface{})
	links := data["links"].([]interface{})
	if len(links) != 1 {
		t.Fatalf("expected 1 link, got %d", len(links))
	}

	// DELETE
	w = httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodDelete, "/links/"+linkID, nil))
	if w.Code != http.StatusOK {
		t.Fatalf("DELETE status = %d", w.Code)
	}

	// 删除后 GET 应为空（软删自动排除）
	w = httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/links", nil))
	body = decodeBody(t, w)
	data = body["data"].(map[string]interface{})
	links = data["links"].([]interface{})
	if len(links) != 0 {
		t.Fatalf("expected 0 links after soft delete, got %d", len(links))
	}

	// DELETE 不存在 → 404
	w = httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodDelete, "/links/does-not-exist", nil))
	if w.Code != http.StatusNotFound {
		t.Fatalf("DELETE missing status = %d (want 404)", w.Code)
	}
}
