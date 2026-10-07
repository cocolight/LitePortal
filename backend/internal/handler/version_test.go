package handler

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"backend/internal/version"
)

// TestVersionReturnsInjectedInfo 校验 /version 透传构建期注入的版本字段。
func TestVersionReturnsInjectedInfo(t *testing.T) {
	gin.SetMode(gin.TestMode)

	oldV, oldC, oldB := version.Version, version.Commit, version.BuildTime
	defer func() { version.Version, version.Commit, version.BuildTime = oldV, oldC, oldB }()
	version.Version, version.Commit, version.BuildTime = "v0.2.0", "cbc5686", "2026-10-07T04:32:00Z"

	r := gin.New()
	r.GET("/version", Version())

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/version", nil))

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusOK)
	}
	var resp struct {
		Success bool `json:"success"`
		Data    struct {
			Version    string `json:"version"`
			Commit     string `json:"commit"`
			BuildTime  string `json:"buildTime"`
			GoVersion  string `json:"goVersion"`
			FullString string `json:"fullString"`
		} `json:"data"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal: %v, body=%s", err, w.Body.String())
	}
	if !resp.Success {
		t.Error("success 应为 true")
	}
	if resp.Data.Version != "v0.2.0" {
		t.Errorf("version = %q, want %q", resp.Data.Version, "v0.2.0")
	}
	if resp.Data.Commit != "cbc5686" {
		t.Errorf("commit = %q, want %q", resp.Data.Commit, "cbc5686")
	}
	if resp.Data.GoVersion == "" {
		t.Error("goVersion 不应为空")
	}
	if resp.Data.FullString != "v0.2.0 (cbc5686, 2026-10-07T04:32:00Z)" {
		t.Errorf("fullString = %q", resp.Data.FullString)
	}
}

// TestVersionFallbackToDev 校验未注入 ldflags 时回退为 dev 而非空串。
func TestVersionFallbackToDev(t *testing.T) {
	gin.SetMode(gin.TestMode)

	oldV, oldC, oldB := version.Version, version.Commit, version.BuildTime
	defer func() { version.Version, version.Commit, version.BuildTime = oldV, oldC, oldB }()
	version.Version, version.Commit, version.BuildTime = "dev", "", ""

	r := gin.New()
	r.GET("/version", Version())

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/version", nil))

	var resp struct {
		Data struct {
			Version    string `json:"version"`
			FullString string `json:"fullString"`
		} `json:"data"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if resp.Data.Version != "dev" {
		t.Errorf("version = %q, want %q", resp.Data.Version, "dev")
	}
	if resp.Data.FullString != "dev" {
		t.Errorf("fullString = %q, want %q", resp.Data.FullString, "dev")
	}
}
