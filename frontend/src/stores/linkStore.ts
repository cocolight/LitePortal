import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import type { Link } from '../types'

export const useLinkStore = defineStore('links', () => {
  // 状态
  const links = ref<Link[]>([])
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  // Getters
  const getLinks = () => links.value
  const isLoading = () => loading.value
  const getError = () => error.value

  // Actions
  const fetchLinks = async (): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const response = await axios.get<{ links: Link[] }>('/api/config')
      links.value = response.data.links || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取链接数据失败'
      console.error('获取链接数据失败:', err)
    } finally {
      loading.value = false
    }
  }

  const addLink = async (link: Omit<Link, 'id'>): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const response = await axios.post('/api/config', {
        action: 'add',
        ...link
      })

      // 后端返回 204 状态码表示成功
      if (response.status === 204) {
        await fetchLinks()
        return true
      } else {
        error.value = response.data?.message || response.data?.error || '添加链接失败'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '添加链接失败'
      console.error('添加链接失败:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  const updateLink = async (link: Link): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const response = await axios.post('/api/config', link)

      // 后端返回 204 状态码表示成功
      if (response.status === 204) {
        await fetchLinks()
        return true
      } else {
        error.value = response.data?.message || response.data?.error || '更新链接失败'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新链接失败'
      console.error('更新链接失败:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  const deleteLink = async (id: string | number): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const response = await axios.post('/api/config', {
        action: 'delete',
        id
      })

      // 后端返回 204 状态码表示删除成功
      if (response.status === 204) {
        await fetchLinks()
        return true
      } else {
        error.value = response.data?.message || response.data?.error || '删除链接失败'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除链接失败'
      console.error('删除链接失败:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    links,
    loading,
    error,
    getLinks,
    isLoading,
    getError,
    fetchLinks,
    addLink,
    updateLink,
    deleteLink
  }
})
