/**
 * API基础类型定义
 */

// 导入链接相关类型
import type { LinkBase, Link } from './link'

// API响应联合接口
export type ApiResult<T extends object> = ApiResponse<T> | ApiError

// API响应基础接口
export interface ApiResponse<T extends object = any> {
  code: number
  data: T
  message: string
  success: true
}

// API错误响应
export interface ApiError {
  success: false
  code: number
  message: string
  error: string
  traceId?: string
  details?: Array<{
    field: string
    message: string
  }>
}

// 类型守卫
export function isApiSuccess<T extends object>(res: ApiResult<T>): res is ApiResponse<T> {
  return 'success' in res && res.success === true
}

// 链接请求参数
export interface LinkRequestParams {
  page?: number
  size?: number
  keyword?: string
}

// 链接添加请求
export interface LinkAddRequest extends LinkBase {}

// 链接更新请求
export interface LinkUpdateRequest extends LinkBase{}

// 链接删除请求
export interface LinkDeleteRequest {
  linkId: string | number
}

// 链接批量删除请求
export interface BatchDeleteRequest {
  linkIds: string[] | number[]
}

// 链接配置响应
export interface LinksResponse {
  links: Link[]
}

// 链接配置响应
export interface LinkResponse extends Link{
  link: Link
}



// 分页参数
// export interface PaginationParams {
//   page?: number
//   size?: number
// }

// 分页响应
// export interface ListResponse<T> {
//   list: T[]
//   total: number
//   page: number
//   size: number
// }

// 用户登录信息
// export interface LoginCredentials {
//   username: string
//   password: string
//   remember?: boolean
// }

// 用户注册信息
// export interface RegisterData {
//   username: string
//   email: string
//   password: string
// }

// 用户基本信息
// export interface UserProfile {
//   id: string | number
//   username: string
//   email: string
//   nickname?: string
//   avatar?: string
//   bio?: string
// }

// 用户偏好设置
// export interface UserPreferences {
//   theme: 'light' | 'dark' | 'auto'
//   language: string
//   notifications: boolean
// }

// 修改密码请求
// export interface ChangePasswordRequest {
//   oldPassword: string
//   newPassword: string
// }

// Token信息
// export interface TokenInfo {
//   accessToken: string
//   refreshToken: string
//   expiresIn: number
// }

// 认证响应
// export interface AuthResponse {
//   user: UserProfile
//   tokenInfo: TokenInfo
// }

// 链接统计信息
// export interface LinkStats {
//   totalClicks: number
//   dailyClicks: number
//   weeklyClicks: number
//   monthlyClicks: number
// }

// 链接分类
// export interface LinkCategory {
//   id: string | number
//   name: string
//   description?: string
//   icon?: string
// }
