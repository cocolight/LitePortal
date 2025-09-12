<template>
  <a class="card" :class="{ 'add-card': isAddCard }" :data-id="link?.id" @click="handleClick"
    @contextmenu.prevent="handleContextMenu">
    <img :src="displayIcon" :alt="isAddCard ? '添加' : link?.name"
      onerror="this.src='https://api.iconify.design/mdi:web.svg'" />
    <div>{{ isAddCard ? '添加' : link?.name }}</div>
  </a>
</template>

<script setup lang="ts">
import { computed, onMounted, nextTick } from 'vue'
import { useLinks } from '@/composables/useLinks'
import type { CardProps } from '@/types'

const props = defineProps<CardProps>()

const emit = defineEmits<{
  (e: 'add'): void
  (e: 'contextmenu', event: MouseEvent, link: any): void
}>()

const { openLink } = useLinks()


const displayIcon = computed(() => {
  if (props.isAddCard) {
    return 'https://api.iconify.design/mdi:plus.svg'
  }

  // 严格根据iconType字段显示对应的图标
  const iconType = props.link?.iconType || 'online_icon'
  // console.log('iconType:', iconType)

  if (iconType === 'upload_icon') {
    return props.link?.uploadIcon || 'https://api.iconify.design/mdi:upload.svg'
  } else if (iconType === 'text_icon') {
    // 文字图标使用data URL格式显示
    const text = props.link?.textIcon || props.link?.name || 'A'
    return 'data:text/plain;charset=utf-8,' + encodeURIComponent(text.charAt(0).toUpperCase())
  } else if (iconType === 'online_icon') {
    return props.link?.icon || 'https://api.iconify.design/mdi:web.svg'
  } else {
    // 默认情况，返回在线图标
    return props.link?.icon || 'https://api.iconify.design/mdi:web.svg'
  }
})

const handleClick = () => {
  if (props.isAddCard) {
    emit('add')
  } else if (props.link && props.link.id !== undefined) {
    openLink(props.link)
  }
}

const handleContextMenu = (event: MouseEvent) => {
  if (!props.isAddCard && props.link && props.link.id !== undefined) {
    emit('contextmenu', event, props.link)
  }
}

// 文字图标现在通过displayIcon计算属性处理，不再需要DOM操作
onMounted(() => {
  nextTick(() => {
    // 可以在这里添加其他需要在组件挂载后执行的逻辑
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
</style>
