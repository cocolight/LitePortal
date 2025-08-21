import { ref } from 'vue'

export function useSearch() {
  // 搜索引擎配置
  const engines = ref([
    { name: 'Google', url: 'https://www.google.com/search?q=' },
    { name: '百度', url: 'https://www.baidu.com/s?wd=' },
    { name: '必应', url: 'https://cn.bing.com/search?q=' },
    { name: 'Duck', url: 'https://duckduckgo.com/?q=' }
  ])
  
  const currentEngine = ref(engines.value[0])
  const searchQuery = ref('')
  
  const setCurrentEngine = (engine) => {
    currentEngine.value = engine
  }
  
  const performSearch = () => {
    if (searchQuery.value.trim()) {
      const url = currentEngine.value.url + encodeURIComponent(searchQuery.value.trim())
      window.open(url, '_blank')
      searchQuery.value = ''
    }
  }
  
  const handleKeyDown = (e) => {
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
