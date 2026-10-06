import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { fileURLToPath, URL } from 'node:url'

/**
 * Vitest 配置
 *
 * 刻意复用 vite.config 的插件与别名，保证测试环境与开发环境一致
 * （否则测试跑的是另一套解析规则，会出现「测试通过但构建失败」）。
 */
export default defineConfig({
  plugins: [
    vue(),
    // 与 vite.config.ts 保持一致的自动导入配置
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      dts: false, // 测试环境不写类型声明，避免污染工作树
    }),
    Components({
      dirs: ['src/components'],
      deep: true,
      dts: false,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // 组件测试需要 DOM 环境
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,mjs,ts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // 只统计手写源码；自动生成的声明文件不计入
      exclude: ['src/auto-imports.d.ts', 'src/components.d.ts', '**/*.d.ts'],
    },
  },
})
