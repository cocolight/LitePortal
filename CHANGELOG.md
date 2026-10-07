# Changelog

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 与
[语义化版本](https://semver.org/lang/zh-CN/)。

> 早期版本的条目此前记录在 `docs/开发计划.md` 中，现已统一迁移到
> [ROADMAP.md](ROADMAP.md)；本文件只记录**对外可见的变更**。

## [Unreleased]

### Added

- 引入 AI 协作文档体系：`AGENTS.md`、`CONTRIBUTING.md`、`ROADMAP.md`、`docs/architecture.md`、
  `docs/configuration.md`、`docs/definition-of-done.md`、`docs/adr/`。
- 新增 CI 门禁 `.github/workflows/build.yml`（job `test`）：后端安装依赖 + lint + 格式检查 + 测试。
- 新增 `.gitattributes`，统一库内 LF（`*.bat` 保持 CRLF 以保证 Windows 可执行）。
- `docs/adr/0002-environment-variable-layering.md`：确立环境变量三层模型。

### Changed

- 环境变量加载顺序调整为 `[.env, .env.<NODE_ENV>]`，使仓库外的本机 `.env` 成为最高文件优先级层
  （原先 `.env` 权重低于模式文件，本地覆盖无效）。详见 `docs/configuration.md` §2。
- `.gitignore` 增补忽略项：`.env`、`.env.local`、`.env.*.local`、`*.key` / `*.pem` / `*.p12` / `*.pfx` /
  `*.jks` / `secrets/` 等凭据，以及 SQLite 运行时产物。
  `.env.development` / `.env.production` 作为**非敏感默认值**继续入库（Docker / pkg / build.sh 三条链路依赖）。

### Fixed

- 修复发布打包链路：`pkg.yml` 的产物由「单个裸二进制」改为 zip（含 `server`、`web/`、
  `migrations/schema.sql`、`.env`），并在打 `v*` tag 时自动上传到对应 Release。
  此前产出的可执行文件缺少前端产物与建表 SQL，下载后无法直接运行。

### Removed

-
