# LitePortal 功能清单（ROADMAP）

> 状态取值：`planned` / `in-progress` / `done` / `dropped`。
> 「验收标准」须**可判定**（能被命令或明确检查验证），AI 助手据此判断功能是否完成。
> 历史开发记录已完整迁移自 `docs/开发计划.md`；该文件此后不再更新。

## 一、工程治理（先行，直接影响交付可信度）

| # | 项目 | 分支 | 状态 | 依赖 | 验收标准 |
|---|------|------|------|------|----------|
| G1 | 引入 AI 协作文档体系（AGENTS / CONTRIBUTING / ROADMAP / docs/\* / ADR） | docs/ai-collab-docs | done | - | 仓库根目录存在 `AGENTS.md`、`CONTRIBUTING.md`、`ROADMAP.md`、`CHANGELOG.md`；`docs/` 下有 `architecture.md`、`configuration.md`、`definition-of-done.md`、`adr/`；`AGENTS.md` §1 引用的每个文件都真实存在（无死链） |
| G2 | CI 门禁落地 | ci/build-workflow | done | G1 | ✅ 已满足：`.github/workflows/build.yml` 存在且 job 名为 `test`（跑 `go vet` + `gofmt -l` + `go test ./...`）；本地 `cd backend && go test ./...` 通过；PR #2 首次 push 后 GitHub Actions 出现 `test` 检查项且 pass（46s）。G3 / G4 已解锁 |
| G3 | GitHub 分支保护 + required status checks | - | done | G2 | ✅ 已满足：仓库 ruleset `24504111`「protect main branch」`enforcement=active`，仅覆盖 `refs/heads/main`，含 `deletion` / `non_fast_forward` / `required_status_checks`(`test`) / `pull_request`（审批数 0，只强制走 PR，避免单人仓库自审死锁）四条规则。实测直推 main 被拒：`GH013: Repository rule violations` → `Required status check "test" is expected`、`Changes must be made through a pull request`；反向验证 PR #5 / #6 走 PR 且 `test` pass 后均正常合并（rebase，1m0s / 1m2s） |
| G4 | 前端接入 lint / 格式化 / 测试并纳入 CI | chore/frontend-quality | done | G2 | ✅ 已满足：`frontend/package.json` 含 `lint`(`eslint . --quiet`)、`format:check`(`prettier --check .`)、`test`(`vitest run`)、`typecheck`(`tsc --noEmit`)、`code:check` 五个脚本且各自真实跑通过；`build.yml` 已补齐前端四步（install/lint/format/test/typecheck），未弱化后端任何一步。真实测试 18 例（`linkUtils.spec.ts` 13 + `useLinks.spec.ts` 5），**无 `--passWithNoTests` 式假绿**。存量技术债（any 9 / 空接口 4 / console 3）以 warning 可见不阻塞，待专项清理 |
| G5 | 移除后端 `--passWithNoTests` 假绿 | chore/no-pass-with-no-tests | done | G4 | NestJS jest `--passWithNoTests` 已随 Go 重构消除；后端以 `go test ./...` 真实执行（现有 `internal/handler/handler_test.go`） |
| G6 | 清理 `IS_PKG` 死配置 | chore/remove-is-pkg | done | G1 | ✅ 已满足：`.env.development` / `.env.production` 中已无 `IS_PKG`；Go 代码从不读取该变量（全仓 grep 确认零引用）；三平台交叉编译（linux/darwin/windows × amd64, CGO_ENABLED=0）产物体积与清理前**逐字节零差异**，windows 产物实跑 `GET /links` 返回种子数据无回归。决策记录见 `docs/adr/0003-remove-is-pkg.md` |

## 二、功能 backlog

