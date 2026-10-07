package handler

import (
	"net/http"
	"runtime"

	"github.com/gin-gonic/gin"

	"backend/internal/version"
)

// Version 处理 GET /version，返回构建期注入的版本信息。
//
// 公共资源（不经 UserGuard）：版本号用于运维探活与问题排查，
// 不涉及任何用户数据，无需鉴权即可查询。
func Version() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, ApiResponse{
			Success: true,
			Code:    200,
			Message: "success",
			Data: gin.H{
				"version":    version.Version,
				"commit":     version.Commit,
				"buildTime":  version.BuildTime,
				"goVersion":  runtime.Version(),
				"fullString": version.String(),
			},
		})
	}
}
