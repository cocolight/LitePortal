import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'

/**
 * 简化的HTTP客户端
 */
class HttpClient {
  private instance: AxiosInstance

  constructor(baseURL: string = import.meta.env.VITE_API_BASE_URL || '/api') {
    this.instance = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // 请求拦截器 - 添加token
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // 响应拦截器 - 统一处理错误
    this.instance.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response?.status === 401) {
          console.error('未授权，请重新登录')
        }
        return Promise.reject(error)
      }
    )
  }

  // 基础HTTP方法
  public get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.get(url, config)
  }

  public post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.post(url, data, config)
  }

  public put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.put(url, data, config)
  }

  public delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.delete(url, config)
  }
}

// 创建全局实例
export const httpClient = new HttpClient()
