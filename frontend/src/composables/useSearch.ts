import { ref } from 'vue'
import type { SearchEngine } from '../types'

export function useSearch() {
  // 搜索引擎配置
  const engines = ref<SearchEngine[]>([
    { name: 'Google', url: 'https://www.google.com/search?q=' },
    { name: '百度', url: 'https://www.baidu.com/s?wd=' },
    { name: '必应', url: 'https://cn.bing.com/search?q=' },
    { name: 'Duck', url: 'https://duckduckgo.com/?q=' }
  ])

  const currentEngine = ref<SearchEngine>(engines.value[0])
  const searchQuery = ref<string>('')

  const setCurrentEngine = (engine: SearchEngine): void => {
    currentEngine.value = engine
  }

  const performSearch = (): void => {
    if (searchQuery.value.trim()) {
      const url = currentEngine.value.url + encodeURIComponent(searchQuery.value.trim())
      window.open(url, '_blank')
      searchQuery.value = ''
    }
  }

  const handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Enter' && searchQuery.value.trim()) {
      performSearch()
    }
  }

  return {
    engines,
    currentEngine,
    searchQuery,
    setCurrentEngine,
    performSearch,
    handleKeyDown
  }
}