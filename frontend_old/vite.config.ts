import { defineConfig } from 'vite'
export default defineConfig({
  base: './',
  build: { outDir: '../web', emptyOutDir: true },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})