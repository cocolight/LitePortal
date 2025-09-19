<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>

## Description

LitePortal 是一个轻量级的门户网站项目，后端基于 NestJS 框架构建，使用 SQLite 数据库存储数据。该后端提供 RESTful API 接口，用于管理用户链接。

## 功能特性

- 用户友好的链接管理系统
- SQLite 数据库存储
- RESTful API 接口
- 支持开发和生产环境
- 支持测试数据初始化

## 安装依赖

```bash
pnpm install
```

## 运行应用

```bash
# 开发环境
pnpm start:dev

# 生产环境
pnpm build
pnpm start:prod
```

## API 接口

### 获取链接配置

```
GET /api/config
```

请求头：
```
X-User: 用户名（可选，默认为 guest）
```

响应：
```json
{
  "links": [
    {
      "id": "1",
      "name": "Google",
      "onlineIcon": "https://www.google.com/favicon.ico",
      "textIcon": "",
      "uploadIcon": "",
      "iconType": "online_icon",
      "int": "https://www.google.com",
      "ext": "https://www.google.com",
      "desc": "Google 搜索引擎"
    }
  ]
}
```

### 更新链接配置

```
POST /api/config
```

请求头：
```
X-User: 用户名（可选，默认为 guest）
Content-Type: application/json
```

请求体：
```json
{
  "id": "1",
  "name": "Google",
  "onlineIcon": "https://www.google.com/favicon.ico",
  "textIcon": "",
  "uploadIcon": "",
  "iconType": "online_icon",
  "int": "https://www.google.com",
  "ext": "https://www.google.com",
  "desc": "Google 搜索引擎"
}
```

### 删除链接

```
POST /api/config
```

请求头：
```
X-User: 用户名（可选，默认为 guest）
Content-Type: application/json
```

请求体：
```json
{
  "action": "delete",
  "id": "1"
}
```

## 配置

项目使用环境变量进行配置，开发环境使用 `.env.development`，生产环境使用 `.env.production`。

### 环境变量说明

- `PORT`: 服务端口，默认 8080
- `NODE_ENV`: 运行环境，开发环境为 'development'，生产环境为 'production'
- `DB_PATH`: SQLite 数据库文件路径
- `MAX_BODY_SIZE`: 最大请求体大小，默认 '10kb'
- `LOG_LEVEL`: 日志级别，'debug' 或 'info'
- `INIT_TEST_DATA`: 是否初始化测试数据，默认 false
- `IS_PKG`: 是否在 pkg 打包环境中运行，默认 false

## 数据库

项目使用 SQLite 数据库存储数据，数据库文件位于 `data` 目录下。在开发环境中，数据库会自动同步实体定义。

## 目录结构

```
src/
├── config/                 # 配置模块
│   ├── configuration.ts   # 配置定义
│   └── config.module.ts   # 配置模块
├── database/              # 数据库模块
│   ├── database.module.ts # 数据库模块
│   └── init-data.service.ts # 数据初始化服务
├── links/                  # 链接模块
│   ├── dto/               # 数据传输对象
│   │   └── link.dto.ts
│   ├── link.controller.ts # 链接控制器
│   ├── link.entity.ts     # 链接实体
│   ├── link.module.ts     # 链接模块
│   └── link.service.ts    # 链接服务
├── users/                 # 用户模块
│   ├── user.entity.ts     # 用户实体
│   ├── user.module.ts     # 用户模块
│   └── user.service.ts    # 用户服务
├── app.module.ts          # 应用主模块
└── main.ts               # 应用入口
```

## 支持

Nest 是一个 MIT 许可的开源项目。它可以通过赞助者和支持者的支持而发展壮大。如果您想加入他们，请[阅读更多](https://docs.nestjs.com/support)。

## 许可证

Nest 是 [MIT 许可](LICENSE)的。
