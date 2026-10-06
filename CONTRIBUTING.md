# 贡献指南

> 项目：LitePortal

开工前请先阅读 [AGENTS.md](AGENTS.md) —— AI 编码助手的规则与红线都在那里；
本文件约束的是**人**的分支 / 提交 / PR 流程。

## 分支策略

- **默认分支 `main`**（2026-10-05 已从 `master` 改名），`develop` 为集成分支，两者都不要直接推送。
- 从 `develop` 切 `feature/<名称>` 分支，一个功能一个分支、一个 PR；发布时再把 `develop` 合入 `main`。
- 提交前先 `git fetch`，确认远端没被别人推进。

## 提交规范

- Conventional Commits，type 用英文前缀：
  `feat:`（新功能）`fix:`（修复）`docs:`（文档）`test:`（测试）`chore:`（杂项）`refactor:`（重构）`ci:`（CI）。
- 描述可用中文，简明；标题总长 ≤ 72 字符。
- 例：`fix: 修复更新图标后前端重复添加的问题`

## Pull Request

- 向主分支提 PR，说明做了什么、为什么，并关联 `ROADMAP.md` 对应行。
- PR 描述里请写明验证方式（跑了哪条命令、在哪个平台验证）。
- 确保本地检查通过（见下）后再提。

## 本地检查

与 [AGENTS.md](AGENTS.md) §2「常用命令」完全一致：

```bash
# 安装依赖
cd backend  && go mod download
cd frontend && pnpm install

# 运行
cd backend  && go run .                # 开发（读 backend/.env.development）
cd frontend && pnpm run start:dev

# 全量检查（= go vet + gofmt + go test，等价于 CI 门禁）
cd backend && go vet ./... && test -z "$(gofmt -l .)" && go test ./...
```

单跑某一步：

```bash
# 后端（Go）
cd backend && go vet ./...            # 静态检查 / Lint
cd backend && gofmt -l .              # 格式化检查（输出应为空）
cd backend && go test ./...           # 测试

# 前端
cd frontend && pnpm run lint          # ESLint（只拦 error，存量技术债为 warning）
cd frontend && pnpm run format:check  # Prettier 格式检查
cd frontend && pnpm run typecheck     # tsc --noEmit 类型检查
cd frontend && pnpm run test          # Vitest
cd frontend && pnpm run code:check    # 上述四步一次跑完（等价于 CI 前端门禁）
```

> ⚠️ 后端已用 Go 真实测试取代 NestJS 时代的 `--passWithNoTests` 假绿；前端自 G4 起同样有真实门禁（eslint / prettier / tsc / vitest），**也不存在「无测试即通过」的假绿**——vitest 在无测试文件时以非零码退出。

## 红线与完成定义

- 提交前请阅读 `AGENTS.md` §4 的「红线」（尤其：不得弱化测试与门禁、不得提交密钥 / `.env`）。
- 功能是否算完成，以 `docs/definition-of-done.md` 为准。
- 改动配置前必读 `docs/configuration.md` §2 的环境变量三层模型。

## 许可证

本项目采用 GPL-3.0 许可证，详见 [LICENSE](LICENSE)。
