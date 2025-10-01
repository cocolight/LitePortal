import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { httpClient, LINKS_ENDPOINTS } from '@/api'
import { initialLinkStoreState } from '@/utils/initialStates'
import type {
  LinkBase,
  Link,
  ApiResult,
  LinkResponse,
  LinkAddRequest,
  LinkUpdateRequest,
  LinkDeleteRequest,
  LinkStoreState
} from '@/types'
import { isApiSuccess} from '@/types'


export const useLinkStore = defineStore('linkStore', () => {
  // =====状态 (State)
  const state = ref<LinkStoreState>(initialLinkStoreState())

  // =====计算属性 (Getters)
  const links = computed(() => state.value.links)
  const loading = computed(() => state.value.loading)
  const error = computed(() => state.value.error)
  const message = computed(() => state.value.message)

  // 获取链接总数
  const linkCount = computed(() => state.value.links.length)

  // 根据ID获取链接
  const getLinkById = computed(() => (linkId: string) => {
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
      const response = await httpClient.get<ApiResult<LinkResponse>>(LINKS_ENDPOINTS.LIST)
      const result: ApiResult<LinkResponse> = response.data

      if (isApiSuccess(result)) {
        state.value.links = result.data?.links ?? []
      }else{
        // ApiError
        state.value.message = result.message || '获取链接数据失败'
        console.warn('[Business Error]', result.error)
      }

    } catch (err) {
      // 网络 / 非 2xx
      state.value.error = err instanceof Error ? err.message : '获取链接数据失败'
      console.error('[Network/Http Error]', err)
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
      const response = await httpClient.post<ApiResult<LinkResponse>>(LINKS_ENDPOINTS.CREATE, requestData)
      const result: ApiResult<LinkResponse> = response.data

      // 后端返回成功状态码表示成功
      if (isApiSuccess(result)) {
        return true
      } else {
        // ApiError
        state.value.message = result.message || '添加链接失败'
        console.warn('[Business Error]', result.error)
        return false
      }
    } catch (err) {
      removeLinkFromStateById(tempId)
      state.value.error = err instanceof Error ? err.message : '添加链接失败'
      console.error('[Network/Http Error]', err)
      return false
    } finally {
      state.value.loading = false
    }
  }

  const updateLink = async (linkData: Link): Promise<boolean> => {
    state.value.loading = true
    state.value.error = null

    const backup = updateLinkInState(linkData)

    try {
      const {linkId, ...rest} = linkData
      const id = String(linkId)
      const requestData: LinkUpdateRequest = rest

      const response = await httpClient.put<ApiResult<LinkResponse>>(LINKS_ENDPOINTS.UPDATE(id), requestData)
      const result: ApiResult<LinkResponse> = response.data

      /**
       * ! 返回判断有误，返回200，但是消息提示更新错误
       * TODO 修改返回判断逻辑
       */
      // 后端返回成功状态码表示成功
      if (isApiSuccess(result)) {
        // await fetchLinks()
        return true
      } else {
        // ApiError
        if(backup) restoreLinkInState(backup)
        state.value.message = result.message || '更新链接失败'
        console.warn('[Business Error]', result.error)
        return false
      }
    } catch (err) {
      if(backup) restoreLinkInState(backup)
      state.value.error = err instanceof Error ? err.message : '更新链接失败'
      console.error('[Network/Http Error]', err)
      return false
    } finally {
      state.value.loading = false
    }
  }

  const deleteLink = async (linkId: string): Promise<boolean> => {

    const backup = links.value.find(l => l.linkId === linkId)
    removeLinkFromState(linkId)

    state.value.loading = true
    state.value.error = null

    try {
      const requestData: LinkDeleteRequest = { linkId }

      const response = await httpClient.delete<ApiResult<LinkResponse>>(LINKS_ENDPOINTS.DELETE(requestData.linkId))
      const result: ApiResult<LinkResponse> = response.data

      // 后端返回成功状态码表示删除成功
      if (isApiSuccess(result)) {
        return true
      } else {
        state.value.message = result.message || '删除链接失败'
        console.warn('[Business Error]', result.error)
        return false
      }
    } catch (err) {
      if(backup) restoreLinkToState(backup)
      state.value.error = err instanceof Error ? err.message : '删除链接失败'
      console.error('[Network/Http Error]', err)
      return false
    } finally {
      state.value.loading = false
    }
  }

  // 直接从状态中移除链接（用于乐观更新）
  const removeLinkFromState = (linkId: string): void => {
    state.value.links = state.value.links.filter(link => link.linkId !== linkId)
  }

  // 恢复链接到状态中（用于删除失败时恢复）
  const restoreLinkToState = (link: Link): void => {
    state.value.links.push(link)
  }

  // 直接将链接添加到状态中（用于乐观更新）
  const addLinkToState = (linkData: LinkBase): string => {
    const tempId = -Date.now()
    const newLink: Link = { ...linkData, linkId: tempId } as Link
    state.value.links.unshift(newLink)
    return String(tempId)        // 返回临时 id
  }

  // 从状态中移除链接（用于添加失败时移除）
  const removeLinkFromStateById = (tempId: string): void => {
    const idx = state.value.links.findIndex(l => l.linkId === tempId)
    if (idx > -1) state.value.links.splice(idx, 1)
  }

  // 更新状态中的链接（用于乐观更新）
  const updateLinkInState = (linkData: Link): Link | null => {
    const originalLink = links.value.find(link => link.linkId === linkData.linkId)
    if (originalLink) {
      const index = state.value.links.findIndex(link => link.linkId === linkData.linkId)
      if (index !== -1) {
        // 备份原始链接
        const backup = { ...originalLink }
        // 更新链接
        // state.value.links[index] = { ...linkData }
        Object.assign(state.value.links[index], linkData)
        return backup
      }
    }
    return null
  }

  // 恢复状态中的链接（用于更新失败时恢复）
  const restoreLinkInState = (backup: Link): void => {
    const index = state.value.links.findIndex(link => link.linkId === backup.linkId)
    if (index !== -1) {
      state.value.links[index] = backup
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
      error: null,
      message: null,
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
    message,
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
