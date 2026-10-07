# AGENTS.md — 给 AI 编码助手的行为规则

> 本文件供 AI 编码助手（WorkBuddy / Claude Code / Cursor 等）自动读取。
> **开始任务前先读完本文件；需求含糊时先提问，不要臆造。**

## 0. 项目

LitePortal — 轻量级 NAS 导航门户：**Go 后端**（gin + gorm + modernc.org/sqlite，纯 Go 无 CGO）提供链接增删改查，Vue 3 + Vite 前端提供导航界面，支持内外网地址自动切换，可打包为单文件可执行二进制或 Docker 镜像部署。后端于 `feature/go-backend` 分支由 NestJS 重写为 Go；`frontend/` 未改动。

## 1. 上下文入口（按此顺序阅读）

1. `AGENTS.md`（本文件）— 规则与红线
2. `ROADMAP.md` — 当前任务与「验收标准」
3. `README.md` — 定位、安装、常用命令
4. `docs/architecture.md` — 目录 / 分层 / 错误处理 / 日志 / 依赖规则
5. `docs/definition-of-done.md` — 完成定义（DoD）
6. `docs/adr/` — 已接受的架构决策（改动相关模块前先读）
7. `docs/接口文档.md` — 前后端接口约定
8. 与任务相关的源码与测试

## 2. 常用命令（可直接复制执行）

> 后端已重写为 **Go**（gin + gorm + modernc.org/sqlite，纯 Go 无 CGO），不再依赖 Node/pnpm。
> 全量构建命令在**根目录**（`build.sh` 在此，bash 脚本）；后端子命令在 `backend/`。前端仍是 Node 22 + pnpm，但自 G4 起已有完整质量门禁（eslint / prettier / tsc / vitest）。

| 目的 | 命令 |
|------|------|
| 安装后端依赖 | 无需（Go modules 自动拉取）：`cd backend && go mod download` |
| 安装前端依赖 | `cd frontend && pnpm install` |
| 运行（开发） | 后端：`cd backend && PORT=8080 go run .`<br>前端：`cd frontend && pnpm run start:dev`（`VITE_API_BASE_URL=http://127.0.0.1:8080` 同源调试） |
| 运行（生产构建） | 根目录 `bash build.sh` 产出 `dist/` → `cd dist && ./server`（Windows 为 `server.exe`） |
| 后端测试 | `cd backend && go test ./...`（集成测试 `TestLinksFlow` 覆盖 4 端点 + 404 + 未知字段 400 + 软删） |
| 后端静态检查 | `cd backend && go vet ./...` |
| 后端格式化检查 | `cd backend && gofmt -l .`（输出应为空） |
| 前端 lint | `cd frontend && pnpm run lint`（只拦 error；存量技术债以 warning 可见，见 `eslint.config.js`） |
| 前端格式化检查 | `cd frontend && pnpm run format:check` |
| 前端测试 | `cd frontend && pnpm run test`（vitest，48 个用例；**无 `--passWithNoTests` 式假绿**） |
| 前端类型检查 | `cd frontend && pnpm run typecheck`（`tsc --noEmit`） |

**其他常用**

| 目的 | 命令 |
|------|------|
| 一次跑完全量检查（等价于 CI 门禁） | 后端：`cd backend && go vet ./... && test -z "$(gofmt -l .)" && go test ./...`<br>前端：`cd frontend && pnpm run code:check`（= lint + format:check + typecheck + test） |
| 构建前端产物 | `cd frontend && pnpm run build:prod` |
| 清理构建产物 | 根目录 `bash build.sh` 自带先清 `dist/`；前端另：`cd frontend && pnpm run clean:build` |
| 查询运行中实例的版本 | `curl -s http://127.0.0.1:8080/version`（启动日志也会打印） |
| 指定版本号构建 | `VERSION=v0.2.0 bash build.sh`（不指定时由 `git describe` 取 tag） |

⚠️ **测试纪律（红线 #1 细化）**：Go 后端已补齐真实集成测试（`internal/handler/handler_test.go`），`go test ./...` 是**真绿**，不得冒称「测试已通过」而不实际运行。数据库表结构由 `migrations/schema.sql` 在启动时建表，**没有** `mig:gen` 类命令。前端自 G4 起也有真实门禁（`pnpm run code:check` = eslint + prettier + tsc + vitest），同样不得假称「前端测试通过」。

