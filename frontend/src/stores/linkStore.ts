import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { initialLinkStoreState } from '@/utils/initialStates'
import type { LinkBase, Link } from '@/types'
import type { LinkStoreState, ApiError } from '@/types'


export const useLinkStore = defineStore('linkStore', () => {
  // =====状态 (State)
  const state = ref<LinkStoreState>(initialLinkStoreState())

  // =====计算属性 (Getters)
  const links = computed(() => state.value.links)
  const loading = computed(() => state.value.loading)
  const error = computed(() => state.value.error)

  // 获取链接总数
  const linkCount = computed(() => state.value.links.length)

  // 根据ID获取链接
  const getLinkById = computed(() => (id: string | number) => {
    return state.value.links.find(link => link.id === id)
  })

  // 根据内部(int)和外部(ext)标识获取链接
  const getLinkByIntExt = computed(() => (int: string, ext: string) => {
    return state.value.links.find(link => link.int === int && link.ext === ext)
  })

  // 获取所有图标类型
  const getAllIconTypes = computed(() => {
    const iconTypes = new Set<string>()
    state.value.links.forEach(link => {
      if (link.iconType) {
        iconTypes.add(link.iconType)
      }
    })
    return Array.from(iconTypes)
  })

  // =====动作 (Actions)
  const fetchLinks = async (): Promise<void> => {
    state.value.loading = true
    state.value.error = null

    try {
      const response = await axios.get<{ links: Link[] }>('/api/config')
      state.value.links = response.data.links || []
    } catch (err) {
      state.value.error = err instanceof Error ? err.message : '获取链接数据失败'
      console.error('获取链接数据失败:', err)
    } finally {
      state.value.loading = false
    }
  }

  const addLink = async (linkData: LinkBase): Promise<boolean> => {
    state.value.loading = true
    state.value.error = null

    try {
      const response = await axios.post('/api/config', {
        action: 'add',
        ...linkData
      })

      // 后端返回 204 状态码表示成功
      if (response.status === 204) {
        await fetchLinks()
        return true
      } else {
        state.value.error = response.data?.message || response.data?.error || '添加链接失败'
        return false
      }
    } catch (err) {
      state.value.error = err instanceof Error ? err.message : '添加链接失败'
      console.error('添加链接失败:', err)
      return false
    } finally {
      state.value.loading = false
    }
  }

  const updateLink = async (linkData: Link): Promise<boolean> => {
    state.value.loading = true
    state.value.error = null

    try {
      const response = await axios.post<ApiError>('/api/config', {
        action: 'update',
        ...linkData
      })

      // 后端返回 204 状态码表示成功
      if (response.status === 204) {
        await fetchLinks()
        return true
      } else {
        state.value.error = response.data?.message || response.data?.error || '更新链接失败'
        return false
      }
    } catch (err) {
      state.value.error = err instanceof Error ? err.message : '更新链接失败'
      console.error('更新链接失败:', err)
      return false
    } finally {
      state.value.loading = false
    }
  }

  const deleteLink = async (id: string | number): Promise<boolean> => {
    state.value.loading = true
    state.value.error = null

    try {
      const response = await axios.post<ApiError>('/api/config', {
        action: 'delete',
        id
      })

      // 后端返回 204 状态码表示删除成功
      if (response.status === 204) {
        await fetchLinks()
        return true
      } else {
        state.value.error = response.data?.message || response.data?.error || '删除链接失败'
        return false
      }
    } catch (err) {
      state.value.error = err instanceof Error ? err.message : '删除链接失败'
      console.error('删除链接失败:', err)
      return false
    } finally {
      state.value.loading = false
    }
  }

  // 清除错误
  const clearError = (): void => {
    state.value.error = null
  }

  // 重置状态
  const resetState = (): void => {
    state.value = {
      links: [],
      loading: false,
      error: null
    }
  }

  // 返回状态、计算属性和方法
  return {
    // 状态
    state,

    // 计算属性
    links,
    loading,
    error,
    linkCount,
    getLinkById,
    getLinkByIntExt,
    getAllIconTypes,

    // 方法
    fetchLinks,
    addLink,
    updateLink,
    deleteLink,
    clearError,
    resetState
  }
})
