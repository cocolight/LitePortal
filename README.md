# LitePortal

### **[开发计划](./docs/开发计划.md)** | **[Docker部署](./docs/Docker部署.md)** | 

LitePortal是一个简洁高效的网页导航工具，支持内网和外网链接无缝自动切换。可以部署在自己的家庭局域网上。

![image-20250823084643150](E:\Project\LitePortal\docs\image-20250823084643150.png)

![image-20250823084742186](E:\Project\LitePortal\docs\image-20250823084742186.png)

![image-20250823084848140](E:\Project\LitePortal\docs\image-20250823084848140.png)

## 一、功能特点

- 简洁直观的导航界面
- 内外网链接智能切换
- SQLite 数据库存储配置
- 多用户支持
- 响应式设计与暗黑模式
- 支持Docker部署

## 二、快速开发

```shell
# 克隆源码
git clone https://gitee.com/yumos/LitePortal.git

# 切换到项目目录
cd /liteportal
```

#### 前端

```bash
cd frontend
npm install
npm run dev    # 开发模式
npm run build  # 生产构建
```

#### 后端

```bash
cd backend
npm install        # 安装依赖
npm start          # 启动服务器
```

访问 http://localhost:8080

## 三、主要API

- `GET /` - 导航主页
- `GET /api/config` - 获取配置
- `POST /api/config` - 更新配置
- `GET /api/health` - 健康检查

## 四、技术栈

- 前端：Vite + TypeScript
- 后端：Node.js + Express + SQLite

## 五、许可证

