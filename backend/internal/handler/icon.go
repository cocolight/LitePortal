package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"backend/internal/iconproxy"
)

// ProxyIcon 处理 GET /icons/proxy?url=<原图标地址>。
//
// 首次命中会回源下载并落盘，随后直接返回本地缓存文件；
// 响应头带长期 Cache-Control，让浏览器也缓存一层。
func ProxyIcon(p *iconproxy.Proxy) gin.HandlerFunc {
	return func(c *gin.Context) {
		raw := c.Query("url")
		if raw == "" {
			Fail(c, http.StatusBadRequest, "缺少 url 参数", "BadRequest")
			return
		}
		path, contentType, err := p.Acquire(raw)
		if err != nil {
			// 回源失败 / 目标非法统一按 502 返回，前端可回退到默认图标
			Fail(c, http.StatusBadGateway, err.Error(), "BadGateway")
			return
		}
		if contentType != "" {
			c.Header("Content-Type", contentType)
		}
		// 缓存一年；图标内容按 URL 不变，命中后浏览器不再回源
		c.Header("Cache-Control", "public, max-age=31536000, immutable")
		c.File(path)
	}
}
