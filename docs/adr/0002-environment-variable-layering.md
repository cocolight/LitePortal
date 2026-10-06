# ADR-0002: 环境变量三层模型与优先级顺序

- **状态**：accepted
- **日期**：2026-10-05
- **决策者**：cocolight
- **相关**：`backend/internal/config/config.go`、`docs/configuration.md` §2

## 背景

引入 AI 协作规范时发现一个看似违反安全红线的事实：`backend/.env.development` 与 `backend/.env.production` **已在版本控制中**。按「`.env` 不得入库」的一般约定，直觉处理是 `git rm --cached` 并加 `.gitignore`。

但核查后发现这样做会同时打断三条链路：

| 链路 | 依赖点 |
|------|--------|
| `Dockerfile` | `COPY backend/.env.production /app/.env`（另复制 `backend/migrations/schema.sql` → `/app/migrations`） |
| `.github/workflows/pkg.yml` | 把 `backend/.env.production` 复制进 `dist/` 后改名 `.env` |
| `build.sh` | 复制 `backend/.env.production` 到 `dist/` 后改名为 `.env` |

同时，这两份文件的**全部内容均非密钥**（仅 PORT / DB_PATH / LOG_LEVEL / MAX_BODY_SIZE / INIT_DATA / WEB_ROOT / NODE_ENV）。因此真正的风险不是「已入库」，而是：

1. **未来**有人把真实密钥写进去；
2. 本机 / 部署机缺少一个「不被版本控制」的覆盖层，导致改动配置必须动受跟踪的文件（容易误提交）。

此外还查出一个隐性缺陷：原写法 `envFilePath: [<模式文件>, '.env']` 中，`.env` 的优先级**低于**模式文件，本地覆盖层形同虚设。

## 决策

建立**三层配置模型**，优先级由高到低：

| 优先级 | 来源 | 是否入库 |
|--------|------|----------|
| ① | 进程已有环境变量（shell export / Docker ENV / systemd） | — |
| ② | `.env`（相对进程工作目录） | ❌ 忽略 |
| ③ | `.env.development` / `.env.production`（非敏感默认值） | ✅ 入库 |

配套改动：

1. **保留** `.env.development` / `.env.production` 的版本跟踪，并在文档中明确定性为「非敏感默认值」，只允许放非敏感配置；
2. `envFilePath` 调整为 `[<本地 .env>, <模式文件>]`，使 ② 真正高于 ③；
3. `.gitignore` 增加忽略段：`.env`、`.env.local`、`.env.*.local` 以及 `*.key` / `*.pem` / `*.p12` / `*.jks` / `secrets/` 等凭据；
4. 上述规则写入 `AGENTS.md` §4 红线第 6 条与 §7 安全章节，形成长期约束。

## 理由

> 本 ADR 决策于 NestJS 时代；Go 重构（2026-10-06）**改变了读取机制，但保留了同样的三层模型与三条消费链路**。下方「理由」为历史记录，现状见 `backend/internal/config/config.go`。

NestJS 时代优先级的实现依据是 `@nestjs/config@3.x` 的真实源码（`ConfigModule.loadEnvFile` 中 `Object.assign` 顺序），故 `envFilePath` 须写成 `[<本地 .env>, <模式文件>]`。

Go 重构后机制改为：`applyEnvFile()` 仅在 `os.Getenv(key)==""` 时写入，进程环境变量恒最高；`loadDotEnvFile` 先 `.env` 后 `.env.<NODE_ENV>`，使本地 `.env` 高于模式文件（恢复 ADR-0002 语义）。用户侧行为（三层优先级）与三条消费链路（Dockerfile / pkg.yml / build.sh 复制 `.env.production`）完全不变。

## 后果

**正面**

- 本机 / 部署机有一层受保护且最高文件优先级的覆盖手段，改配置不再动受跟踪文件。
- 三种部署形态（源码开发、打包产物 `dist/`、Docker `/app`）下 `.env` 均位于进程 cwd，行为一致。
- 凭据段进入 `.gitignore`，即使未来引入登录鉴权功能也不会误提交密钥。
- 移除模式文件影响面为零：`Dockerfile` 与 `pkg.yml` 都先复制再改名为 `.env`，改序前后内容相同。

**负面 / 需要注意**

- 「`.env` 入库」这一反直觉做法需在 `docs/configuration.md` 显式说明，否则后来者可能再次试图删除它们。
- `.env.<NODE_ENV>` 一旦混入密钥，仍会泄露——这是约定于人的约束，需在 code review 时把关（`AGENTS.md` §7 已列为基础线）。
- `IS_PKG` 是当前唯一的死配置（Go 代码 `config.go` 不读取该变量），`.env.*` 中仍保留，留待后续清理（见 `ROADMAP.md` G6）。
