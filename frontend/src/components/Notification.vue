<template>
  <teleport to="body">
    <div 
      v-if="visible" 
      class="notification"
      :class="`notification-${type}`"
      :style="{ top: '20px', right: '20px' }"
    >
      {{ message }}
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { NotificationType } from '../types'

const props = defineProps({
  message: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'error', 'info'].includes(value)
  },
  duration: {
    type: Number,
    default: 3000
  }
})

const visible = ref(false)

// 显示通知
const show = () => {
  visible.value = true
  
  // 自动关闭
  setTimeout(() => {
    hide()
  }, props.duration)
}

// 隐藏通知
const hide = () => {
  visible.value = false
}

// 监听消息变化，自动显示
watch(() => props.message, (newVal) => {
  if (newVal) {
    show()
  }
}, { immediate: true })

// 暴露方法给父组件
defineExpose({
  show,
  hide
})
</script>

<style scoped>
.notification {
  position: fixed;
  padding: 12px 20px;
  border-radius: 4px;
  color: white;
  font-weight: 500;
  z-index: 10000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  opacity: 0;
  transform: translateY(-20px);
  transition: opacity 0.3s, transform 0.3s;
  max-width: 300px;
}

.notification-success {
  background-color: #4caf50;
}

.notification-error {
  background-color: #f44336;
}

.notification-info {
  background-color: #2196f3;
}

.notification.visible {
  opacity: 1;
  transform: translateY(0);
}
</style>
