const db = require('./index')

async function initTables() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      link_id TEXT,
      name TEXT,
      online_icon TEXT,
      text_icon TEXT,
      upload_icon TEXT,
      icon_type TEXT DEFAULT 'online_icon',
      int_url TEXT,
      ext_url TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ]

  try {
    await Promise.all(tables.map(sql => new Promise((resolve, reject) => {
      db.run(sql, (err) => err ? reject(err) : resolve())
    })))
    console.log('Tables initialized')
  } catch (err) {
    console.error('Table initialization failed:', err)
    throw err
  }
}

module.exports = {
  initTables,
  getUser: (username) => new Promise((resolve, reject) => {
    db.get('SELECT id FROM users WHERE username = ?', [username], (err, row) => {
      err ? reject(err) : resolve(row?.id)
    })
  }),
  createUser: (username) => new Promise((resolve, reject) => {
    db.run('INSERT INTO users (username) VALUES (?)', [username], function(err) {
      err ? reject(err) : resolve(this.lastID)
    })
  })
}
