// backend/server.js
const express = require('express')
const cors = require('cors')
const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs')
const config = require('./config')

// 只在开发环境中加载 dotenv
if (config.NODE_ENV === 'development') {
  require('dotenv').config({ path: `.env.${config.NODE_ENV}` })
}

const app = express()
const PORT = config.PORT
const DB_PATH = config.DB_PATH
const LOG_LEVEL = config.LOG_LEVEL
const INIT_TEST_DATA = config.INIT_TEST_DATA

// 确保数据库目录存在
const dbDir = path.dirname(DB_PATH)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
  console.log(`创建数据库目录: ${dbDir}`)
}

// 根据环境配置日志级别
if (LOG_LEVEL === 'debug') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
    next()
  })
}

app.use(cors())
app.use(express.json({ limit: config.MAX_BODY_SIZE }))

// 静态文件服务 - 只在生产环境中使用打包后的前端文件
if (config.NODE_ENV === 'production') {
  // 判断是否在 pkg 打包环境中运行
  if (config.IS_PKG) {
    // 在打包环境中，使用相对于可执行文件的路径
    const baseDir = path.dirname(process.execPath);
    const webPath = path.join(baseDir, '..', 'web');
    
    // 检查web目录是否存在
    if (fs.existsSync(webPath)) {
      app.use(express.static(webPath));
      console.log(`使用外部web目录: ${webPath}`);
    } else {
      console.warn(`外部web目录不存在: ${webPath}，将使用内置资源`);
      app.use(express.static(path.join(__dirname, '../web')));
    }
  } else {
    // 非打包环境，使用相对路径
    app.use(express.static(path.join(__dirname, '../web')));
  }
}

// 初始化数据库
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('数据库连接失败:', err.message)
        console.error('数据库路径:', DB_PATH)
    } else {
        console.log('已连接到SQLite数据库')
        console.log('数据库路径:', DB_PATH)
        initDatabase()
    }
})

// 初始化数据库表
function initDatabase() {
    // 创建用户表
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) console.error('创建用户表失败:', err.message)
    })

    // 创建链接表
    db.run(`CREATE TABLE IF NOT EXISTS links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
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
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`, (err) => {
        if (err) console.error('创建链接表失败:', err.message)
        else {
            // 检查是否需要添加新字段（用于现有数据库的升级）
            db.all("PRAGMA table_info(links)", (err, rows) => {
                if (err) {
                    console.error('获取表结构失败:', err.message);
                    return;
                }

                // 检查rows是否存在
                if (!rows || !Array.isArray(rows)) {
                    console.error('获取表结构返回无效数据');
                    return;
                }

                const columns = rows.map(row => row.name);

                // 添加 text_icon 字段（如果不存在）
                if (!columns.includes('text_icon')) {
                    db.run("ALTER TABLE links ADD COLUMN text_icon TEXT", (err) => {
                        if (err) console.error('添加 text_icon 字段失败:', err.message);
                        else console.log('成功添加 text_icon 字段');
                    });
                }

                // 添加 upload_icon 字段（如果不存在）
                if (!columns.includes('upload_icon')) {
                    db.run("ALTER TABLE links ADD COLUMN upload_icon TEXT", (err) => {
                        if (err) console.error('添加 upload_icon 字段失败:', err.message);
                        else console.log('成功添加 upload_icon 字段');
                    });
                }

                // 添加 icon_type 字段（如果不存在）
                if (!columns.includes('icon_type')) {
                    db.run("ALTER TABLE links ADD COLUMN icon_type TEXT DEFAULT 'online_icon'", (err) => {
                        if (err) console.error('添加 icon_type 字段失败:', err.message);
                        else console.log('成功添加 icon_type 字段');
                    });
                }

                // 表创建成功后，根据环境变量决定是否初始化测试数据
                if (INIT_TEST_DATA) {
                    console.log('当前环境允许初始化测试数据...');
                    const { initTestData } = require('./testDataInit');
                    initTestData(db);
                } else {
                    console.log('当前环境配置为不初始化测试数据');
                }
            });
        }
    })
}

// 获取或创建用户
function getOrCreateUser(username, callback) {
    db.get('SELECT id FROM users WHERE username = ?', [username], (err, row) => {
        if (err) {
            callback(err, null)
            return
        }

        if (row) {
            callback(null, row.id)
        } else {
            db.run('INSERT INTO users (username) VALUES (?)', [username], function (err) {
                if (err) {
                    callback(err, null)
                } else {
                    callback(null, this.lastID)
                }
            })
        }
    })
}

// 默认配置
function defaultCfg() {
    return { links: [] }
}

