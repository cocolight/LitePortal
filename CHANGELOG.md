# Changelog

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 与
[语义化版本](https://semver.org/lang/zh-CN/)。

> 早期版本的条目此前记录在 `docs/开发计划.md` 中，现已统一迁移到
> [ROADMAP.md](ROADMAP.md)；本文件只记录**对外可见的变更**。

## [Unreleased]

### Added

-

### Changed

-

### Fixed

-

### Removed

-

## [0.2.0] - 2026-10-07

后端由 NestJS 重写为 **Go**，构建与发布链路同步去 Node 化；前端补齐质量门禁；
修复 4 项缺陷（B1–B4），完成 2 项功能（F5、F8）。

### Added

- **在线图标缓存（F8）**：新增 `GET /icons/proxy?url=<原地址>` 代理接口，首次回源后
  落盘到 `data/icons/`，命中直接返回本地文件。内网/离线环境下图标不再依赖第三方站点可达性。
- **主题切换（F5）**：亮/暗主题即时切换，偏好写入 `localStorage` 并跨刷新保持。
- **版本信息接口**：新增 `GET /version`（公共路由，无需鉴权），返回版本号、提交哈希、
  构建时间与 Go 版本；启动日志同样打印版本，便于问题排查。
- 引入 AI 协作文档体系：`AGENTS.md`、`CONTRIBUTING.md`、`ROADMAP.md`、`docs/architecture.md`、
  `docs/configuration.md`、`docs/definition-of-done.md`、`docs/adr/`。
- 新增 CI 门禁 `.github/workflows/build.yml`（job `test`）：后端安装依赖 + lint + 格式检查 + 测试，
  以及前端 lint + 格式检查 + 类型检查 + 单元测试，共 13 步。
- 新增 `.gitattributes`，统一库内 LF（`*.bat` 保持 CRLF 以保证 Windows 可执行）。
- 新增 `docs/adr/0002-environment-variable-layering.md`：确立环境变量三层模型。
- 新增 `docs/adr/0003-remove-is-pkg.md`：移除遗留的 `IS_PKG` 死配置。
- 打包产物版本号经 `-ldflags` 注入 `internal/version`，`build.sh` / `pkg.yml` / `Dockerfile`
  三条链路同构。

### Changed

- **后端由 NestJS 重写为 Go**：技术栈为 gin + gorm + `modernc.org/sqlite`（纯 Go，无 CGO），
  单文件二进制取代 `@yao-pkg/pkg` 打包。**接口路径与响应信封保持不变**，前端无需改动。
- **构建链路去 Node 化**：新增 `build.sh` 取代 `build.js` / `build.bat`；Dockerfile 拆为
  前端(node) → 后端(go) → 运行(alpine) 三段（官方 `golang` 镜像不含 node/npm，无法合并阶段）。
- 环境变量加载顺序调整为 `[.env, .env.<NODE_ENV>]`，使仓库外的本机 `.env` 成为最高文件优先级层
  （原先 `.env` 权重低于模式文件，本地覆盖无效）。详见 `docs/configuration.md` §2。
- `.gitignore` 增补忽略项：`.env`、`.env.local`、`.env.*.local`、`*.key` / `*.pem` / `*.p12` / `*.pfx` /
  `*.jks` / `secrets/` 等凭据，以及 SQLite 运行时产物。
  `.env.development` / `.env.production` 作为**非敏感默认值**继续入库（Docker / pkg / build.sh 三条链路依赖）。
- 前端接入 ESLint / Prettier / TypeScript 类型检查 / Vitest，并纳入 CI 门禁。
- 分支模型收敛为 **`main` 单分支**，废弃 `develop`；`main` 启用分支保护
  （禁止直推、要求 PR 与 CI 通过）。
- GitHub Actions 全面升级到 Node.js 24 版本（`checkout@v5`、`setup-go@v6`、
  `pnpm/action-setup@v5`、`setup-node@v5`、`upload-artifact@v6`、`download-artifact@v7`）。
- 发布工作流 `pkg.yml` / `docker.yml` 增加 `workflow_dispatch`，可在未打 tag 时试跑构建。
- 文档中 `build.js` 相关说明统一改为 `build.sh`；根 `README.md` 与 `CONTRIBUTING.md` 重写为 Go 项目描述。

### Fixed

- **中文文本与文字图标乱码（B1 / B3）**：文字图标的 SVG 被双重 `encodeURIComponent`
  编码，浏览器只解一层，导致 `<text>` 内容显示为 `%E4%B8%AD` 形式。改为 SVG 源文本写原始字符、
  返回时只编码一次；同时对 `& < >` 做 XML 转义，并用 `Array.from(str)[0]` 按码点取首字符
  （避免 emoji 代理对被切半）。
- **内网可达性探测误用 favicon（B4）**：`autoSelect` 曾把「`intUrl/favicon.ico` 加载失败」
  当成「内网不可达」，导致无 favicon 的内网服务（lucky / easynode / openwrt）全部跳转公网。
- **EditModal 首个输入框焦点光晕不全（B2）**：焦点光晕 `box-shadow` 的 alpha 由 `0.1` 提到
  `0.25`，修复在半像素坐标下因抗锯齿稀释而目视不可见的问题。
- **主题切换暗色下两处显示缺陷（F5）**：补 `[data-theme='dark']` 下的 `--gradient-1/2`
  亮色变体（原仅 `:root` 定义，深蓝紫压深底几乎看不清）；「添加」卡片的 `+` 图标改用
  `filter: invert(1)`（原本是黑色描边，暗底不可见）。
- **发布打包链路**：`pkg.yml` 的产物由「单个裸二进制」改为 zip（含 `server`、`web/`、
  `migrations/schema.sql`、`.env`），并在打 `v*` tag 时自动上传到对应 Release。
  此前产出的可执行文件缺少前端产物与建表 SQL，下载后无法直接运行。
- **CI 修复**：`build.yml` 中 `pnpm/action-setup` 调整到 `setup-node`（带 `cache: pnpm`）之前，
  修复前端门禁从未运行的问题；Go 依赖缓存补齐 `cache-dependency-path: backend/go.sum`。
- **Docker 修复**：`.dockerignore` 不再整目录排除 `frontend/`（Dockerfile 需要 `COPY frontend`）；
  Dockerfile 拆出 Node 构建阶段，修复 `npm: not found`。

### Removed

- 移除 `IS_PKG` 死配置（G6）：构建期标记已被单文件二进制架构取代。
- 移除后端 `--passWithNoTests` 假绿配置（G5）。

## [0.1.13] - 2025-10-15

> 本版本及更早的条目详见 `docs/开发计划.md`（历史存档）。

