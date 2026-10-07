# 仓库与项目配置说明

本文说明代码之外需要配置什么：环境变量分层、Git、行尾、CI 与分支保护。
AI 的行为规则见 [AGENTS.md](../AGENTS.md)。

## 1. 环境要求

| 组件 | 要求 | 说明 |
|------|------|------|
| Go | 1.22.x | 后端 `go.mod` 声明 `go 1.22`；构建用 `go build`（CGO_ENABLED=0） |
| pnpm | 8.15.5 | 仅前端 `frontend/` 需要（Vue 3 构建） |
| Node.js | ≥ 22.0.0 | 仅前端构建需要（`frontend/`） |
| Git | ≥ 2.28 | |
| 编码 / 行尾 | UTF-8 / LF | 由 `.gitattributes` 强制，见 §3 |

## 2. 环境变量分层

LitePortal 的配置分三层，**优先级由高到低**：

| 优先级 | 来源 | 是否入库 | 用途 |
|--------|------|----------|------|
| ① | 进程已有的环境变量（shell `export`、`docker run -e`、Dockerfile `ENV`、systemd `Environment`） | — | 部署时覆盖单个值，最高优先级 |
| ② | `.env`（相对**进程工作目录**） | ❌ 已忽略 | 本机 / 部署机的私有覆盖层 |
| ③ | `backend/.env.development`、`backend/.env.production` | ✅ 有意入库 | 非敏感默认值 |

### 为什么 ③ 要入库

这两份文件**不含任何密钥**（只有端口、SQLite 路径、日志级别、请求体上限等），并且被三条链路硬依赖：

| 链路 | 依赖点 |
|------|--------|
| `Dockerfile` | `COPY backend/.env.production /app/.env`；另 `COPY backend/migrations/schema.sql /app/migrations/schema.sql` |
| `.github/workflows/pkg.yml` | 把 `backend/.env.production` 复制进 `dist/` 再改名 `.env` |
| `build.sh` | 复制 `backend/.env.production` 到 `dist/` 并改名为 `.env` |

因此**不要**把它们从版本控制里移除，否则上述三条链路会同时失效。

### 优先级的实现依据（改配置前必读）

优先级由 `backend/internal/config/config.go` 的 `LoadEnv()` / `applyEnvFile()` 决定。关键事实：

- `applyEnvFile()` 用 `if os.Getenv(key) == "" { os.Setenv(key, val) }` 写入：已存在的键（来自进程环境或更早读取的文件）**不会被覆盖** ⇒ 进程环境变量（①）恒为最高。
- 读取顺序为 `plain .env` 先、`.env.<NODE_ENV>` 后（见 `loadDotEnvFile`）；后者仅在键未设置时写入 ⇒ **实际优先级 ②（本地 `.env`）高于 ③（`.env.<NODE_ENV>`）**，与 ADR-0002 一致。
- `.env` 与 `.env.<NODE_ENV>` 都从「可执行文件目录」与「进程工作目录」两处读取（`candidateDirs`）；`go run .` 时 cwd 即 `backend/`，故开发读 `backend/.env.development`。

✅ `config.go` 的加载顺序已为「先 `.env` 后 `.env.<NODE_ENV>`」，本地 `.env` 可覆盖入库默认值，与 ADR-0002 及本文件 §2 顶层模型一致（由 `backend/internal/config/config_test.go` 锁定覆盖顺序）。

### 各场景实际取值

| 场景 | 工作目录 | 生效文件 |
|------|----------|----------|
| 后端开发（`cd backend && go run .`） | `backend/` | `backend/.env` → `backend/.env.development` |
| 源码生产模式（`cd dist && ./server`） | `dist/` | `dist/.env`（由 `build.sh` 从 `.env.production` 复制而来） |
| Docker 容器 | `/app` | `/app/.env`（由 Dockerfile 从 `.env.production` 复制而来） |

### 现有变量说明

| 变量 | 说明 | 默认值来源 |
|------|------|-----------|
| `PORT` | 服务端口 | `.env.*` = 8080 |
| `NODE_ENV` | `development` / `production`；缺省 `config.go` 兜底为 `development` | `.env.*` |
| `DB_PATH` | SQLite 数据库文件路径 | `.env.*` = `./data/liteportal.sqlite` |
| `MAX_BODY_SIZE` | 请求体大小上限（`10kb`/`10mb`） | `.env.*` |
| `LOG_LEVEL` | `debug` 会开启请求日志中间件 | `.env.*` |
| `INIT_DATA` | 是否写入初始化数据；**代码兜底为 `false`**，`.env.*` 设为 `true` | `.env.*` = `true` |
| `WEB_ROOT` | 生产静态资源目录 | `.env.production` = `web` |

> 历史遗留的 `IS_PKG` 死配置已于 G6 清理（Go 从未读取该变量，详见 `docs/adr/0003-remove-is-pkg.md`）。

> **图标磁盘缓存（F8）**：在线图标经 `GET /icons/proxy?url=<原地址>` 代理，首次回源后落盘到 `DB_PATH` 同级的 `icons/` 子目录（如 `./data/icons/<sha256(url)>.<ext>`）。目录由服务端自建，无需配置；清空即可强制全部重新回源。

