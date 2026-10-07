package handler

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"

	"backend/internal/iconproxy"
)

// setupIconProxy 组装仅含图标代理路由的测试引擎（F8）。
func setupIconProxy(t *testing.T, cacheDir string) (*gin.Engine, *iconproxy.Proxy) {
	t.Helper()
	gin.SetMode(gin.TestMode)
	p, err := iconproxy.NewForTest(cacheDir)
	if err != nil {
		t.Fatalf("iconproxy.NewForTest: %v", err)
	}
	r := gin.New()
	r.GET("/icons/proxy", ProxyIcon(p))
	return r, p
}

// TestProxyIconServesAndCaches 覆盖：首次透传图标内容 → 二次走磁盘缓存（上游不再被访问）。
func TestProxyIconServesAndCaches(t *testing.T) {
	var upstreamHits int
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		upstreamHits++
		w.Header().Set("Content-Type", "image/svg+xml")
		_, _ = w.Write([]byte(`<svg xmlns="http://www.w3.org/2000/svg"><circle r="4"/></svg>`))
	}))
	defer upstream.Close()

	r, _ := setupIconProxy(t, t.TempDir())
	iconURL := upstream.URL + "/i.svg"
	target := "/icons/proxy?url=" + iconURL

	// 首次：回源
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, target, nil))
	if w.Code != http.StatusOK {
		t.Fatalf("首次 status=%d body=%s", w.Code, w.Body.String())
	}
	if body := w.Body.String(); !strings.Contains(body, "<circle") {
		t.Fatalf("响应体应含图标内容，实际 %q", body)
	}
	if ct := w.Header().Get("Content-Type"); !strings.Contains(ct, "svg") {
		t.Fatalf("Content-Type 应为 svg，实际 %q", ct)
	}
	if cc := w.Header().Get("Cache-Control"); !strings.Contains(cc, "max-age") {
		t.Fatalf("应带 Cache-Control，实际 %q", cc)
	}
	if upstreamHits != 1 {
		t.Fatalf("首次应回源 1 次，实际 %d", upstreamHits)
	}

	// 二次：命中缓存，上游命中数不变
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, httptest.NewRequest(http.MethodGet, target, nil))
	if w2.Code != http.StatusOK {
		t.Fatalf("二次 status=%d", w2.Code)
	}
	if w2.Body.String() != w.Body.String() {
		t.Fatalf("二次应返回与首次相同的缓存内容")
	}
	if upstreamHits != 1 {
		t.Fatalf("二次不应回源，上游命中数应仍为 1，实际 %d", upstreamHits)
	}
}

// TestProxyIconMissingURL 缺少 url 参数 → 400。
func TestProxyIconMissingURL(t *testing.T) {
	r, _ := setupIconProxy(t, t.TempDir())
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/icons/proxy", nil))
	if w.Code != http.StatusBadRequest {
		t.Fatalf("缺 url 应为 400，实际 %d", w.Code)
	}
	if got := w.Body.String(); !strings.Contains(got, "BadRequest") {
		t.Fatalf("应返回统一错误信封，实际 %s", got)
	}
}

// TestProxyIconUpstreamFailure 上游错误 → 502 且为统一错误信封（前端据此回退默认图标）。
func TestProxyIconUpstreamFailure(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer upstream.Close()

	r, _ := setupIconProxy(t, t.TempDir())
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/icons/proxy?url="+upstream.URL+"/bad.svg", nil))
	if w.Code != http.StatusBadGateway {
		t.Fatalf("上游失败应为 502，实际 %d", w.Code)
	}
	if got := w.Body.String(); !strings.Contains(got, "BadGateway") {
		t.Fatalf("应为统一错误信封，实际 %s", got)
	}
}
