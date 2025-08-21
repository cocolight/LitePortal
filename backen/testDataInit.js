// 测试数据初始化模块
const path = require('path');

// 初始化测试数据
function initTestData(db) {
    // 检查是否已有数据
    db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
        if (err) {
            console.error('检查用户数据失败:', err.message);
            return;
        }
        
        // 如果已有数据，不进行初始化
        if (row && row.count > 0) {
            console.log('数据库已有数据，跳过测试数据初始化');
            return;
        }
        
        console.log('正在初始化测试数据...');
        
        // 创建测试用户
        db.run('INSERT INTO users (username) VALUES (?)', ['guest'], function(err) {
            if (err) {
                console.error('创建测试用户失败:', err.message);
                return;
            }
            
            const guestUserId = this.lastID;
            
            // 添加测试链接数据
            const testLinks = [
                { id: '1', name: '路由器', icon: 'https://api.iconify.design/mdi:router.svg', int: 'http://192.168.1.1', ext: 'https://demo.example.com', desc: '管理后台' },
                { id: '2', name: 'NAS', icon: 'https://api.iconify.design/mdi:server.svg', int: 'http://192.168.1.10:5000', ext: 'https://nas.example.com', desc: '文件存储' },
                { id: '3', name: '博客', icon: 'https://api.iconify.design/mdi:post.svg', int: 'http://192.168.1.20:8080', ext: 'https://blog.example.com', desc: '个人博客' },
                { id: '4', name: '代码仓库', icon: 'https://api.iconify.design/mdi:git.svg', int: 'http://192.168.1.30:3000', ext: 'https://git.example.com', desc: 'Git服务器' }
            ];
            
            // 使用事务确保所有插入操作要么全部成功，要么全部失败
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');
                
                const stmt = db.prepare('INSERT INTO links (user_id, link_id, name, icon, text_icon, upload_icon, int_url, ext_url, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
                
                testLinks.forEach(link => {
                    stmt.run([guestUserId, link.id, link.name, link.icon, '', '', link.int, link.ext, link.desc], (err) => {
                        if (err) console.error('插入测试链接失败:', err.message);
                    });
                });
                
                stmt.finalize();
                
                db.run('COMMIT', (err) => {
                    if (err) {
                        console.error('提交事务失败:', err.message);
                        db.run('ROLLBACK');
                    } else {
                        console.log('测试数据初始化完成');
                    }
                });
            });
        });
    });
}

module.exports = { initTestData };