## 3. 工作流

- 保护分支禁止直接推送：**唯一主分支 `main`**（2026-10-05 已从 `master` 改名；2026-10-07 起废弃 `develop`，不再设集成分支）。日常改动一律从 `main` 切 `feature/<名称>` 分支，一个功能一个分支、一个 PR，合并回 `main`。
- 提交：Conventional Commits，type 用英文前缀（`feat`/`fix`/`docs`/`test`/`chore`/`refactor`/`ci`）；描述可用中文；标题总长 ≤ 72 字符。
- 每完成一项，更新 `ROADMAP.md` 对应行状态。
- **push 前先 `git fetch`**，确认远端没被别人推进；若对应 PR 已 merge，不要再往旧分支推送（commit 会成孤儿，不进主分支）。

## 4. 红线（违反即回滚）

1. 不得删除 / 跳过 / 弱化测试（含 `skip`、`xfail`、`#[ignore]`、改断言、将失败降级为 `warning` / `|| true`），不得伪造「测试已通过」。Go 后端以 `go test ./...` 为准，已补齐真实集成测试（旧 `--passWithNoTests` 假绿时代已结束）；不得用「无测试」冒称通过。
2. 大改动先确认：单次改动 > 5 个文件 或 > 200 行，先给方案，等确认再动手。
3. 不得擅自 `git commit` / `push` / `rebase` / `reset` / `--force`、切分支或改远程；仅在明确要求时执行。
4. 不得为了让检查「变绿」而修改 CI、hook、lint 配置或测试门禁。
5. 不得修改 `docs/adr/` 中「已接受」的记录；变更须新增 ADR。
6. 绝不提交密钥 / token / 私钥 / `.env`（本机私有覆盖层），只允许提交非敏感的 `.env.<NODE_ENV>` 默认值。
7. 含糊需求先提问；同一问题连续 2 次修复失败，停下说明现状并求助。
8. 只改与任务相关的文件，不做无关重构、不顺手改格式。

## 5. 完成定义（DoD）

详见 `docs/definition-of-done.md`。任一功能完成须同时满足：

- [ ] `ROADMAP.md` 该行「验收标准」全部满足
- [ ] 新增 / 更新对应测试，全量测试通过
- [ ] Lint 与格式化检查通过
- [ ] 相关文档（README / AGENTS / architecture / ADR）同步更新
- [ ] `ROADMAP.md` 状态更新为 `done`

## 6. 并发协作（多 AI / 多人）

- 一个分支只由一个执行者写入；动手前先 `git fetch`，避免同文件并发编辑。
- 遇到冲突立即停止并说明，不要擅自 `--force`。

## 7. 安全

- 绝不提交密钥 / token / 私钥；本机私有配置写入库外的 `.env`。
- 既有测试必须保持可运行。

## 8. 单一事实源坐标（改动前先确认「该改哪一处」）

> 表头结构固定；新增坐标请追加行，不要删除已有行。

