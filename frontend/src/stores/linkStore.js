import { defineStore } from 'pinia'
import axios from 'axios'

// Link 对象的结构定义
// {
//   id?: string,
//   name: string,
//   icon: string,
//   textIcon?: string,
//   uploadIcon?: string,
//   int: string,
//   ext: string,
//   desc?: string
// }

export const useLinkStore = defineStore('links', {
  state: () => ({
    links: [],
    loading: false,
    error: null
  }),
  
  getters: {
    getLinks: (state) => state.links,
    isLoading: (state) => state.loading,
    getError: (state) => state.error
  },
  
  actions: {
    async fetchLinks() {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.get('/api/config')
        this.links = response.data.links || []
      } catch (error) {
        this.error = error instanceof Error ? error.message : '获取链接数据失败'
        console.error('获取链接数据失败:', error)
      } finally {
        this.loading = false
      }
    },
    
    async addLink(link) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post('/api/config', {
          action: 'add',
          ...link
        })
        
        // 后端返回 204 状态码表示成功
        if (response.status === 204) {
          await this.fetchLinks()
          return true
        } else {
          this.error = response.data?.message || response.data?.error || '添加链接失败'
          return false
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : '添加链接失败'
        console.error('添加链接失败:', error)
        return false
      } finally {
        this.loading = false
      }
    },
    
    async updateLink(link) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post('/api/config', link)
        
        // 后端返回 204 状态码表示成功
        if (response.status === 204) {
          await this.fetchLinks()
          return true
        } else {
          this.error = response.data?.message || response.data?.error || '更新链接失败'
          return false
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : '更新链接失败'
        console.error('更新链接失败:', error)
        return false
      } finally {
        this.loading = false
      }
    },
    
    async deleteLink(id) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post('/api/config', {
          action: 'delete',
          id
        })
        
        if (response.data.success) {
          await this.fetchLinks()
          return true
        } else {
          this.error = response.data.message || '删除链接失败'
          return false
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : '删除链接失败'
        console.error('删除链接失败:', error)
        return false
      } finally {
        this.loading = false
      }
    }
  }
})
