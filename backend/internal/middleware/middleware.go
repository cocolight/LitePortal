package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"backend/internal/service"
)

// UserGuard 解析 x-user 请求头（缺省为 "guest"），确保用户存在，
// 并把数字 userId 注入请求上下文供后续 handler 使用。
// 注意：前端从不发送 x-user，因此默认的 guest 路径必须保留（不得改为必须先登录）。
func UserGuard(svc *service.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		username := c.GetHeader("x-user")
		if username == "" {
			username = "guest"
		}
		userID, err := svc.GetOrCreateUser(username)
		if err != nil {
			// 用户创建失败属于服务端错误
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"code":    500,
				"message": "Internal Server Error",
				"error":   "InternalServerError",
			})
			c.Abort()
			return
		}
		c.Set("userId", userID)
		c.Next()
	}
}
