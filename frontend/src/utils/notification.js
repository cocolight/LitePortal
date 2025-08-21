// 简化的通知实现
import { createApp } from 'vue'

// 创建通知组件
const NotificationComponent = {
  props: ['message', 'type'],
  data() {
    return {
      visible: false,
      internalMessage: this.message,
      internalType: this.type
    }
  },
  watch: {
    message(newVal) {
      this.internalMessage = newVal
    },
    type(newVal) {
      this.internalType = newVal
    }
  },
  methods: {
    show() {
      this.visible = true
      setTimeout(() => {
        this.visible = false
      }, 3000)
    },
    updateMessage(message) {
      this.internalMessage = message
    },
    updateType(type) {
      this.internalType = type
    }
  },
  template: `
    <div class="notification" :class="[internalType, { visible }]" v-if="visible">
      {{ internalMessage }}
    </div>
  `
}

// 创建通知实例
let notificationInstance = null

// 创建通知容器
const createNotificationContainer = () => {
  const container = document.createElement('div')
  container.id = 'notification-container'
  document.body.appendChild(container)
  return container
}

// 获取通知实例
const getNotificationInstance = () => {
  if (!notificationInstance) {
    const container = createNotificationContainer()
    const app = createApp(NotificationComponent, {
      message: '',
      type: 'info'
    })

    notificationInstance = app.mount(container)
  }

  return notificationInstance
}

// 显示通知
export const showNotification = (message, type = 'info') => {
  const instance = getNotificationInstance()

  // 更新属性
  instance.updateMessage(message)
  instance.updateType(type)

  // 显示通知
  instance.show()
}