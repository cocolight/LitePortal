/**
 * 环境检查工具
 */

// 导入环境变量
const { VITE_APP_ENV, VITE_APP_TITLE } = import.meta.env

/**
 * 检查是否为开发环境
 */
export const isDevelopment = VITE_APP_ENV === 'development'

/**
 * 检查是否为生产环境
 */
export const isProduction = VITE_APP_ENV === 'production'

/**
 * 获取当前环境名称
 */
export const getEnvName = () => VITE_APP_ENV

/**
 * 获取应用标题
 */
export const getAppTitle = () => VITE_APP_TITLE || 'LitePortal'

/**
 * 在控制台打印环境信息（开发环境有效）
 */
export const logEnvInfo = () => {
  if (isDevelopment) {
    console.log(`%c当前环境: ${getEnvName()}`, 'color: #67C23A; font-weight: bold')
    console.log(`%c应用标题: ${getAppTitle()}`, 'color: #409EFF; font-weight: bold')
  }
}
