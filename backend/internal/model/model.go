package model

import (
	"time"

	"gorm.io/gorm"
)

// User 映射 user 表。字段不对外序列化（json:"-"），用户信息仅用于关联链接。
type User struct {
	ID        uint      `gorm:"primaryKey" json:"-"`
	Username  string    `gorm:"uniqueIndex;not null" json:"-"`
	CreatedAt time.Time `json:"-"`
	Links     []Link    `gorm:"foreignKey:UserID" json:"-"`
}

// Link 映射 link 表。
// 列名显式指定，以对齐既有 SQLite 表结构（注意是 userId 而非 user_id）。
// 同样不对外序列化，对外投影走 LinkResponse 白名单。
type Link struct {
	ID         uint           `gorm:"primaryKey" json:"-"`
	LinkID     string         `gorm:"column:link_id;uniqueIndex;not null" json:"-"`  // 业务主键，由服务端用 Unix 毫秒生成
	UserID     uint           `gorm:"column:userId" json:"-"`                        // 归属用户，对应 user.id
	Name       string         `gorm:"not null" json:"-"`                             // 链接名称
	OnlineIcon string         `gorm:"column:online_icon" json:"-"`                   // 在线图标 URL
	TextIcon   string         `gorm:"column:text_icon" json:"-"`                     // 文字图标
	UploadIcon string         `gorm:"column:upload_icon" json:"-"`                   // 上传图标 URL
	PaidIcon   string         `gorm:"column:paid_icon" json:"-"`                     // 付费图标 URL
	IconType   string         `gorm:"column:icon_type;default:online_icon" json:"-"` // 图标类型，默认 online_icon
	IntURL     string         `gorm:"column:int_url" json:"-"`                       // 内网地址
	ExtURL     string         `gorm:"column:ext_url" json:"-"`                       // 外网地址
	Desc       string         `gorm:"column:desc" json:"-"`                          // 描述
	CreatedAt  time.Time      `json:"-"`
	UpdatedAt  time.Time      `json:"-"`
	DeletedAt  gorm.DeletedAt `gorm:"column:deleted_at" json:"-"` // 软删标记；非空即视为已删除
}

// Init 映射 init 表，用于幂等种子（记录是否已初始化）。
type Init struct {
	Key       string    `gorm:"primaryKey" json:"-"`
	Value     bool      `json:"-"`
	CreatedAt time.Time `json:"-"`
}

// LinkResponse 是链接的对外投影（白名单序列化），等价于 NestJS 的 @Expose 白名单。
// 仅有这些字段会出现在 JSON 里，避免泄露内部列。
type LinkResponse struct {
	LinkID     string `json:"linkId"`
	Name       string `json:"name"`
	OnlineIcon string `json:"onlineIcon,omitempty"`
	TextIcon   string `json:"textIcon,omitempty"`
	UploadIcon string `json:"uploadIcon,omitempty"`
	PaidIcon   string `json:"paidIcon,omitempty"`
	IconType   string `json:"iconType"`
	IntURL     string `json:"intUrl,omitempty"`
	ExtURL     string `json:"extUrl,omitempty"`
	Desc       string `json:"desc,omitempty"`
}

// ToResponse 把内部 Link 投影为对外表示的 LinkResponse。
func (l Link) ToResponse() LinkResponse {
	return LinkResponse{
		LinkID:     l.LinkID,
		Name:       l.Name,
		OnlineIcon: l.OnlineIcon,
		TextIcon:   l.TextIcon,
		UploadIcon: l.UploadIcon,
		PaidIcon:   l.PaidIcon,
		IconType:   l.IconType,
		IntURL:     l.IntURL,
		ExtURL:     l.ExtURL,
		Desc:       l.Desc,
	}
}

// LinkRequest 是创建 / 更新的入参 DTO。
// AllowedLinkFields 是其字段白名单，用于拒绝未知键（等价于 NestJS 的 forbidNonWhitelisted）。
type LinkRequest struct {
	Name       string `json:"name"`
	OnlineIcon string `json:"onlineIcon"`
	TextIcon   string `json:"textIcon"`
	UploadIcon string `json:"uploadIcon"`
	PaidIcon   string `json:"paidIcon"`
	IconType   string `json:"iconType"`
	IntURL     string `json:"intUrl"`
	ExtURL     string `json:"extUrl"`
	Desc       string `json:"desc"`
}

// AllowedLinkFields 枚举链接入参允许出现的全部 JSON 键。
// handler 会据此拒绝白名单外的未知字段（返回 400）。
var AllowedLinkFields = map[string]bool{
	"name": true, "onlineIcon": true, "textIcon": true, "uploadIcon": true,
	"paidIcon": true, "iconType": true, "intUrl": true, "extUrl": true, "desc": true,
}