> ⚠️ 变量的实际读取与兜底一律在 `backend/internal/config/config.go`；新增变量请同时更新 `.env.development` 与 `.env.production` 与本文档。

**本机怎么覆盖**：在 `backend/` 下新建 `.env`（已被忽略），只写要改的那几行即可；或直接用环境变量 `export PORT=3000`。

## 3. Git 配置

### 行尾（最容易踩的坑）

仓库自带 `.gitattributes`，**库内一律以 LF 存储**，它会覆盖全局的 `core.autocrlf=true` —— 防止脚本在 Windows 检出后变成 CRLF（表现为 `bad interpreter`）。

验证与归一化：

```bash
git check-attr eol -- build.sh         # 期望: eol: lf
git add --renormalize .                 # 若历史文件被写成 CRLF，用它一次性归一化
```

> `.gitattributes` 是本次补文档时新增的。若你后续执行 `git add --renormalize .`，会在一次提交里产生较大的行尾改动；建议单独一个 commit（例如 `chore: normalize line endings`），与普通改动分开。

### 提交署名（仓库级）

```bash
git config user.name  "your-name"
git config user.email "you@example.com"
```

## 4. CI（GitHub Actions）

仓库现有三个工作流：

| 文件 | 触发 | 作用 |
|------|------|------|
| `.github/workflows/build.yml` | push / pull_request | **门禁**：后端安装依赖 + lint + 格式检查 + 测试 |
| `.github/workflows/pkg.yml` | tag `v*` / 手动 | 三平台单文件可执行程序打包 |
| `.github/workflows/docker.yml` | （见该文件） | Docker 镜像 |

首次推送后，在仓库设置里补齐三步：

1. **启用 Actions**：Settings → Actions → General → Allow all actions and reusable workflows。
2. **收紧权限**：同页 Workflow permissions 选 *Read repository contents*（与 workflow 里的 `permissions: contents: read` 一致）。
3. **设置分支保护**：Settings → Branches → Add branch protection rule，分支名填 **`main`**：

   > 本仓库默认分支是 `main`（2026-10-05 已从 `master` 改名），`develop` 是集成分支。
   > **`develop` 也应加同样的保护规则**；`master` 旧分支若仍存在，保护规则会随分支一起失效，确认后删除。

   - 勾选 *Require a pull request before merging*
   - 勾选 *Require status checks to pass before merging*，搜索并勾选 **`test`**

   ⚠️ required status checks 的名称必须与 workflow 中的 job 名称一致。`build.yml` 的 job id 是 `test`（显式设了 `name: test`），搜索 `test` 即可。**若改了 job 名，这里必须同步改**，否则 PR 永远卡在 "Expected"。

**runner 镜像**：`build.yml` 的 `runs-on` 显式钉 `ubuntu-24.04`，不用 `ubuntu-latest` —— 跟随 latest 会在 GitHub 切换镜像时让依赖包名突变，CI 会在你毫无改动的一天突然变红。

本地检查与 CI 必须一致：`cd backend && go test ./...`（另可 `go vet ./... && gofmt -l .`）。

> 后端用 Go modules（`go mod download` / `go test`），无 lockfile 安装环节；前端仍用 pnpm，`frontend/pnpm-lock.yaml` 落后时须本机 `pnpm install` 后一并提交。

## 5. 落地配置清单

- [x] 填写 `AGENTS.md` §2「常用命令」表
- [x] 用真实命令替换 `.github/workflows/build.yml` 的占位步骤（后端）
- [x] `.gitattributes` 已随仓库提交（库内 LF）
- [x] 环境变量分层已定义（§2），密钥段已进入 `.gitignore`
- [ ] GitHub：启用 Actions、收紧 Workflow permissions
- [ ] GitHub：为 `main` 与 `develop` 开启分支保护 + required status checks（`test`）
- [ ] 前端补齐 lint / 格式化 / 测试脚本，并纳入 `build.yml`（见 `ROADMAP.md`）
- [x] 移除后端 `--passWithNoTests` 假绿（Go 重构以 `go test ./...` 取代 jest，已消除）

## 6. 常见问题

| 现象 | 原因 | 处理 |
|------|------|------|
| 改了 `.env` 但不生效 | 写到了被忽略的优先级层，或工作目录不对 | 见 §2：`.env` 相对 cwd；确认顺序为 `[本地 .env, 模式文件]` |
| 改了 `.env.production` 后 Docker 没生效 | Dockerfile `ENV` 优先级更高 | 用 `docker run -e` 覆盖 `ENV`，或改 Dockerfile |
| `bad interpreter` | 脚本被检出为 CRLF | 见 §3 行尾 |
| 前端 CI 首次报 lockfile 不匹配 | `frontend/pnpm-lock.yaml` 落后 | 本机 `pnpm install` 后提交 `frontend/pnpm-lock.yaml` |
| 改了 job 名后 PR 一直卡在 "Expected" | required status checks 名称未同步 | 见 §4 第 3 步 |
