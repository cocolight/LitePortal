# LitePortal 后端（Go）

> 轻量级 NAS 导航门户的后端。技术栈：**Go 1.22 + gin（HTTP 路由）+ gorm + modernc.org/sqlite（纯 Go SQLite 驱动，CGO_ENABLED=0，无原生编译）**。前端为独立 Vue 3 项目（`frontend/`），本服务在 production 下同时托管其构建产物（`web/`）并提供 `/links` API。

## 目录结构

```text
backend/
├── main.go                      # 入口：LoadEnv → gorm.Open → runSchema(schema.sql) → Seed → gin 路由装配 → listen
├── go.mod / go.sum              # Go 模块与依赖（gin / gorm / glebarez-sqlite）
├── internal/
│   ├── config/config.go         # 自写 .env 解析器（不引外部依赖）+ Config 结构 + 默认值
│   ├── model/model.go           # gorm 模型（User / Link / Init）+ LinkResponse 白名单 + AllowedLinkFields
│   ├── repository/repository.go # 数据访问：GetOrCreateUser / GetLinks / CreateLink / UpdateLink / SoftDelete / Seed（幂等）
│   ├── service/service.go       # 业务封装
│   ├── middleware/middleware.go # UserGuard：读 X-User（默认 guest）→ GetOrCreateUser → 注入 userId
│   └── handler/handler.go       # 路由处理 + 统一响应信封（ApiResponse / ApiError）
│       └── handler_test.go      # 集成测试（go test）
├── migrations/schema.sql        # 三表 DDL（users / links / init），启动时按此建表（IF NOT EXISTS）
├── .env.development             # 非敏感默认值（development），入库
├── .env.production              # 非敏感默认值（production），入库
├── .gitignore                   # 忽略 data/* / *.log / dist
└── data/                        # 运行时 SQLite（gitignore，首次启动自动创建）
```

## 常用命令

```bash
# 开发（从 backend/ 运行，自动读 .env.development）
go run .

# 构建单文件二进制（CGO_ENABLED=0 纯静态）
go build -o server .

# 跑测试
go test ./...

# 静态检查
go vet ./...
gofmt -l .

# 本地一键构建（前端 + 后端 → dist/）：go build 后端 + 复制 frontend/dist→dist/web + schema.sql + .env
bash build.sh
# 运行产物：cd dist && ./server
```

## API

所有链接接口挂在根路径（**无 `/api` 前缀**）。请求头 `X-User`（可选，缺省 `guest`）标识用户；`x-user` 由前端透传，不强制鉴权。

```text
GET    /links            # 该用户全部链接（createdAt 降序，软删排除）
POST   /links            # 新建；成功 201，data.link.linkId 为服务端生成（Unix 毫秒字符串）
PUT    /links/:linkId    # 局部更新，仅传要改的字段
DELETE /links/:linkId    # 软删（gorm DeletedAt，查询自动排除）
GET    /<非 /links 路径> # SPA history fallback，回退 index.html（生产托管前端）
GET    /assets/*         # 静态资源
```

统一响应信封：成功 `{ "success": true, "code": 200, "message": "success", "data": ... }`；列表 `data.links`、单条 `data.link`。失败 `{ "success": false, "code": <http>, "message": "..." }`。请求体须为白名单 9 字段（`name / url / iconType / onlineIcon / textIcon / uploadIcon / intUrl / extUrl / desc`），含未知字段 → 400（等价 NestJS `forbidNonWhitelisted`）。

> 前端使用 `createWebHistory()`（history 模式），故 production 须由本服务做 fallback（已在 `main.go` 的 `spaFallback` 实现）。

## 配置

三层模型（与 NestJS 版一致），优先级由高到低：

| 优先级 | 来源                                             | 是否入库 |
| --- | ---------------------------------------------- | ---- |
| ①   | 进程已有环境变量（export / docker -e / Dockerfile ENV）  | —    |
| ②   | `.env`（进程工作目录，gitignore）                       | ❌ 忽略 |
| ③   | `.env.development` / `.env.production`（非敏感默认值） | ✅ 入库 |

读取逻辑见 `internal/config/config.go`：`applyEnvFile()` 仅在键未设置时写入（`os.Getenv(key)==""`），故进程环境变量恒最高；文件侧先读 `.env` 再读 `.env.<NODE_ENV>`，使 ② 本地覆盖层高于 ③（与 ADR-0002 一致）。详见 [../docs/configuration.md](../docs/configuration.md) §2。

**本机覆盖**：在 `backend/` 下新建 `.env`（已被忽略），只写要改的键即可；或 `export PORT=3000`。

### 环境变量

| 变量              | 说明                                                         | 代码兜底默认                     | .env.*                    |
| --------------- | ---------------------------------------------------------- | -------------------------- | ------------------------- |
| `PORT`          | 服务端口                                                       | `3000`                     | `8080`                    |
| `NODE_ENV`      | `development` / `production`；缺省 `development`              | `development`              | 显式设                       |
| `DB_PATH`       | SQLite 路径                                                  | `./data/liteportal.sqlite` | 同                         |
| `MAX_BODY_SIZE` | 请求体上限（`10kb`/`10mb`）                                       | `10kb`                     | dev `10kb` / prod `10mb`  |
| `LOG_LEVEL`     | `debug` 开请求日志中间件                                           | `info`                     | dev `debug` / prod `info` |
| `INIT_DATA`     | 是否写种子（guest + 2 示例链接）                                      | `false`                    | `true`                    |
| `WEB_ROOT`      | 生产静态资源目录                                                   | `web`                      | prod `web`                |

> 新增变量：在 `config.go` 的 `Config` 加字段并给兜底默认，同时更新 `.env.development` / `.env.production` 与 `docs/configuration.md`。

## 数据库

modernc.org/sqlite（纯 Go，CGO_ENABLED=0）。建表依据为 `migrations/schema.sql`（启动时执行，带 `IF NOT EXISTS`）。表名单数（`gorm` 配 `NamingStrategy{SingularTable:true}`）以匹配 `schema.sql` 的 `users`/`links`/`init`。

## 许可证

MIT。
