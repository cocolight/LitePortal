import { ref, watch, onMounted } from 'vue'
import type { Theme } from '@/types'

export function useTheme() {
  const theme = ref<string>(localStorage.getItem('theme') || '')

  const setTheme = (newTheme: string): void => {
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
  watch(theme, (newTheme: string): void => {
    document.documentElement.setAttribute('data-theme', newTheme)
  })

  return {
    theme,
    setTheme,
    toggleTheme
  }
}