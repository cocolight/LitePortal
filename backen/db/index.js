const sqlite3 = require('sqlite3').verbose()
const { DB_PATH } = require('../config')

const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
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