| 关注点 | 唯一事实源 | 禁止重复定义在 |
|--------|-----------|---------------|
| 配置读取顺序与环境差异 | `backend/internal/config/config.go`（`LoadEnv`：先加载 `.env`（本地覆盖层）再加载 `.env.<NODE_ENV>`（入库默认值），进程环境变量永远覆盖） | 业务模块里零散 `os.Getenv` |
| 配置项定义与兜底默认值 | `backend/internal/config/config.go`（`Config` 结构：PORT / NODE_ENV / DB_PATH / MAX_BODY_SIZE / LOG_LEVEL / INIT_DATA / WEB_ROOT） | 各模块各自兜底默认值 |
| 非敏感环境默认值 | `backend/.env.development`（dev，端口 8080）、`backend/.env.production`（构建时复制为 `dist/.env`，重写后**真正生效**，取代 NestJS 时代的死配置） | 源码里硬编码端口 / 路径 |
| 前端 API 地址与运行时开关 | `frontend/.env.development`、`frontend/.env.production` | 代码里写死 IP / URL |
| 业务错误码 | 信封内 `code` / `message`（Go 不再实现 `BizCode` 死代码，仅保留信封形状） | 业务代码里的字面量数字 |
| API 统一响应结构 | `backend/internal/handler/handler.go`（`ApiResponse` / `ApiError`） | 处理器里手写响应包装 |
| 异常转 HTTP 语义 | `backend/internal/service` 返回 `ErrNotFound` → handler 转 404；其余 `Fail(c, status, msg, err)` | 散落 try/catch 自行拼状态码 |
| 启动装配流程 | `backend/main.go`（`LoadEnv` → `gorm.Open` → `runSchema(schema.sql)` → `Seed` → gin 路由 + `UserGuard` + CORS + `spaFallback`） | 散落在各处理器的 `r.Use()` |
| 数据库表结构（生产） | `backend/migrations/schema.sql`（启动时由 `runSchema` 执行建表，含 `IF NOT EXISTS`） | 生产环境靠 ORM `AutoMigrate` / `synchronize` |
| 本地构建产物结构 | 根目录 `build.sh`（产出 `dist/server` + `dist/web` + `dist/migrations/schema.sql` + `dist/.env`） | 旧 `clean.build.js` 已废弃 |
| CI 打包产物结构 | `.github/workflows/pkg.yml`（`GOOS/GOARCH` 矩阵，单文件二进制，不再用 `@yao-pkg/pkg`） | 与 `build.sh` 必须保持一致 |
| Docker 产物结构 | `Dockerfile`（`golang:1.22` builder → `alpine:3.20`，`CGO_ENABLED=0`） | 与 `build.sh` 必须保持一致 |
| CI 门禁命令 | `.github/workflows/build.yml`（`go vet` + `gofmt -l` + `go test ./...`，job 名 `test`） | 必须与本文件 §2 一致 |
| 功能清单与验收标准 | `ROADMAP.md` | 旧清单迁移后不再更新 |

## 9. 同改矩阵（改了 A 就必须同步 B）

| 改了 A | 必须同步 B | 不同步的后果 |
|--------|-----------|-------------|
| `backend/internal/model/model.go` 的 `Link` 结构（字段 / gorm tag） | `backend/internal/handler/handler.go`（`LinkResponse` 白名单 + `AllowedLinkFields` 未知字段拦截）、`frontend/src/types/link.ts` | 前后端字段漂移 / 未知字段校验失效 |
| `backend/migrations/schema.sql` 表结构 | `backend/internal/model/model.go`（`Link` / `User` / `Init` 列名与 tag 必须对齐 schema.sql 单数表名） | 启动建表与 ORM 读写列名错位 |
| `build.sh` 的产物结构 | `.github/workflows/pkg.yml` 与 `Dockerfile` | 本地能跑、CI / 容器缺文件 |
| `.github/workflows/build.yml` 的 job 名 `test` | GitHub 分支保护 required status checks（依赖 `test`） | PR 永远卡在 Expected |
| 本文件 §2 命令 | `.github/workflows/build.yml` 步骤、`CONTRIBUTING.md`（如有）「本地检查」 | 本地与 CI 判定不一致 |
| `backend/internal/config/config.go` 的 `Config` 键 | `backend/.env.development`、`backend/.env.production`、`Dockerfile` 的 `ENV` | 环境变量缺失导致默认值不可预期 |
| `docs/adr/` 新增决策 | `AGENTS.md` §8 坐标表、`ROADMAP.md` 受影响行 | 事实源分裂 |
| 新增 / 改名环境变量 | `backend/.env.development` 与 `backend/.env.production` 都要补 | 环境间行为不一致 |
| `backend/internal/version` 的注入方式或变量名 | `build.sh` 的 `LDFLAGS`、`.github/workflows/pkg.yml` 的 `Build backend` 步骤、`Dockerfile` 的 `ARG VERSION` + `docker.yml` 的 `Resolve version` 步骤（**三条链路同构**） | 某个产物版本号缺失或显示 `dev` |
| 发新版本（打 `v*` tag） | `CHANGELOG.md` 把 `[Unreleased]` 条目归入新版本段、`ROADMAP.md` §4 版本发布记录、`frontend/package.json` 的 `version` | 版本记录与 tag 不一致 |