| # | 功能 | 分支 | 状态 | 依赖 | 验收标准 |
|---|------|------|------|------|----------|
| F1 | 支持显示 / 隐藏图标 | feature/toggle-icon-visibility | planned | - | 单个图标可在编辑弹窗设置可见性；首页不渲染隐藏项；隐藏项的配置数据未被删除（重启后仍可在后台找回） |
| F2 | 图标分组分页 | feature/icon-group-paging | planned | - | 首页按分组渲染，分页切换不丢数据；刷新后分组与页码状态保持一致 |
| F3 | 图标排序 | feature/icon-sorting | planned | - | 拖拽或菜单调整顺序后可持久化；重启服务后顺序保持 |
| F4 | 支持切换壁纸 | feature/wallpaper | planned | - | 设置项可切换壁纸并持久化；刷新页面后生效 |
| F5 | 主题切换 | feature/theme-switch | done | - | ✅ 已满足：核心功能（亮/暗即时切换 + `localStorage` 持久化 + 刷新不回弹）经无头 Edge 实测确认——点一次 → `data-theme="dark"`、`--bg:#0a0e1a`、图标 🌙；点两次 → 回到 `""`（跟随系统）；刷新后 `localStorage.theme='dark'` 仍生效。本次修复暗色下两个真实缺陷：① **`.add-card` 的 `+` 图标不可见** —— 图标来自 `mdi:plus.svg`（黑色描边），压在 `#0a0e1a` 上不可见，加 `[data-theme='dark'] .add-card img { filter: invert(1) }`；② **`h1` 渐变标题偏暗** —— `--gradient-1/2`（`#4a6cf7`/`#8b5cf6`）原先未在 `[data-theme='dark']` 覆盖，深蓝紫压深底几乎看不清，补亮色变体 `#7dd3fc`/`#c4b5fd`。实测：暗色下 `h1` 实际渐变为 `rgb(125,211,252) → rgb(196,181,253)`、`add-card img filter=invert(1)`；切回浅色后变量恢复 `#4a6cf7`/`#8b5cf6`、`filter=none`，**未污染浅色**。另注：实测中发现「刷新失败」通知浮层（`#notification-container`，`position:fixed; z-index:10000`）会覆盖右上角 `#themeToggle` 并吞掉点击，属**独立 UI 缺陷**，不在本项范围 |
| F6 | 文件夹功能 + 一键打开文件夹内网址 | feature/folder | planned | F3 | 可创建文件夹并移入链接；一键打开能一次性新开文件夹内全部网址（浏览器实际打开多个标签页） |
| F7 | 自定义搜索引擎 | feature/custom-search-engine | planned | - | 可配置搜索模板；切换后搜索框按新模板跳转正确 URL |
| F8 | 在线图标缓存 | feature/icon-cache | done | - | ✅ 已满足：新增 `backend/internal/iconproxy` 包 + `GET /icons/proxy?url=<原地址>`（公共路由，不经 UserGuard）。首次请求回源下载并**原子落盘**到 `data/icons/<sha256(url)>.<ext>`（先写临时文件再 rename，避免并发读到半截）；命中直接返回本地文件并带 `Cache-Control: public, max-age=31536000, immutable`。前端 `toProxiedIconUrl` 把 http/https 图标改写为经代理的地址（`data:`/`blob:`/相对路径原样返回），`Card.vue` 与 `IconPreview.vue` 同规则，预览与首页一致。**实测证据**：① 回源 851B SVG，二次请求内容 MD5 与磁盘文件逐字节一致；② **离线命中** —— 预置缓存后用不可解析域名 `offline-test.example` 请求，仍返回 200 + 预置内容（29B, `image/png`）；③ **端到端** —— 无头 Edge 打开页面，`<img src>` 确为 `/icons/proxy?...`，github favicon 二次加载 `natural=32x32 / complete=true / **7ms**`（命中磁盘缓存）；④ **SSRF 防护** —— `127.0.0.1` / `localhost` / `192.168.1.1` / `file://` 全部 502。安全边界：仅 http/https、拒绝环回与私有/链路本地网段（含 DNS 解析后逐个校验）、1MB 大小上限、扩展名白名单。测试：`iconproxy_test.go` 9 例（缓存落盘/重启后命中/协议白名单/SSRF/超大响应/上游错误/扩展名推导/空文件不算命中）+ `icon_test.go` 3 例（透传并缓存/缺参 400/上游失败 502）；前端 `iconUtils.spec.ts` 新增 6 例 |
| F9 | 设置备份 / 恢复 | feature/backup-restore | planned | - | 导出单个 SQLite 快照文件；恢复后链接数据与原数据一致（条数、字段值逐一相同） |
| F10 | 用户登录鉴权 | feature/auth | planned | - | 未登录访问管理接口返回统一错误信封（`internal/handler/handler.go` 的 `ApiError`，对应 HTTP 401）；登录后 CRUD 正常；密钥 / 口令不入库且不在日志中出现 |
| F11 | 压缩二进制文件大小 | chore/shrink-binary | planned | G6 | 三平台产物体积相对当前版本下降且程序可正常启动读写数据（`pkg.yml` 产物 size 对比 + 冒烟） |
| F12 | 客户端支持在线升级 | feature/auto-update | planned | F11 | 检测到新 Release 后提示并可完成升级；升级后版本正确且数据未丢失 |
| F13 | 浏览器书签导入（Chrome/Edge/Firefox：Netscape HTML 与 Chrome JSON 两种格式） | feature/bookmark-import | planned | - | 新增后端 `POST /links/batch` 批量接口；导入 Chrome 书签 JSON 后 links 条数 = 书签叶子节点数、名称/URL 一致、ICON(data:URI)正确显示；导入 Netscape HTML 同样生效；嵌套文件夹可扁平化或映射为分组 |
| F14 | WebDAV 备份与恢复 | feature/webdav-backup | planned | F9 | 新增 `backup` 模块 `GET /backup/export`；配置 WebDAV 后点备份，远端出现 `liteportal-backup-<date>.json` 且内容 == export；清空 links 后点恢复可还原且条数/字段一致；WebDAV 密码**不**入任何日志/响应体（运行时参数，不入库） |

> 更远期（尚未拆解验收标准）：小组件、图标库、搜索图标、反馈通道、自定义右上角角标、浏览器插件、界面样式优化。

## 三、缺陷 backlog

