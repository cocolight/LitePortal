/**
 * 环境工具函数
 */

const config = require('../config')

/**
 * 检查是否为开发环境
 */
const isDevelopment = () => config.NODE_ENV === 'development'

/**
 * 检查是否为生产环境
 */
const isProduction = () => config.NODE_ENV === 'production'

/**
 * 获取当前环境名称
 */
const getEnvName = () => config.NODE_ENV

/**
 * 获取日志级别
 */
const getLogLevel = () => config.LOG_LEVEL

/**
 * 检查是否应该初始化测试数据
 */
const shouldInitTestData = () => config.INIT_TEST_DATA

module.exports = {
  isDevelopment,
  isProduction,
  getEnvName,
  getLogLevel,
  shouldInitTestData
}
