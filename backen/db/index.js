const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const { DB_PATH } = require('../config')

// 确保数据库路径是绝对路径
const absoluteDbPath = path.resolve(DB_PATH)

const db = new sqlite3.Database(absoluteDbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('Database connection error:', err.message)
    process.exit(1)
  }
  console.log('Connected to SQLite database')
})

// 性能优化配置
db.configure("busyTimeout", 5000)
db.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;')

process.on('SIGINT', () => {
  db.close()
  process.exit(0)
})

module.exports = db
