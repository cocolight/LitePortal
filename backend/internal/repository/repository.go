package repository

import (
	"errors"
	"strconv"
	"time"

	"gorm.io/gorm"

	"backend/internal/model"
)

// Repository 封装 gorm DB，提供用户与链接的数据访问。
type Repository struct {
	DB *gorm.DB
}

// New 构造 Repository。
func New(db *gorm.DB) *Repository {
	return &Repository{DB: db}
}

// GetOrCreateUser 返回 username 对应的用户 ID；用户不存在时创建。
func (r *Repository) GetOrCreateUser(username string) (uint, error) {
	var user model.User
	err := r.DB.Where("username = ?", username).First(&user).Error
	if err == nil {
		return user.ID, nil
	}
	// 仅当「确实不存在」时才创建；其它错误直接上抛
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return 0, err
	}
	user = model.User{Username: username}
	if err := r.DB.Create(&user).Error; err != nil {
		return 0, err
	}
	return user.ID, nil
}

// GetLinks 返回某用户的所有未软删链接，按创建时间倒序。
func (r *Repository) GetLinks(userID uint) ([]model.Link, error) {
	var links []model.Link
	// gorm 默认会过滤 DeletedAt 非空的软删记录
	err := r.DB.Where("userId = ?", userID).Order("created_at DESC").Find(&links).Error
	return links, err
}

// FindByLinkID 按 userId + linkId 查询单条链接，不存在时返回 gorm.ErrRecordNotFound。
func (r *Repository) FindByLinkID(userID uint, linkID string) (*model.Link, error) {
	var link model.Link
	err := r.DB.Where("userId = ? AND link_id = ?", userID, linkID).First(&link).Error
	if err != nil {
		return nil, err
	}
	return &link, nil
}

// CreateLink 在事务中插入一条链接，并在服务端生成 linkId（不信任客户端）。
func (r *Repository) CreateLink(userID uint, req model.LinkRequest) (*model.Link, error) {
	var link model.Link
	err := r.DB.Transaction(func(tx *gorm.DB) error {
		link = model.Link{
			LinkID:     generateLinkID(), // 服务端生成，等价于 Date.now().toString()
			UserID:     userID,
			Name:       req.Name,
			OnlineIcon: req.OnlineIcon,
			TextIcon:   req.TextIcon,
			UploadIcon: req.UploadIcon,
			PaidIcon:   req.PaidIcon,
			IconType:   req.IconType,
			IntURL:     req.IntURL,
			ExtURL:     req.ExtURL,
			Desc:       req.Desc,
		}
		if link.IconType == "" {
			link.IconType = "online_icon" // 缺省图标类型兜底
		}
		return tx.Create(&link).Error
	})
	if err != nil {
		return nil, err
	}
	return &link, nil
}

// UpdateLink 在事务中只合并请求里出现的字段（等价于 NestJS PartialType + 合并）。
// 链接不存在时返回 gorm.ErrRecordNotFound。present 标记哪些键在 JSON 中显式出现。
func (r *Repository) UpdateLink(userID uint, linkID string, req model.LinkRequest, present map[string]bool) (*model.Link, error) {
	var link model.Link
	err := r.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("userId = ? AND link_id = ?", userID, linkID).First(&link).Error; err != nil {
			return err
		}
		// 仅当字段在请求中显式出现时才覆盖，实现局部更新
		if present["name"] {
			link.Name = req.Name
		}
		if present["onlineIcon"] {
			link.OnlineIcon = req.OnlineIcon
		}
		if present["textIcon"] {
			link.TextIcon = req.TextIcon
		}
		if present["uploadIcon"] {
			link.UploadIcon = req.UploadIcon
		}
		if present["paidIcon"] {
			link.PaidIcon = req.PaidIcon
		}
		if present["iconType"] {
			link.IconType = req.IconType
		}
		if present["intUrl"] {
			link.IntURL = req.IntURL
		}
		if present["extUrl"] {
			link.ExtURL = req.ExtURL
		}
		if present["desc"] {
			link.Desc = req.Desc
		}
		return tx.Save(&link).Error
	})
	if err != nil {
		return nil, err
	}
	return &link, nil
}

// SoftDelete 软删一条链接（设置 deleted_at，列表查询自动排除）。
func (r *Repository) SoftDelete(userID uint, linkID string) error {
	return r.DB.Where("userId = ? AND link_id = ?", userID, linkID).Delete(&model.Link{}).Error
}

// Seed 在 init 表保护下，幂等写入 guest 用户与两条示例链接。
// 等价于 NestJS 的初始化服务，但通过单一 INIT_DATA 开关在 dev/prod 保持一致。
func (r *Repository) Seed() error {
	var initRec model.Init
	err := r.DB.Where("key = ?", "dataInitialized").First(&initRec).Error
	if err == nil {
		return nil // 已初始化，跳过
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return err // 非「未找到」错误，上抛
	}

	userID, err := r.GetOrCreateUser("guest")
	if err != nil {
		return err
	}
	samples := []model.Link{
		{
			LinkID:     "1",
			UserID:     userID,
			Name:       "个人博客",
			OnlineIcon: "https://alili.website/favicon.ico",
			IntURL:     "https://alili.website",
			ExtURL:     "https://alili.website",
			Desc:       "我的博客",
			IconType:   "online_icon",
		},
		{
			LinkID:     "2",
			UserID:     userID,
			Name:       "LitePortal",
			OnlineIcon: "https://github.com/favicon.ico",
			IntURL:     "https://github.com/cocolight/LitePortal",
			ExtURL:     "https://github.com/cocolight/LitePortal",
			Desc:       "LitePortal github地址",
			IconType:   "online_icon",
		},
	}
	// 逐条写入；若 linkId 已存在则跳过，保证可重复执行
	for _, l := range samples {
		var existing model.Link
		findErr := r.DB.Where("userId = ? AND link_id = ?", userID, l.LinkID).First(&existing).Error
		if findErr == nil {
			continue
		}
		if !errors.Is(findErr, gorm.ErrRecordNotFound) {
			return findErr
		}
		if err := r.DB.Create(&l).Error; err != nil {
			return err
		}
	}
	// 写入初始化标记，下次启动直接跳过
	return r.DB.Create(&model.Init{Key: "dataInitialized", Value: true}).Error
}

// generateLinkID 用当前 Unix 毫秒生成链接业务主键（与前端 Date.now().toString() 等价）。
func generateLinkID() string {
	return strconv.FormatInt(time.Now().UnixMilli(), 10)
}
