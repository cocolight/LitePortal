// 数据库重置脚本
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 数据库路径
const DB_PATH = path.join(__dirname, 'database.sqlite');

// 如果数据库文件存在，则删除它
if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    console.log('已删除旧数据库文件');
}

// 创建新的数据库连接
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('数据库连接失败:', err.message);
    } else {
        console.log('已连接到SQLite数据库');
        
        // 创建用户表
        db.run(`CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error('创建用户表失败:', err.message);
            else console.log('用户表创建成功');
        });

        // 创建链接表
        db.run(`CREATE TABLE links (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            link_id TEXT,
            name TEXT,
            icon TEXT,
            text_icon TEXT,
            upload_icon TEXT,
            int_url TEXT,
            ext_url TEXT,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`, (err) => {
            if (err) console.error('创建链接表失败:', err.message);
            else console.log('链接表创建成功');
            
            // 初始化测试数据
            const { initTestData } = require('./testDataInit');
            initTestData(db);
        });
    }
});

// 关闭数据库连接
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('关闭数据库连接失败:', err.message);
        } else {
            console.log('数据库连接已关闭');
        }
        process.exit(0);
    });
});

console.log('数据库重置完成，请重启服务器以使更改生效');
