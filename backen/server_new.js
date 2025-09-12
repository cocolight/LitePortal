const express = require('express')
const helmet = require('helmet')
const path = require('path')
const config = require('./config')
const db = require('./db')
const { initTables } = require('./db/models')
const configRouter = require('./routes/config')
const { errorHandler, notFound } = require('./middleware/error')

const app = express()

// 中间件
app.use(helmet())
app.use(express.json({ limit: config.MAX_BODY_SIZE }))
app.disable('x-powered-by')

// 路由
app.use('/api/config', configRouter)

// 错误处理
app.use(notFound)
app.use(errorHandler)

// 初始化
async function start() {
  await initTables()

  app.listen(config.PORT, () => {
    console.log(`Server running on http://localhost:${config.PORT}`)
  })
}

start().catch(err => {
  console.error('Startup failed:', err)
  process.exit(1)
})
