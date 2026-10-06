package handler

import (
	"encoding/json"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"

	"backend/internal/model"
	"backend/internal/service"
)

// ApiResponse 是成功响应的信封结构（等价于 NestJS 的 ApiResponseDto）。
// 形如 {success, code, message, data}。
type ApiResponse struct {
	Success bool        `json:"success"`
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// ApiError 是错误响应的信封结构（等价于 NestJS 的 ApiErrorDto）。
type ApiError struct {
	Success bool   `json:"success"`
	Code    int    `json:"code"`
	Message string `json:"message"`
	Error   string `json:"error"`
}

// ok 返回 200 成功响应。
func ok(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, ApiResponse{Success: true, Code: 200, Message: "success", Data: data})
}

// created 返回 201 创建响应（与 NestJS 行为一致，code 仍写 200）。
func created(c *gin.Context, data interface{}) {
	c.JSON(http.StatusCreated, ApiResponse{Success: true, Code: 200, Message: "success", Data: data})
}

// Fail 写入错误信封。导出以便 main 在 SPA 回退中复用。
func Fail(c *gin.Context, httpStatus int, message, errName string) {
	c.JSON(httpStatus, ApiError{Success: false, Code: httpStatus, Message: message, Error: errName})
}

// ListLinks 处理 GET /links，返回当前用户的链接列表（data.links）。
func ListLinks(svc *service.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.MustGet("userId").(uint)
		links, err := svc.GetLinks(userID)
		if err != nil {
			Fail(c, http.StatusInternalServerError, "Internal Server Error", "InternalServerError")
			return
		}
		ok(c, gin.H{"links": links})
	}
}

// GetLink 处理 GET /links/:linkId，返回单条链接（data.link）；不存在或无权访问时 404。
func GetLink(svc *service.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.MustGet("userId").(uint)
		linkID := c.Param("linkId")
		resp, err := svc.GetLink(userID, linkID)
		if err != nil {
			if err == service.ErrNotFound {
				Fail(c, http.StatusNotFound, "链接不存在或无权操作", "NotFound")
				return
			}
			Fail(c, http.StatusInternalServerError, "Internal Server Error", "InternalServerError")
			return
		}
		ok(c, gin.H{"link": resp})
	}
}

// CreateLink 处理 POST /links（返回 201，模仿 NestJS 行为）。
func CreateLink(svc *service.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.MustGet("userId").(uint)
		req, _, okFlag := bindLinkRequest(c)
		if !okFlag {
			return // bindLinkRequest 内部已写入错误响应
		}
		if req.Name == "" {
			Fail(c, http.StatusBadRequest, "name 不能为空", "ValidationError")
			return
		}
		resp, err := svc.CreateLink(userID, req)
		if err != nil {
			Fail(c, http.StatusInternalServerError, "Internal Server Error", "InternalServerError")
			return
		}
		created(c, gin.H{"link": resp})
	}
}

// UpdateLink 处理 PUT /links/:linkId，局部更新指定链接。
func UpdateLink(svc *service.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.MustGet("userId").(uint)
		linkID := c.Param("linkId")
		req, present, okFlag := bindLinkRequest(c)
		if !okFlag {
			return
		}
		resp, err := svc.UpdateLink(userID, linkID, req, present)
		if err != nil {
			if err == service.ErrNotFound {
				Fail(c, http.StatusNotFound, "链接不存在或无权操作", "NotFound")
				return
			}
			Fail(c, http.StatusInternalServerError, "Internal Server Error", "InternalServerError")
			return
		}
		ok(c, gin.H{"link": resp})
	}
}

// DeleteLink 处理 DELETE /links/:linkId，软删并返回删除前快照。
func DeleteLink(svc *service.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.MustGet("userId").(uint)
		linkID := c.Param("linkId")
		resp, err := svc.DeleteLink(userID, linkID)
		if err != nil {
			if err == service.ErrNotFound {
				Fail(c, http.StatusNotFound, "链接不存在或无权操作", "NotFound")
				return
			}
			Fail(c, http.StatusInternalServerError, "Internal Server Error", "InternalServerError")
			return
		}
		ok(c, gin.H{"link": resp})
	}
}

// bindLinkRequest 读取请求体：拒绝白名单外的未知字段（等价于 NestJS forbidNonWhitelisted），
// 返回解析后的 LinkRequest 以及「请求中显式出现的键集合」（用于局部更新判断）。
func bindLinkRequest(c *gin.Context) (model.LinkRequest, map[string]bool, bool) {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		Fail(c, http.StatusBadRequest, "请求体读取失败", "BadRequest")
		return model.LinkRequest{}, nil, false
	}
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(body, &raw); err != nil {
		Fail(c, http.StatusBadRequest, "请求体不是合法 JSON", "BadRequest")
		return model.LinkRequest{}, nil, false
	}
	present := make(map[string]bool, len(raw))
	for k := range raw {
		if !model.AllowedLinkFields[k] {
			// 命中白名单外的键 → 400（防止客户端注入未定义字段）
			Fail(c, http.StatusBadRequest, "未知字段: "+k, "BadRequest")
			return model.LinkRequest{}, nil, false
		}
		present[k] = true
	}
	var req model.LinkRequest
	if err := json.Unmarshal(body, &req); err != nil {
		Fail(c, http.StatusBadRequest, "请求体解析失败", "BadRequest")
		return model.LinkRequest{}, nil, false
	}
	return req, present, true
}
