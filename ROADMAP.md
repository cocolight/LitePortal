# LitePortal 功能清单（ROADMAP）

> 状态取值：`planned` / `in-progress` / `done` / `dropped`。
> 「验收标准」须**可判定**（能被命令或明确检查验证），AI 助手据此判断功能是否完成。
> 历史开发记录已完整迁移自 `docs/开发计划.md`；该文件此后不再更新。

## 一、工程治理（先行，直接影响交付可信度）

| # | 项目 | 分支 | 状态 | 依赖 | 验收标准 |
|---|------|------|------|------|----------|
| G1 | 引入 AI 协作文档体系（AGENTS / CONTRIBUTING / ROADMAP / docs/\* / ADR） | docs/ai-collab-docs | done | - | 仓库根目录存在 `AGENTS.md`、`CONTRIBUTING.md`、`ROADMAP.md`、`CHANGELOG.md`；`docs/` 下有 `architecture.md`、`configuration.md`、`definition-of-done.md`、`adr/`；`AGENTS.md` §1 引用的每个文件都真实存在（无死链） |
| G2 | CI 门禁落地 | ci/build-workflow | in-progress | G1 | `.github/workflows/build.yml` 存在且 job 名为 `test`；本地 `cd backend && go test ./...` 通过；首次 push 后 GitHub Actions 有 `test` 检查项 |
| G3 | GitHub 分支保护 + required status checks | - | planned | G2 | 保护分支无法直接 push；PR 未通过 `test` 检查时 merge 按钮被禁用 |
| G4 | 前端接入 lint / 格式化 / 测试并纳入 CI | chore/frontend-quality | planned | G2 | `frontend/package.json` 至少有 `lint`、`format:check`、`test` 三个脚本且各自非空跑通过；`build.yml` 增补前端三步（不得弱化已有后端步骤） |
| G5 | 移除后端 `--passWithNoTests` 假绿 | chore/no-pass-with-no-tests | done | G4 | NestJS jest `--passWithNoTests` 已随 Go 重构消除；后端以 `go test ./...` 真实执行（现有 `internal/handler/handler_test.go`） |
| G6 | 清理 `IS_PKG` 死配置 | chore/remove-is-pkg | planned | G1 | `.env.development` / `.env.production` 中无 `IS_PKG`；Go 代码（`config.go`）不读取该变量；三平台打包产物启动无回归 |

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
| B4 | 点击图标时内网可达性探测误用 favicon：`autoSelect` 把「`intUrl/favicon.ico` 加载失败」当成「内网不可达」，导致无 favicon 的内网服务（lucky/easynode/openwrt）全部跳公网 | fix/intranet-reachability | planned | - | 构造 link：`intUrl`=内网可达但无 favicon 的服务、`extUrl`=公网 → 局域网点击打开**内网**地址（不再跳公网）；`intUrl`=内网不可达（如 192.168.99.99）→ 点击打开公网；有 favicon 的（飞牛）行为不变；图标获取失败**不**影响点击地址 |

## 四、状态约定

- 开工前把状态从 `planned` 改为 `in-progress`，并填好「分支」列。
- 功能完成的定义见 `docs/definition-of-done.md`；完成后把状态改为 `done`，**不要删行**。
- 已标记为 `done` 的行，其验收标准不得改写。
