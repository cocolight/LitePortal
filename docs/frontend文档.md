# Frontend 开发文档

## 项目概述
LitePortal 的前端部分是一个基于 Vue 3 + TypeScript 的现代化单页应用，使用 Vite 作为构建工具，提供了轻量级的门户网站导航体验。

## 技术栈
- **核心框架**: Vue 3
- **开发语言**: TypeScript
- **构建工具**: Vite
- **状态管理**: Pinia
- **路由**: Vue Router
- **HTTP 客户端**: Axios
- **UI 组件**: 自定义组件库
- **样式**: SCSS
- **工具库**: Lodash-es

## 项目结构
```
frontend/
├── src/
│   ├── api/          # API 接口封装
│   ├── assets/       # 静态资源
│   ├── components/   # 公共组件
│   ├── composables/  # 组合式函数
│   ├── router/       # 路由配置
│   ├── stores/       # 状态管理
│   ├── types/        # TypeScript 类型定义
│   ├── utils/        # 工具函数
│   └── views/        # 页面组件
```

## 核心功能模块

### 1. API 接口管理
- **位置**: `src/api/`
- **主要文件**:
  - `http/client.ts`: HTTP 客户端封装
  - `endpoints/`: API 端点定义
  - `index.ts`: 统一导出

### 2. 状态管理
- **位置**: `src/stores/`
- **主要功能**:
  - 链接数据管理 (`linkStore.ts`)
  - 支持持久化存储
  - 响应式状态更新

### 3. 组件系统
- **位置**: `src/components/`
- **核心组件**:
  - `Card.vue`: 链接卡片组件
  - `CardGrid.vue`: 卡片网格布局
  - `EditModal/`: 链接编辑模态框
  - `SearchBox.vue`: 搜索框组件
  - `ThemeToggle.vue`: 主题切换

### 4. 组合式函数
- **位置**: `src/composables/`
- **主要功能**:
  - `useHome.ts`: 首页逻辑
  - `useLinks.ts`: 链接操作
  - `useSearch.ts`: 搜索功能
  - `useTheme.ts`: 主题管理

## 开发指南

### 环境要求
- Node.js >= 16
- npm >= 8

### 安装依赖
```bash
pnpm install
```

### 开发环境运行
```bash
pnpm run start:dev
```

### 构建生产版本
```bash
pnpm run build
```

### 代码规范
- 使用 ESLint 进行代码检查
- 使用 Prettier 进行代码格式化
- 遵循 TypeScript 严格模式

## 关键配置说明

### Vite 配置 (`vite.config.ts`)
- 自动导入 Vue 组件和 API
- 开发环境代理配置
- 生产环境优化配置
- 路径别名配置

### TypeScript 配置
- 严格模式启用
- 路径别名支持
- Vue 3 类型支持

## 部署说明

### 构建产物
- 默认输出到 `dist/` 目录
- 支持 Gzip 压缩
- 生成包分析报告

### 环境变量
- `VITE_API_BASE_URL`: API 基础地址
- `VITE_ENABLE_DEVTOOLS`: 是否启用 Vue DevTools

## 注意事项
1. 所有 API 请求都通过统一的 HTTP 客户端处理
2. 组件采用自动导入，无需手动注册
3. 状态管理使用 Pinia，支持 TypeScript
4. 主题切换支持亮色/暗色模式
5. 搜索功能支持多搜索引擎切换

## 开发建议
1. 新增组件时请放在 `src/components/` 目录下
2. 共享逻辑建议抽取为组合式函数
3. 类型定义统一放在 `src/types/` 目录
4. 遵循现有的代码风格和命名规范
5. 提交前运行代码检查和格式化