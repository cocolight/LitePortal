import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { httpClient, LINKS_ENDPOINTS } from '@/api'
import { initialLinkStoreState } from '@/utils/initialStates'
import type {
  LinkBase,
  Link,
  ApiResponse,
  LinkConfigResponse,
  LinkAddRequest,
  LinkUpdateRequest,
  LinkDeleteRequest
} from '@/types'
import type { LinkStoreState } from '@/types'


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
      const response = await httpClient.get<ApiResponse<LinkConfigResponse>>(LINKS_ENDPOINTS.LIST)
      state.value.links = response.data?.links || []
    } catch (err) {
      state.value.error = err instanceof Error ? err.message : '获取链接数据失败'
      console.error('获取链接数据失败:', err)
    } finally {
      state.value.loading = false
    }
  }

  const addLink = async (linkData: LinkBase): Promise<boolean> => {
    const tempId = addLinkToState(linkData)
    state.value.loading = true
    state.value.error = null

    try {
      const requestData: LinkAddRequest = {
        ...linkData
      }
      const response = await httpClient.post<ApiResponse>(LINKS_ENDPOINTS.CREATE, requestData)

      // 后端返回成功状态码表示成功
      if (response.success) {
        return true
      } else {
        state.value.error = response.message || '添加链接失败'
        return false
      }
    } catch (err) {
      removeLinkFromStateById(tempId)
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
      const requestData: LinkUpdateRequest = {
        ...linkData
      }
      const response = await httpClient.put<ApiResponse>(LINKS_ENDPOINTS.UPDATE(linkData.linkId), requestData)

      // 后端返回成功状态码表示成功
      if (response.success) {
        await fetchLinks()
        return true
      } else {
        state.value.error = response.message || '更新链接失败'
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

    const backup = links.value.find(l => l.linkId === linkId)
    removeLinkFromState(linkId)

    state.value.loading = true
    state.value.error = null

    try {
      const requestData: LinkDeleteRequest = {
        linkId
      }

      const response = await httpClient.delete<ApiResponse>(LINKS_ENDPOINTS.DELETE(requestData.linkId))

      // 后端返回成功状态码表示删除成功
      if (response.success) {
        return true
      } else {
        state.value.error = response.message || '删除链接失败'
        return false
      }
    } catch (err) {
      if(backup) restoreLinkToState(backup)
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
    const tempId = -Date.now()
    const newLink: Link = { ...linkData, linkId: tempId } as Link
    state.value.links.unshift(newLink)
    return tempId        // 返回临时 id
  }

  // 从状态中移除链接（用于添加失败时移除）
  const removeLinkFromStateById = (tempId: number): void => {
    const idx = state.value.links.findIndex(l => l.linkId === tempId)
    if (idx > -1) state.value.links.splice(idx, 1)
  }
  // const removeLinkFromStateByIndex = (index: number): void => {
  //   if (index >= 0 && index < state.value.links.length) {
  //     state.value.links.splice(index, 1)
  //   }
  // }

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
    removeLinkFromStateById,
    clearError,
    resetState
  }
})
