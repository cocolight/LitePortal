import { ref, watch, onMounted } from 'vue'

export function useTheme() {
  const theme = ref(localStorage.getItem('theme') || '')
  
  const setTheme = (newTheme) => {
    theme.value = newTheme
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
  }
  
  const toggleTheme = () => {
    const isDark = theme.value === 'dark'
    setTheme(isDark ? '' : 'dark')
  }
  
  // 初始化主题
  onMounted(() => {
    if (theme.value) {
      document.documentElement.setAttribute('data-theme', theme.value)
    }
  })
  
  // 监听主题变化
  watch(theme, (newTheme) => {
    document.documentElement.setAttribute('data-theme', newTheme)
  })
  
  return {
    theme,
    setTheme,
    toggleTheme
  }
}
