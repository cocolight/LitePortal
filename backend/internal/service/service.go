package service

import (
	"errors"

	"gorm.io/gorm"

	"backend/internal/model"
	"backend/internal/repository"
)

// ErrNotFound 表示链接不存在或不属于当前用户。
var ErrNotFound = errors.New("链接不存在或无权操作")

// Service 实现链接与用户的业务逻辑，向上对 handler 暴露、向下依赖 repository。
type Service struct {
	repo *repository.Repository
}

// New 构造 Service。
func New(repo *repository.Repository) *Service {
	return &Service{repo: repo}
}

// GetOrCreateUser 透传给 repository（供鉴权中间件使用）。
func (s *Service) GetOrCreateUser(username string) (uint, error) {
	return s.repo.GetOrCreateUser(username)
}

// GetLinks 返回某用户全部链接的对外视图（白名单投影）。
func (s *Service) GetLinks(userID uint) ([]model.LinkResponse, error) {
	links, err := s.repo.GetLinks(userID)
	if err != nil {
		return nil, err
	}
	out := make([]model.LinkResponse, 0, len(links))
	for _, l := range links {
		out = append(out, l.ToResponse())
	}
	return out, nil
}

// GetLink 返回单条链接的对外视图；不存在或不属于当前用户时返回 ErrNotFound。
func (s *Service) GetLink(userID uint, linkID string) (model.LinkResponse, error) {
	link, err := s.repo.FindByLinkID(userID, linkID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return model.LinkResponse{}, ErrNotFound
		}
		return model.LinkResponse{}, err
	}
	return link.ToResponse(), nil
}

// CreateLink 创建链接并返回其对外视图。
func (s *Service) CreateLink(userID uint, req model.LinkRequest) (model.LinkResponse, error) {
	link, err := s.repo.CreateLink(userID, req)
	if err != nil {
		return model.LinkResponse{}, err
	}
	return link.ToResponse(), nil
}

// UpdateLink 仅更新请求中提供的字段，返回对外视图；不存在时返回 ErrNotFound。
func (s *Service) UpdateLink(userID uint, linkID string, req model.LinkRequest, present map[string]bool) (model.LinkResponse, error) {
	link, err := s.repo.UpdateLink(userID, linkID, req, present)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return model.LinkResponse{}, ErrNotFound
		}
		return model.LinkResponse{}, err
	}
	return link.ToResponse(), nil
}

// DeleteLink 软删链接，并返回删除前的快照（供响应返回）。不存在时返回 ErrNotFound。
func (s *Service) DeleteLink(userID uint, linkID string) (model.LinkResponse, error) {
	link, err := s.repo.FindByLinkID(userID, linkID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return model.LinkResponse{}, ErrNotFound
		}
		return model.LinkResponse{}, err
	}
	if err := s.repo.SoftDelete(userID, linkID); err != nil {
		return model.LinkResponse{}, err
	}
	return link.ToResponse(), nil
}

// Seed 在开启 INIT_DATA 时执行幂等数据初始化。
func (s *Service) Seed() error {
	return s.repo.Seed()
}