| # | 缺陷 | 分支 | 状态 | 依赖 | 验收标准 |
|---|------|------|------|------|----------|
| B1 | 中文文本显示乱码 | fix/cjk-garbled | done | - | ✅ 已满足（**Go 重写后该缺陷已不复现**）：曾属 NestJS 时期的历史缺陷，Go 版从未复现过。2026-10-07 全链路实测 —— ① 链路往返：POST / GET 含中文名 / 描述（含 `·` 与 emoji 😀）逐字符相等，`name` 字节 `e4b8ade69687e6b58be8af95c2b7e997a8e688b7` 与输入完全一致；② 响应头 `Content-Type: application/json; charset=utf-8`（静态资源为 `text/html; charset=utf-8`）；③ SQLite 文件头部偏移 56 的 `text_encoding = 1`（UTF-8），`PRAGMA encoding` 返回 `UTF-8`；④ 真实浏览器（无头 Edge）渲染首页，中文名称与搜索框文案正常。新增 `TestCJKRoundTrip`（`backend/internal/handler/handler_test.go`）作为**回归防线**，断言响应头 charset、创建/详情/列表三处中文无损、且往返后 UTF-8 字节序列逐字节一致 |
| B2 | EditModal 第一个 input 的蓝色光晕不全 | fix/editmodal-focus-ring | done | - | ✅ 已满足：**根因不是四边缺失，而是焦点光晕不透明度太低**。该光晕由 `box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1)` 提供，10% 蓝铺在白底上仅得 `rgb(235,242,254)`（与纯白仅差约 20 色阶），叠加输入框 `getBoundingClientRect().top = 404.59375` 的**半像素对齐**，上方那一圈被抗锯齿进一步稀释到肉眼不可见 —— 实测表现为「上方光晕消失」。用 CDP（手写 WebSocket，走 `Page.captureScreenshot` + `Runtime.evaluate`）在真实 dev server 页面逐像素采样：修复前四边 3px 均在但颜色仅 `rgb(235,242,254)`；10 倍放大截图证实上方目视不可见、左右下勉强可见。修法：两处副本同步把 alpha 由 `0.1` 提到 `0.25`（`frontend/src/style.css` 的全局 `.modal input:focus` 与 `frontend/src/components/EditModal/FormData.vue` 的 scoped `$input-focus-shadow`），并加注释说明二者必须保持一致。修复后同管线复测：四边各 3px、颜色 `rgb(206,224,253)`、**完全对称**，10 倍放大目视四边完整清晰。已用无头 Edge 实测；**本机无 Chrome**，该属性为通用 CSS，预期 Chrome 一致（如需可本地目视复核） |
| B3 | 文字图标中文显示错误 | fix/text-icon-cjk | done | - | ✅ 已满足：根因是 `frontend/src/utils/iconUtils.ts` 的 `generateTextSvg` 对 SVG 文本**双重百分号编码** —— `<text>` 内先 `encodeURIComponent(char)`（`中` → `%E4%B8%AD`），返回时又 `encodeURIComponent(svg)`（`%` → `%25`）；浏览器解 data URL 只解一层，文本节点留下字面量 `%E4%B8%AD`，渲染为 `%B8` 这类乱码。改为 SVG 源文本内直接写原始字符（仅做 XML 转义 `& < >`），只在构造 data URL 时编码**一次**，并显式声明 `charset=utf-8`。另抽出 `pickTextIconChar` 统一 Card 与 IconPreview 的截取规则（原来一处 `charAt(0)`、一处 `charAt(0).toUpperCase()`，导致 `a` 在首页与预览显示不一致）。新增 `iconUtils.spec.ts` 24 例；**证伪检验**：还原旧实现后 7 例失败（全为 B3 核心断言），修复后 24 例全绿。已用无头 Edge 实测截图确认：修复前卡片显示 `%B8`，修复后正常显示「中」 |
| B4 | 点击图标时内网可达性探测误用 favicon：`autoSelect` 把「`intUrl/favicon.ico` 加载失败」当成「内网不可达」，导致无 favicon 的内网服务（lucky/easynode/openwrt）全部跳公网 | fix/intranet-reachability | done | - | ✅ 已满足：`frontend/src/utils/linkUtils.ts` 的 `autoSelect` 改为 `fetch(candidate, { method:'HEAD', mode:'no-cors', cache:'no-store', signal })` 探测连通性（opaque 响应，只看能否建连，与 favicon 及 HTTP 状态码完全解耦），1500ms 超时用 `AbortController`；裸地址依次试 http / https。`linkUtils.spec.ts` 13 例回归断言探测路径**不含 favicon**、方法为 `HEAD`，覆盖「内网可达但无 favicon → 走内网」「内网不可达 / 超时 → 回退公网」「裸地址先试 http」。已随 PR #4 合入 `main`（`a53766c`），CI `test` job 13/13 步 pass（1m4s） |

## 四、状态约定

- 开工前把状态从 `planned` 改为 `in-progress`，并填好「分支」列。
- 功能完成的定义见 `docs/definition-of-done.md`；完成后把状态改为 `done`，**不要删行**。
- 已标记为 `done` 的行，其验收标准不得改写。
