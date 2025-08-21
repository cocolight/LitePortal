# LitePortal

简洁高效的网页导航工具，支持内网和外网链接自动切换。

## 功能特点

- 简洁直观的导航界面
- 内外网链接智能切换
- SQLite 数据库存储配置
- 多用户支持
- 响应式设计与暗黑模式

## 快速开始

### 前端

```bash
cd frontend
npm install
npm run dev    # 开发模式
npm run build  # 生产构建
```

### 后端

```bash
cd backend
npm install        # 安装依赖
npm start          # 启动服务器
```

访问 http://localhost:8080

## 主要API

- `GET /api/config` - 获取配置
- `POST /api/config` - 更新配置
- `GET /api/health` - 健康检查

## 技术栈

- 前端：Vite + TypeScript
- 后端：Node.js + Express + SQLite

## 许可证

MIT
