package config

import (
	"os"
	"path/filepath"
	"testing"
)

// TestLoadEnvPriority 验证文档化的三层优先级模型：
//
//	进程环境变量（①） > 本地 .env（②） > 入库的 .env.<NODE_ENV>（③）。
//
// 本地 .env 必须能覆盖入库的模式文件；进程环境变量优先级最高。
func TestLoadEnvPriority(t *testing.T) {
	dir := t.TempDir()
	// ② 本地 .env：PORT=3000
	writeFile(t, filepath.Join(dir, ".env"), "PORT=3000\n")
	// ③ 入库默认值 .env.development：PORT=8080
	writeFile(t, filepath.Join(dir, ".env.development"), "PORT=8080\n")

	// ① 进程环境变量必须最高（即便本地 .env 已设值）。
	os.Setenv("PORT", "9999")
	os.Setenv("NODE_ENV", "development")

	oldWd, _ := os.Getwd()
	if err := os.Chdir(dir); err != nil {
		t.Fatalf("chdir: %v", err)
	}
	defer os.Chdir(oldWd)
	// 环境变量是进程级全局；chdir 后重新断言（防御性）。
	os.Setenv("PORT", "9999")
	os.Setenv("NODE_ENV", "development")

	LoadEnv()
	if got := os.Getenv("PORT"); got != "9999" {
		t.Fatalf("进程环境变量应最高，实际=%q", got)
	}

	// 清除进程 PORT：② 本地 .env 必须覆盖 ③ .env.development。
	os.Unsetenv("PORT")
	LoadEnv()
	if got := os.Getenv("PORT"); got != "3000" {
		t.Fatalf("plain .env 应覆盖 .env.development，实际=%q（bug：模式文件胜出）", got)
	}
}

// writeFile 是测试辅助函数，写文件失败则直接让用例失败。
func writeFile(t *testing.T, path, content string) {
	t.Helper()
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		t.Fatalf("write %s: %v", path, err)
	}
}
