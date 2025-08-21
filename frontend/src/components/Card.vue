<template>
  <a
    class="card"
    :class="{ 'add-card': isAddCard }"
    @click="handleClick"
    @contextmenu.prevent="handleContextMenu"
  >
    <img 
      :src="displayIcon" 
      :alt="isAddCard ? '添加' : link.name"
      onerror="this.src='https://api.iconify.design/mdi:web.svg'"
    />
    <div>{{ isAddCard ? '添加' : link.name }}</div>
  </a>
</template>

<script setup>
import { computed, onMounted, nextTick } from 'vue'
import { useLinks } from '../composables/useLinks'

const props = defineProps({
  link: {
    type: Object,
    default: () => ({})
  },
  isAddCard: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['add', 'contextmenu'])

const { openLink } = useLinks()

// 判断是否应该显示文字图标
const isTextIcon = computed(() => {
  if (props.isAddCard) return false
  // 当没有上传图标和在线图标，但有文字图标时，显示文字图标
  return !props.link.uploadIcon && !props.link.icon && !!props.link.textIcon
})

const displayIcon = computed(() => {
  if (props.isAddCard) {
    return 'https://api.iconify.design/mdi:plus.svg'
  }
  
  // 根据优先级显示图标：上传图标 > 文字图标 > 在线图标 > 默认图标
  // 这样确保保存后显示的是用户选择的图标类型
  if (props.link.uploadIcon) {
    return props.link.uploadIcon
  } else if (props.link.textIcon) {
    // 文字图标需要特殊处理，因为我们不能直接返回文字作为img的src
    return 'data:text/plain;charset=utf-8,' + encodeURIComponent(props.link.textIcon)
  } else if (props.link.icon) {
    return props.link.icon
  } else {
    return 'https://api.iconify.design/mdi:web.svg'
  }
})

const handleClick = () => {
  if (props.isAddCard) {
    emit('add')
  } else {
    openLink(props.link)
  }
}

const handleContextMenu = (event) => {
  if (!props.isAddCard) {
    emit('contextmenu', event, props.link)
  }
}

// 处理文字图标的显示
onMounted(() => {
  nextTick(() => {
    if (isTextIcon.value) {
      const cardElement = document.querySelector('.card:nth-child(' + (props.link.id || '1') + ') img')
      if (cardElement) {
        const parent = cardElement.parentNode
        const textIconElement = document.createElement('div')
        textIconElement.className = 'text-icon-display'
        textIconElement.textContent = props.link.textIcon
        parent.replaceChild(textIconElement, cardElement)
      }
    }
  })
})
</script>

<style scoped>
.card {
  cursor: pointer;
}

.add-card {
  background: linear-gradient(145deg, rgba(74, 108, 247, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
  border: 1px dashed var(--accent);
}

.text-icon-display {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent);
  background: linear-gradient(135deg, var(--gradient-1) 0%, var(--gradient-2) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
</style>
