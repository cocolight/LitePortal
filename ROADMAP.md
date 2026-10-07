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
| F5 | 主题切换 | feature/theme-switch | planned | - | 亮 / 暗切换即时生效且持久化（`this.$` 颜色对比可通过肉眼验证）；刷新后不回弹 |
| F6 | 文件夹功能 + 一键打开文件夹内网址 | feature/folder | planned | F3 | 可创建文件夹并移入链接；一键打开能一次性新开文件夹内全部网址（浏览器实际打开多个标签页） |
| F7 | 自定义搜索引擎 | feature/custom-search-engine | planned | - | 可配置搜索模板；切换后搜索框按新模板跳转正确 URL |
| F8 | 在线图标缓存 | feature/icon-cache | planned | - | 同一图标 URL 第二次加载走缓存（Network 面板显示 from cache / 命中本地缓存）；离线时仍显示已缓存图标 |
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
| B1 | 中文文本显示乱码 | fix/cjk-garbled | planned | - | 构造含中文名称 / 描述的链接，前后端往返后显示与输入完全一致；SQLite 文件用 UTF-8 读取正常 |
| B2 | EditModal 第一个 input 的蓝色光晕不全 | fix/editmodal-focus-ring | planned | - | 聚焦第一个输入框时 outline 四边完整；多浏览器（Chrome / Edge）目视一致 |
| B3 | 文字图标中文显示错误 | fix/text-icon-cjk | planned | - | 中文文字图标按预期截取并显示（与 F1 / B1 联动验证） |
| B4 | 点击图标时内网可达性探测误用 favicon：`autoSelect` 把「`intUrl/favicon.ico` 加载失败」当成「内网不可达」，导致无 favicon 的内网服务（lucky/easynode/openwrt）全部跳公网 | fix/intranet-reachability | done | - | ✅ 已满足：`frontend/src/utils/linkUtils.ts` 的 `autoSelect` 改为 `fetch(candidate, { method:'HEAD', mode:'no-cors', cache:'no-store', signal })` 探测连通性（opaque 响应，只看能否建连，与 favicon 及 HTTP 状态码完全解耦），1500ms 超时用 `AbortController`；裸地址依次试 http / https。`linkUtils.spec.ts` 13 例回归断言探测路径**不含 favicon**、方法为 `HEAD`，覆盖「内网可达但无 favicon → 走内网」「内网不可达 / 超时 → 回退公网」「裸地址先试 http」。已随 PR #4 合入 `main`（`a53766c`），CI `test` job 13/13 步 pass（1m4s） |

## 四、状态约定

- 开工前把状态从 `planned` 改为 `in-progress`，并填好「分支」列。
- 功能完成的定义见 `docs/definition-of-done.md`；完成后把状态改为 `done`，**不要删行**。
- 已标记为 `done` 的行，其验收标准不得改写。
