/**
 * 链接相关接口端点
 */
export const LINKS_ENDPOINTS = {
  // 链接管理
  LIST: '/api/links',
  CREATE: '/api/links',
  DETAIL: (id: string | number) => `/api/links/${id}`,
  UPDATE: (id: string | number) => `/api/links/${id}`,
  DELETE: (id: string | number) => `/api/links/${id}`,
  // BATCH_DELETE: '/api/links/batch-delete',

  // 链接统计
  // STATS: '/api/links/stats',
  // CLICK_COUNT: (id: string | number) => `/api/links/${id}/click-count`,

  // 链接分类
  // CATEGORIES: '/api/links/categories',
  // CATEGORY_LINKS: (categoryId: string | number) => `/api/links/categories/${categoryId}/links`,

  // 链接配置（实际项目中使用的端点）
  // CONFIG: '/api/config'
} as const