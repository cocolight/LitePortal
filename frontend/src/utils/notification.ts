// 多通知同时显示的实现
import { createApp, ref, onMounted, nextTick } from 'vue'
import type { NotificationType } from '../types'

// 通知接口定义
interface NotificationInstance {
  id: number
  message: string
  type: NotificationType
  visible: boolean
  app: any
  element: HTMLElement
}

// 通知组件
const NotificationComponent = {
  props: ['message', 'type', 'id', 'onClose'],
  setup(props: any, { emit }: any) {
    const visible = ref(false)

    onMounted(() => {
      // 组件挂载后显示，使用 nextTick 确保 DOM 已更新
      nextTick(() => {
        visible.value = true

        // 自动关闭
        setTimeout(() => {
          visible.value = false

          // 动画结束后移除通知
          setTimeout(() => {
            emit('close', props.id)
            // 调用传入的回调函数
            if (props.onClose) {
              props.onClose(props.id)
            }
          }, 300)
        }, 3000)
      })
    })

    return {
      visible
    }
  },
  template: `
    <div class="notification" :class="[type, { visible }]" :data-id="id">
      {{ message }}
    </div>
  `
}

// 通知管理器
const notificationManager = {
  notifications: [] as NotificationInstance[],
  nextId: 1,
  container: null as HTMLElement | null,

  // 获取或创建通知容器
  getContainer(): HTMLElement {
    // 检查是否已存在通知容器
    this.container = document.getElementById('notification-container')

    // 如果不存在，则创建一个新的
    if (!this.container) {
      this.container = document.createElement('div')
      this.container.id = 'notification-container'
      document.body.appendChild(this.container)
    }

    return this.container
  },

  // 移除通知
  removeNotification(id: number) {
    const index = this.notifications.findIndex(n => n.id === id)
    if (index !== -1) {
      const notification = this.notifications[index]

      // 卸载 Vue 应用
      if (notification.app) {
        notification.app.unmount()
      }

      // 从 DOM 中移除元素
      if (notification.element && notification.element.parentNode) {
        notification.element.parentNode.removeChild(notification.element)
      }

      // 从数组中移除
      this.notifications.splice(index, 1)
    }
  },

  // 创建并显示通知
  show(message: string, type: NotificationType = 'info'): number {
    const id = this.nextId++
    const container = this.getContainer()

    // 创建通知元素
    const element = document.createElement('div')
    container.appendChild(element)

    // 创建 Vue 应用
    const app = createApp(NotificationComponent, {
      message,
      type,
      id,
      onClose: (closeId: number) => {
        this.removeNotification(closeId)
      }
    })

    // 挂载应用
    app.mount(element)

    // 保存通知实例
    const notification: NotificationInstance = {
      id,
      message,
      type,
      visible: true,
      app,
      element
    }

    this.notifications.push(notification)

    return id
  },

  // 清除所有通知
  clearAll() {
    // 复制数组，避免在迭代时修改原数组
    const notifications = [...this.notifications]
    notifications.forEach(notification => {
      this.removeNotification(notification.id)
    })
  }
}

// 显示通知
export const showNotification = (message: string, type: NotificationType = 'info'): number => {
  return notificationManager.show(message, type)
}

// 移除特定通知
export const removeNotification = (id: number): void => {
  notificationManager.removeNotification(id)
}

// 清除所有通知
export const clearAllNotifications = (): void => {
  notificationManager.clearAll()
}
