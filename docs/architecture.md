# 架构与代码约定

> 项目：LitePortal。本文件说明「代码怎么组织」；
> 「什么时候算完成」见 [definition-of-done.md](definition-of-done.md)；
> 「环境以外的配置」见 [configuration.md](configuration.md)。

## 1. 目录结构

```text
LitePortal/
├── AGENTS.md                 # AI 编码助手的行为规则（开工必读）
├── README.md / ROADMAP.md / CHANGELOG.md / CONTRIBUTING.md
├── docs/
│   ├── architecture.md       # 本文件
│   ├── configuration.md      # 环境与仓库配置
│   ├── definition-of-done.md # 完成定义
│   ├── adr/                  # 架构决策记录
│   ├── 后端文档.md / 前端文档.md / 接口文档.md
│   └── 构建部署文档.md / Docker部署.md
├── backend/                  # Go（gin + gorm + modernc.org/sqlite，纯 Go 无 CGO）
│   ├── main.go           # 入口：LoadEnv → gorm.Open → runSchema → Seed → gin 路由 → listen
│   ├── go.mod / go.sum   # 模块与依赖（gin / gorm / glebarez-sqlite）
│   ├── internal/
│   │   ├── config/config.go     # 自写 .env 解析 + Config 默认值
│   │   ├── model/model.go       # gorm 模型 + 响应白名单（AllowedLinkFields）
│   │   ├── repository/repository.go # 数据访问（CRUD / Seed 幂等）
│   │   ├── service/service.go   # 业务封装
│   │   ├── middleware/middleware.go # UserGuard（X-User → userId）
│   │   └── handler/handler.go   # 路由 + 统一响应信封（含 handler_test.go）
│   ├── migrations/schema.sql    # 三表 DDL（启动时建表依据）
│   └── .env.development / .env.production  # 非敏感默认值（入库）
├── frontend/                 # Vue 3 + Vite + Pinia
│   └── src/
│       ├── api/              # http 客户端与接口端点
│       ├── components/       # 展示与交互组件
│       ├── composables/      # 组合式逻辑
│       ├── router/ stores/ types/ utils/ views/
├── build.sh             # 本地构建脚本（bash；Go 后端 + 前端），产物 dist/
├── Dockerfile
└── .github/workflows/        # build.yml(门禁) / pkg.yml(打包) / docker.yml(镜像)
```

> 注：本仓库是 `backend/` + `frontend/` 的双包结构，**不是**单一 `src/tests/scripts` 布局；约定以本文件为准。

## 2. 分层与依赖方向

后端依赖方向单向，**底层不得反向依赖上层**：

```text
main.go → gorm.Open → runSchema(schema.sql) → Seed → gin engine
                ├─ config      （最底层：LoadEnv → *Config，无内部依赖）
                ├─ model       （gorm 模型；被 repository / handler 依赖）
                ├─ repository  （依赖 model；数据访问）
                ├─ service     （依赖 repository；业务逻辑）
                ├─ middleware   （依赖 repository；UserGuard 注入 userId）
                └─ handler      （依赖 service；路由 + 响应信封）

依赖方向单向：handler → service → repository → model；config 不被其他层反向依赖。
```

- handler 只做参数接收与响应下发，不做业务逻辑；业务逻辑放 service。
- 模型（`model/model.go`）只描述数据形状，不含业务流程；便于单元测试与 `schema.sql` 对齐。
- 前端：`views` → `components` → `composables` → `api`；`stores`（Pinia）承载跨组件状态，`utils` 为无状态纯函数，**不得反向 import `views`**。

## 3. 错误处理

统一链路（注册点在 `internal/handler/handler.go`）：

```text
业务代码返回 *ApiError（code + message）
      │
      ▼
handler 统一用 ApiResponse / ApiError 包装
   成功：{ success:true, code:200, message:"success", data }
   失败：{ success:false, code:<http>, message }
```

约定：

- **不吞异常**：repository / service 返回 `error`，handler 转换为 `ApiError`；错误信息须携带足够的定位上下文，且不得输出密钥 / token / 隐私。
- 入参白名单：`AllowedLinkFields`（9 字段）在 `model/model.go`；含未知字段 → 400（等价 NestJS `forbidNonWhitelisted`）。
- 成功响应由 `handler` 统一包装，**handler 不得手写不一致的包装结构**。
- 前端按结构化错误响应展示；不得依赖后端错误文案的字面匹配。

## 4. 日志

- 统一入口与级别：`LOG_LEVEL`（`debug` / `info` / `warn` / `error`），由 `internal/config/config.go` 读取。
- `LOG_LEVEL=debug` 时会挂载请求日志中间件（`configure-runtime.ts`），生产默认 `info`。
- 禁止用裸 `console.log` 作为长期日志（临时排查用的调试打印应在提交前清理）。
- **日志中不得输出密钥、token 或用户隐私信息**。

## 5. 依赖引入规则

- 新增依赖前先确认标准库 / 现有依赖无法满足；优先轻量、维护活跃的库。
- 前端区分 `dependencies` 与 `devDependencies`：运行时依赖不得放 dev（前端仍用 Node/pnpm 构建）。
- 后端为纯 Go（`CGO_ENABLED=0`），不引 C 原生依赖；新增 Go 依赖走 `go get` 并 `go mod tidy`，须评估二进制体积与 `pkg.yml` 交叉编译矩阵。
- 新增依赖须在 PR 中说明理由，避免为小功能引入重依赖。

## 6. 密钥管理

- 密钥 / token / 私钥一律用**环境变量**或**仓库外文件**；`.env` 不入库（已被 `.gitignore` 忽略）。
- `backend/.env.development`、`.env.production` 是**非敏感默认值**，有意入库；一旦出现真实密钥，必须移到环境变量或本机 `.env`。
- 详见 [configuration.md](configuration.md) §2 的三层模型。
