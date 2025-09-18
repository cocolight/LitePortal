import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueDevTools from 'vite-plugin-vue-devtools'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import viteCompression from 'vite-plugin-compression'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 根据模式加载不同的环境变量
  const env = loadEnv(mode, process.cwd())

  // 根据环境决定是否启用 VueDevTools
  const plugins = [
    vue(),
    // 自动导入 Vue 组件
    Components({
      dirs: ['src/components'],
      deep: true,
      dts: true, // 生成类型声明文件
    }),
    // 自动导入 Vue API
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      dts: true, // 生成类型声明文件
    })
  ]
  
  // 开发环境启用 VueDevTools
  if (env.VITE_ENABLE_DEVTOOLS === 'true') {
    plugins.push(VueDevTools())
  }
  
  // 生产环境启用压缩和包分析
  if (mode === 'production') {
    plugins.push(
      // 生成 gzip 压缩文件
      viteCompression({
        verbose: true,
        disable: false,
        threshold: 10240, // 大于 10kb 的文件会被压缩
        algorithm: 'gzip',
        ext: '.gz',
      }),
      // 包分析工具
      visualizer({
        open: false, // 不自动打开分析报告
        gzipSize: true,
        brotliSize: true,
        filename: 'stats.html', // 分析报告文件名
      })
    )
  }

  return {
    plugins,
    base: './',
    build: {
      outDir: './dist',
      emptyOutDir: true,
      // 生产环境配置
      minify: mode === 'production' ? 'terser' : false,
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production',
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        'vue': 'vue/dist/vue.esm-bundler.js'
      }
    },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8080',
          changeOrigin: true
        }
      }
    }
  }
})