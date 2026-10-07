package version

import "testing"

// TestStringShowsVersionOnly 校验未注入 commit / 构建时间时只输出版本号本身。
func TestStringShowsVersionOnly(t *testing.T) {
	// 保存并在用例结束后还原，避免影响其他用例。
	oldV, oldC, oldB := Version, Commit, BuildTime
	defer func() { Version, Commit, BuildTime = oldV, oldC, oldB }()

	Version, Commit, BuildTime = "v0.2.0", "", ""
	if got := String(); got != "v0.2.0" {
		t.Fatalf("String() = %q, want %q", got, "v0.2.0")
	}
}

// TestStringShowsFullInfo 校验注入了 commit 与构建时间时输出完整描述。
func TestStringShowsFullInfo(t *testing.T) {
	oldV, oldC, oldB := Version, Commit, BuildTime
	defer func() { Version, Commit, BuildTime = oldV, oldC, oldB }()

	Version, Commit, BuildTime = "v0.2.0", "cbc5686", "2026-10-07T04:32:00Z"
	want := "v0.2.0 (cbc5686, 2026-10-07T04:32:00Z)"
	if got := String(); got != want {
		t.Fatalf("String() = %q, want %q", got, want)
	}
}

// TestDefaultVersion 校验包默认值是 dev —— 保证未经 ldflags 注入时不会显示空串。
func TestDefaultVersion(t *testing.T) {
	if Version == "" {
		t.Fatal("Version 默认值不应为空，应为 dev")
	}
}
