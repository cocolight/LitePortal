<template>
  <teleport to="body">
    <div v-if="visible" class="confirm-dialog-overlay visible" @click.self="handleCancel">
      <div class="confirm-dialog">
        <h3>确认删除</h3>
        <p>确定要删除 "{{ itemName }}" 吗？此操作不可撤销。</p>
        <div class="button-container">
          <button class="cancel-btn" @click="handleCancel">取消</button>
          <button class="confirm-btn" @click="handleConfirm">确认删除</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  itemName: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:visible', 'confirm'])

const handleCancel = () => {
  emit('update:visible', false)
}

const handleConfirm = () => {
  emit('update:visible', false)
  emit('confirm')
}

// 监听 visible 变化，添加 ESC 键关闭功能
watch(() => props.visible, (newVal) => {
  if (newVal) {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        handleCancel()
      }
    }
    document.addEventListener('keydown', handleEsc)
    
    // 组件隐藏时移除事件监听
    return () => {
      document.removeEventListener('keydown', handleEsc)
    }
  }
})
</script>

<style scoped>
.confirm-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.confirm-dialog {
  background-color: var(--card, #fff);
  border-radius: 8px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  transform: translateY(20px);
  transition: transform 0.3s ease;
}

.confirm-dialog-overlay.visible {
  opacity: 1;
}

.confirm-dialog-overlay.visible .confirm-dialog {
  transform: translateY(0);
}

h3 {
  margin: 0 0 16px 0;
  color: var(--text, #333);
  font-size: 18px;
  font-weight: 600;
}

p {
  margin: 0 0 24px 0;
  color: var(--text, #333);
  font-size: 16px;
  line-height: 1.5;
  font-weight: 500;
}

.button-container {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-btn {
  padding: 8px 16px;
  border: 1px solid var(--border, #ddd);
  border-radius: 4px;
  background-color: transparent;
  color: var(--text, #333);
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cancel-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.confirm-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background-color: #f44336;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.confirm-btn:hover {
  background-color: #d32f2f;
}
</style>
