// Package version 提供构建期注入的版本信息。
//
// Version 通过 `-ldflags "-X backend/internal/version.Version=v0.2.0"` 注入，
// 由 build.sh / pkg.yml / Dockerfile 三条链路统一从 git tag 取值。
// 未注入时（如 `go run .` 或 `go test`）回退为 "dev"，
// 保证本地开发不会因为缺少 ldflags 而报错或显示空字符串。
package version

import "fmt"

var (
	// Version 是语义化版本号，形如 "v0.2.0"；未注入时为 "dev"。
	Version = "dev"
	// Commit 是构建时的 git 提交短哈希；未注入时为空。
	Commit = ""
	// BuildTime 是构建时间（RFC3339）；未注入时为空。
	BuildTime = ""
)

// String 返回便于日志与健康检查输出的版本描述。
// 例如 "v0.2.0 (cbc5686, 2026-10-07T04:32:00Z)"；字段缺失时自动省略。
func String() string {
	s := Version
	var extra []string
	if Commit != "" {
		extra = append(extra, Commit)
	}
	if BuildTime != "" {
		extra = append(extra, BuildTime)
	}
	if len(extra) == 0 {
		return s
	}
	return fmt.Sprintf("%s (%s)", s, join(extra, ", "))
}

func join(items []string, sep string) string {
	out := ""
	for i, it := range items {
		if i > 0 {
			out += sep
		}
		out += it
	}
	return out
}
