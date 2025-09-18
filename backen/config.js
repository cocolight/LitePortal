const path = require('path')
const fs = require('fs')

// 判断是否在 pkg 打包环境中运行
const isPkg = typeof process.pkg !== 'undefined'

// 加载环境变量
const env = process.env.NODE_ENV || (isPkg ? 'production' : 'development')

// 根据环境确定数据库路径
let dbPath
if (env === 'development') {
  // 开发环境：使用源码目录
  dbPath = path.join(__dirname, 'database.sqlite')
} else {
  // 生产环境：使用相对于可执行文件的路径
  // pkg 打包后，可执行文件在 executable 目录中
  // 数据库应该放在 executable 的同级 data 目录中
  const baseDir = isPkg ? path.dirname(process.execPath) : __dirname
  dbPath = path.join(baseDir, '..', 'data', 'database.sqlite')

  // 确保生产环境的目录存在
  const dataDir = path.join(baseDir, '..', 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// 根据环境加载不同的配置
const baseConfig = {
  PORT: process.env.PORT || 8080,
  DB_PATH: dbPath,
  NODE_ENV: env,
  MAX_BODY_SIZE: '10kb',
  LOG_LEVEL: process.env.LOG_LEVEL || (env === 'development' ? 'debug' : 'info'),
  INIT_TEST_DATA: process.env.INIT_TEST_DATA === 'true' || (env === 'development'),
  IS_PKG: isPkg
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