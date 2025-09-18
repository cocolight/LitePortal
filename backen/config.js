const path = require('path')

// 加载环境变量
const env = process.env.NODE_ENV || 'development'

// 根据环境加载不同的配置
const baseConfig = {
  PORT: process.env.PORT || 8080,
  DB_PATH: path.join(__dirname, 'database.sqlite'),
  NODE_ENV: env,
  MAX_BODY_SIZE: '10kb',
  LOG_LEVEL: process.env.LOG_LEVEL || (env === 'development' ? 'debug' : 'info'),
  INIT_TEST_DATA: process.env.INIT_TEST_DATA === 'true' || (env === 'development')
}

// 开发环境特有配置
const developmentConfig = {
  // 开发环境特有配置
}

// 生产环境特有配置
const productionConfig = {
  // 生产环境特有配置
}

// 根据环境合并配置
const config = {
  ...baseConfig,
  ...(env === 'development' ? developmentConfig : productionConfig)
}

module.exports = config
