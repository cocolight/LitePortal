import { ref, watch, onMounted } from 'vue'
import type { Theme } from '@/types'

/** 合法主题值白名单：localStorage 内容不可信，越界值一律降级为 ''（跟随系统） */
const isTheme = (v: string | null): v is Theme => v === 'light' || v === 'dark' || v === ''

export function useTheme() {
  const stored = localStorage.getItem('theme')
  const theme = ref<Theme>(isTheme(stored) ? stored : '')

  const setTheme = (newTheme: Theme): void => {
    theme.value = newTheme
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
  }

  const toggleTheme = (): void => {
    const isDark = theme.value === 'dark'
    setTheme(isDark ? '' : 'dark')
  }

  // 初始化主题
  onMounted((): void => {
    if (theme.value) {
      document.documentElement.setAttribute('data-theme', theme.value)
    }
  })

  // 监听主题变化
  watch(theme, (newTheme: Theme): void => {
    document.documentElement.setAttribute('data-theme', newTheme)
  })

  return {
    theme,
    setTheme,
    toggleTheme,
  }
}
