// backend/server.js
const express = require('express')
const cors = require('cors')
const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const app = express()
const PORT = 8080
const DB_PATH = path.join(__dirname, 'database.sqlite')

app.use(cors())
app.use(express.json())

// 初始化数据库
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('数据库连接失败:', err.message)
    } else {
        console.log('已连接到SQLite数据库')
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
        icon TEXT,
        int_url TEXT,
        ext_url TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`, (err) => {
        if (err) console.error('创建链接表失败:', err.message)
        else {
            // 表创建成功后，根据环境变量决定是否初始化测试数据
            const isDevelopment = process.env.NODE_ENV !== 'production';
            if (isDevelopment) {
                console.log('开发环境，准备初始化测试数据...');
                const { initTestData } = require('./testDataInit');
                initTestData(db);
            } else {
                console.log('生产环境，跳过测试数据初始化');
            }
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
            db.run('INSERT INTO users (username) VALUES (?)', [username], function(err) {
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
        
        db.all('SELECT link_id as id, name, icon, int_url as int, ext_url as ext, description as desc FROM links WHERE user_id = ?', [userId], (err, rows) => {
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
                    'UPDATE links SET name = ?, icon = ?, int_url = ?, ext_url = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND link_id = ?',
                    [payload.name, payload.icon, payload.int, payload.ext, payload.desc, userId, payload.id],
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
                    'INSERT INTO links (user_id, link_id, name, icon, int_url, ext_url, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [userId, payload.id, payload.name, payload.icon, payload.int, payload.ext, payload.desc],
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
    console.log(`✅ Express backend running at http://localhost:${PORT}`)
})