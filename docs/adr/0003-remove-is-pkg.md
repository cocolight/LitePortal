# ADR-0003: 清理 IS_PKG 死配置

- **状态**：accepted
- **日期**：2026-10-06
- **决策者**：cocolight
- **相关**：`backend/.env.development`、`backend/.env.production`、`docs/configuration.md`、ROADMAP G6
- **取代**：ADR-0002 中关于 `IS_PKG` 的现状描述（该 ADR 的**决策本身不变**，仅其「仍保留待清理」的事实陈述已过时；按红线「ADR 只增不改」，此处以新 ADR 记录变更）

## 背景

ADR-0002 确立环境变量三层模型时，把 `IS_PKG` 标注为「当前唯一的死配置，留待后续清理」。

核查确认该变量确已死透：

| 证据 | 结论 |
|------|------|
| 全仓 `grep IS_PKG` | 仅命中 `.env.development` / `.env.production` 与文档说明，**无任何代码读取** |
| NestJS 时代 | `configuration.ts` 用 `(process as any).pkg !== undefined` 自行判断打包态，从不读该变量 |
| Go 重写后 | `backend/internal/config/config.go` 无该字段、无该键的读取逻辑 |

即：`IS_PKG` 从未参与任何决策，`.env.*` 里写 `true` 或 `false` 对程序行为**零影响**。

## 决策

从 `.env.development` 与 `.env.production` 中删除 `IS_PKG` 行。

## 理由

1. **死配置会误导**：后来者读到 `IS_PKG=true` 会以为它在生效（尤其在 `.env.production` 中），可能据此写出错误的分支逻辑。
2. **无任何依赖**：三条消费链路（`build.sh` / `Dockerfile` / `pkg.yml`）都是整体复制 `.env.production`，不解析单个键；Go 代码不读它。删除不影响任何链路。
3. **替代方案已就位**：Go 用**单文件静态二进制**取代了 `@yao-pkg/pkg` 的打包方案，「是否被打包」已不再需要运行时判断——这正是 `IS_PKG` 存在的唯一理由，该前提已消失。

## 影响

- 三条消费链路改为整体复制 `.env.production`（沿用现状），**无需改动**。
- 配置文档中相关行同步移除，并指向本 ADR。
- 无需迁移、无破坏性变更。

## 验证

- 三平台交叉编译（`linux/darwin/windows` × `amd64`，`CGO_ENABLED=0`）产物大小与清理前一致，启动无回归。