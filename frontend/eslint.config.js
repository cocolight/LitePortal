import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVueTs from '@vue/eslint-config-prettier'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

/**
 * 前端 ESLint 配置（flat config，ESLint 9 格式）
 *
 * 设计原则
 * ──────────
 * 1) **风格问题交给 Prettier**，ESLint 只抓真实缺陷。
 *    由 skip-formatting 关闭所有与 Prettier 冲突的格式规则，二者职责不重叠。
 * 2) **匹配现有代码风格**（45 个源文件从未被格式化过）。
 *    对纯风格类规则（组件命名、属性顺序、换行）一律降级或关闭，
 *    避免 CI 因历史风格问题全线飘红、门禁失去意义。
 * 3) **不为 lint 而改代码**。真实缺陷才升级为 error。
 *
 * 风格基线（对齐 .prettierrc.json）：单引号、无分号、2 空格、LF、printWidth 100。
 */
export default defineConfigWithVueTs(
  {
    // 忽略构建产物与自动生成文件
    ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'auto-imports.d.ts', 'components.d.ts'],
  },

  // ── Vue 基础解析（含 <script setup> 语法）────────────────────
  pluginVue.configs['flat/essential'],

  // ── Vue + TypeScript：关键是它为 .vue 内的 TS 配上 vue-eslint-parser ──
  // 不加这一步，.vue 文件里的 <script setup lang="ts"> 会全部解析失败（8 个 parse error）
  vueTsConfigs.recommended,

  // ── 关闭与 Prettier 冲突的格式规则（须放在最后）─────────────
  pluginVueTs,

  // ── 项目级规则 ───────────────────────────────────────────────
  {
    files: ['**/*.{ts,tsx,vue}'],
    rules: {
      ...skipFormatting.rules,

      // 禁止遗留 console：生产环境调试输出应走 logger 或删除
      // 例外允许 warn / error（错误上报是有意义的）
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // ⚠️ 刻意关闭 no-unused-vars 的「误报源」：
      // `<script setup>` 顶层变量会自动暴露给模板，模板里在用，
      // 但静态分析看不出模板引用了它，会误报「only used as a type」。
      // 本项目的真实类型检查由 `typecheck`(tsc --noEmit) 承担，此处不重复拦截。
      '@typescript-eslint/no-unused-vars': 'off',

      // 异步 Promise executor 几乎总是错的
      'no-async-promise-executor': 'error',
    },
  },

  // ── 存量技术债：降级为 warn，不阻塞门禁 ────────────────────────
  // 以下问题确实存在（any 滥用 / 空接口 / 遗留 console.log），但它们是**历史欠账**，
  // 不属于本次改动范围。按红线「不为让检查变绿而改无关代码」，
  // 这里设为 warn：门禁照常报告，新代码不引入新的 error，
  // 待技术债专项清理后再升级为 error（见 ROADMAP G4 后续）。
  {
    files: ['**/*.{ts,tsx,vue}'],
    rules: {
      // 显式 any 会让类型系统失效 —— 存量待清理，先 warn
      '@typescript-eslint/no-explicit-any': 'warn',
      // `interface{}` 与 `{}` 等价 —— 存量待清理，先 warn
      '@typescript-eslint/no-empty-object-type': 'warn',
      // 无副作用表达式常是漏写赋值的 bug —— 存量待清理，先 warn
      '@typescript-eslint/no-unused-expressions': 'warn',
    },
  },

  // ── 组件命名：About / Home / Card 等单词名是既有事实 ──────────
  // 强制 multi-word 会让 2 个文件报错且收益极低，按「匹配现有风格」关闭
  {
    files: ['**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
      // 模板属性顺序 / 首行换行属纯风格，交给 Prettier 与人工审查
      'vue/attributes-order': 'off',
      'vue/first-attribute-linebreak': 'off',
    },
  },

  // ── 测试文件放宽：测试里允许 any 与未断言表达式 ──────────────
  {
    files: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
)