// GET /api/config
app.get('/api/config', (req, res) => {
    const username = req.get('X-User') || 'guest'

    getOrCreateUser(username, (err, userId) => {
        if (err) {
            console.error('获取用户ID失败:', err.message)
            return res.json(defaultCfg())
        }

        db.all('SELECT link_id as id, name, online_icon as onlineIcon, text_icon as textIcon, upload_icon as uploadIcon, icon_type as iconType, int_url as int, ext_url as ext, description as desc FROM links WHERE user_id = ?', [userId], (err, rows) => {
            if (err) {
                console.error('查询链接失败:', err.message)
                return res.json(defaultCfg())
            }

            // 始终返回 { links: [...] } 格式，即使没有数据
            if (rows.length === 0) {
                return res.json({ links: [] })
            }

            res.json({ links: rows })
        })
    })
})

// POST /api/config  新增 / 编辑 / 删除 统一入口
app.post('/api/config', (req, res) => {
    const username = req.get('X-User') || 'guest'

    getOrCreateUser(username, (err, userId) => {
        if (err) {
            console.error('获取用户ID失败:', err.message)
            return res.status(500).json({ error: '服务器内部错误' })
        }

        // 如果是删除请求
        if (req.body.action === 'delete') {
            db.run('DELETE FROM links WHERE user_id = ? AND link_id = ?', [userId, req.body.id], (err) => {
                if (err) {
                    console.error('删除链接失败:', err.message)
                    return res.status(500).json({ error: '删除失败' })
                }
                return res.status(204).send()
            })
            return
        }

        // 新增 / 编辑
        const payload = req.body
        if (!payload.id) payload.id = Date.now().toString() // 生成新 id

        // 检查链接是否存在
        db.get('SELECT id FROM links WHERE user_id = ? AND link_id = ?', [userId, payload.id], (err, row) => {
            if (err) {
                console.error('查询链接失败:', err.message)
                return res.status(500).json({ error: '服务器内部错误' })
            }

            if (row) {
                // 更新现有链接
                db.run(
                    'UPDATE links SET name = ?, online_icon = ?, text_icon = ?, upload_icon = ?, icon_type = ?, int_url = ?, ext_url = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND link_id = ?',
                    [payload.name, payload.onlineIcon || payload.icon, payload.textIcon || '', payload.uploadIcon || '', payload.iconType || 'online_icon', payload.int, payload.ext, payload.desc, userId, payload.id],
                    (err) => {
                        if (err) {
                            console.error('更新链接失败:', err.message)
                            return res.status(500).json({ error: '更新失败' })
                        }
                        res.status(204).send()
                    }
                )
            } else {
                // 添加新链接
                db.run(
                    'INSERT INTO links (user_id, link_id, name, online_icon, text_icon, upload_icon, icon_type, int_url, ext_url, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [userId, payload.id, payload.name, payload.onlineIcon || payload.icon, payload.textIcon || '', payload.uploadIcon || '', payload.iconType || 'online_icon', payload.int, payload.ext, payload.desc],
                    (err) => {
                        if (err) {
                            console.error('添加链接失败:', err.message)
                            return res.status(500).json({ error: '添加失败' })
                        }
                        res.status(204).send()
                    }
                )
            }
        })
    })
})

// 单页应用路由回退（放在所有 API 路由之后）
if (config.NODE_ENV === 'production') {
  app.get(/^\/(?!api).*/, (req, res) => {
    // 判断是否在 pkg 打包环境中运行
    if (config.IS_PKG) {
      // 在打包环境中，使用相对于可执行文件的路径
      const baseDir = path.dirname(process.execPath);
      const indexPath = path.join(baseDir, '..', 'web', 'index.html');
      
      // 检查index.html是否存在
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        console.warn(`外部index.html不存在: ${indexPath}，将使用内置资源`);
        res.sendFile(path.join(__dirname, '../web/index.html'));
      }
    } else {
      // 非打包环境，使用相对路径
      res.sendFile(path.join(__dirname, '../web/index.html'));
    }
  });
}

// 关闭数据库连接
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('关闭数据库连接失败:', err.message)
        } else {
            console.log('数据库连接已关闭')
        }
        process.exit(0)
    })
})

app.listen(PORT, () => {
    const envName = config.NODE_ENV === 'development' ? '开发环境' : '生产环境'
    console.log(`✅ Express backend running at http://localhost:${PORT} (${envName})`)
    console.log(`数据库路径: ${DB_PATH}`)
    console.log(`是否在打包环境中运行: ${config.IS_PKG}`)
})