# 完成定义（Definition of Done）

功能是否算「完成」，以以下条件**同时满足**为准。本文件是 `AGENTS.md` §5 的详细版。

## 通用清单

- [ ] `ROADMAP.md` 中该行「验收标准」全部满足
- [ ] 新增或更新了对应测试，且全量测试通过
- [ ] Lint 与格式化检查通过
- [ ] 未引入无关改动（无顺手重构 / 格式化噪声）
- [ ] 相关文档（README / AGENTS / architecture / configuration / ADR）同步更新
- [ ] `ROADMAP.md` 状态更新为 `done`

## 按类型的差异

| type | 额外要求 |
|------|----------|
| `feat` | 必须新增测试；必要时新增 / 更新 ADR |
| `fix` | 必须新增能复现原缺陷的回归测试 |
| `docs` | 无需测试，但链接与示例须可用 |
| `chore` / `ci` | 不得降低既有门禁强度 |

## 平台相关差异

| 改动范围 | 额外要求 |
|----------|----------|
| `internal/model/model.go` | 列名须与 `migrations/schema.sql` 对齐（表名单数，gorm `SingularTable`）；改表结构以 `schema.sql` 为准，并核验 `repository.go` 引用 |
| `build.sh` | 必须核验 CI 打包（`.github/workflows/pkg.yml`）与 `Dockerfile` 同步改动，三者产物结构一致 |
| 新增环境变量 | `.env.development` 与 `.env.production` 都要落到位，且在 `docs/configuration.md` 登记 |
| `.github/workflows/build.yml` | 改 job 名必须同步 GitHub 分支保护的 required status checks，且**不得**弱化任何既有的 lint / test 步骤 |

## 当前门禁的强度基线（不得下调）

- 后端：`cd backend && go test ./...`（及 `go vet ./...` / `gofmt -l .`）
- CI：`.github/workflows/build.yml` 的 `test` job 对 push / pull_request 生效
- ⚠️ 已知弱项（待提升，**不得**把它当作"已有保障"）：前端尚无 lint / 格式化 / 测试脚本；后端 `go test` 当前仅 `handler_test.go` 集成测试，单测覆盖待补

## 禁止的「完成」信号（伪完成）

- 声称「测试已通过」但未实际运行命令。
- 用 `skip` / `xfail` / `#[ignore]` / 注释掉断言让测试变绿。
- 为通过检查而放宽 lint / CI / hook 配置。
- 只改代码不改测试，或只改测试不改代码来掩盖问题。
- 以「本地能跑」代替多平台产物验证（Windows / Linux / macOS 三平台打包见 `.github/workflows/pkg.yml`）。
