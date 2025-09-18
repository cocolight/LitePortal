import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueDevTools from 'vite-plugin-vue-devtools'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 根据模式加载不同的环境变量
  const env = loadEnv(mode, process.cwd())

  // 根据环境决定是否启用 VueDevTools
  const plugins = [vue()]
  if (env.VITE_ENABLE_DEVTOOLS === 'true') {
    plugins.push(VueDevTools())
  }

  return {
    plugins,
    base: './',
    build: { 
      outDir: '../web', 
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