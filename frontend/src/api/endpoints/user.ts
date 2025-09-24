/**
 * 用户相关接口端点
 */
export const USER_ENDPOINTS = {
  // 认证相关
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  REFRESH_TOKEN: '/api/auth/refresh-token',

  // 用户资料
  PROFILE: '/api/user/profile',
  UPDATE_PROFILE: '/api/user/profile',
  CHANGE_PASSWORD: '/api/user/password',
  UPLOAD_AVATAR: '/api/user/avatar',

  // 用户偏好
  PREFERENCES: '/api/user/preferences'
} as const