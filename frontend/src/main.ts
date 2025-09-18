import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import './style.css'
import App from './App.vue'
import { logEnvInfo } from './utils/env'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// 打印环境信息（仅在开发环境有效）
logEnvInfo()

app.mount('#app')