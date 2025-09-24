/**
 * API模块统一导出
 */

// 导出HTTP客户端
export { httpClient } from './http/client'

// 导出端点
export * from './endpoints'

// 导出类型（从项目的types目录导入）
export type {
  ApiResponse,
  ApiError,
  LinkRequestParams,
  LinkAddRequest,
  LinkConfigResponse,
  LinkDeleteRequest,
  LinkUpdateRequest
} from '@/types/api'
