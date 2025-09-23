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
  const getLinkById = computed(() => (linkId: string | number) => {
    return state.value.links.find(link => link.linkId === linkId)
  })

  // 根据内部(int)和外部(ext)标识获取链接
  const getLinkByIntExt = computed(() => (int: string, ext: string) => {
    return state.value.links.find(link => link.intUrl === int && link.extUrl === ext)
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

  const deleteLink = async (linkId: string | number): Promise<boolean> => {
    state.value.loading = true
    state.value.error = null

    try {
      const response = await axios.post<ApiError>('/api/config', {
        action: 'delete',
        linkId
      })

      // 后端返回 204 状态码表示删除成功
      if (response.status === 204) {
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

  // 直接从状态中移除链接（用于乐观更新）
  const removeLinkFromState = (linkId: string | number): void => {
    state.value.links = state.value.links.filter(link => link.linkId !== linkId)
  }

  // 恢复链接到状态中（用于删除失败时恢复）
  const restoreLinkToState = (link: Link): void => {
    state.value.links.push(link)
  }

  // 直接将链接添加到状态中（用于乐观更新）
  const addLinkToState = (linkData: LinkBase): number => {
    // 创建一个新链接，使用一个临时的索引作为ID
    const newLink: Link = {
      ...linkData
    }
    // 将新链接添加到列表开头
    state.value.links.unshift(newLink)
    // 返回索引（0），因为新添加的链接在数组开头
    return 0
  }

  // 从状态中移除链接（用于添加失败时移除）
  const removeLinkFromStateByIndex = (index: number): void => {
    if (index >= 0 && index < state.value.links.length) {
      state.value.links.splice(index, 1)
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
    removeLinkFromState,
    restoreLinkToState,
    addLinkToState,
    removeLinkFromStateByIndex,
    clearError,
    resetState
  }
})
