<template>
  <teleport to="body">
    <div
      v-if="visible"
      class="ctx-menu"
      :style="{ left: `${position.x}px`, top: `${position.y}px` }"
    >
      <div class="ctx-menu-item" data-action="edit" @click="handleEdit">
        <span class="ctx-menu-icon">✏️</span>
        <span class="ctx-menu-text">编辑</span>
      </div>
      <div class="ctx-menu-item" data-action="delete" @click="handleDelete">
        <span class="ctx-menu-icon">🗑️</span>
        <span class="ctx-menu-text">删除</span>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { watch, onUnmounted } from 'vue'
// import { useLinkStore } from '../stores/linkStore'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 }),
  },
  link: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:visible', 'edit', 'delete', 'refresh'])

// const linkStore = useLinkStore()

// 点击其他地方关闭菜单
const handleClickOutside = () => {
  if (props.visible) {
    emit('update:visible', false)
  }
}

// 监听 visible 变化，添加/移除点击事件监听
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      document.addEventListener('click', handleClickOutside)
    } else {
      document.removeEventListener('click', handleClickOutside)
    }
  },
)

// 组件卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const handleEdit = () => {
  emit('update:visible', false)
  emit('edit', props.link)
}

const handleDelete = async () => {
  emit('update:visible', false)
  emit('delete', props.link)
}
</script>

<style scoped>
.ctx-menu {
  position: fixed;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  z-index: 9999;
  min-width: 160px;
  animation: contextMenuFadeIn 0.2s ease-out;
}

.ctx-menu-item {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  color: var(--text);
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.ctx-menu-item:hover {
  background-color: var(--hover, #f5f5f5);
}

.ctx-menu-item:first-child {
  border-bottom: 1px solid var(--border, #e0e0e0);
}

.ctx-menu-icon {
  margin-right: 12px;
  font-size: 16px;
}

.ctx-menu-text {
  font-weight: 500;
}

@keyframes contextMenuFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
