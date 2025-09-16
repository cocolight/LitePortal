<template>
  <div class="icon-preview-section">
    <div class="icon-preview-container">
      <IconPreviewItem
        type="online_icon"
        :selected="currentIconType === IconType.online_icon"
        :icon-url="iconPreviewUrl"
        label="在线图标"
        @click="selectIconType(IconType.online_icon)"
      />

      <IconPreviewItem
        type="text_icon"
        :selected="currentIconType === IconType.text_icon"
        :text="textIconPreview"
        label="文字图标"
        @click="selectIconType(IconType.text_icon)"
      />

      <IconPreviewItem
        type="upload_icon"
        :selected="currentIconType === IconType.upload_icon"
        :icon-url="uploadIconUrl"
        label="定制图标"
        @click="selectIconType(IconType.upload_icon)"
      />
    </div>

    <label>
      <strong>{{ iconLabel }}</strong>
      <IconInput
        v-model="iconValue"
        :placeholder="iconPlaceholder"
        @search="fetchFavicon(formData.int || formData.ext)"
      />
    </label>

    <div class="divider"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IconType } from '@/types'
import IconPreviewItem from './IconPreviewItem.vue'
import IconInput from './IconInput.vue'

const props = defineProps({
  currentIconType: {
    type: String,
    required: true
  },
  iconValue: {
    type: String,
    required: true
  },
  formData: {
    type: Object,
    required: true
  },
  link: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['select-icon-type', 'fetch-favicon'])

const iconLabel = computed(() => {
  switch (props.currentIconType) {
    case IconType.online_icon: return '图标URL'
    case IconType.text_icon: return '图标文字'
    case IconType.upload_icon: return '图标URL'
    default: return '图标URL'
  }
})

const iconPlaceholder = computed(() => {
  switch (props.currentIconType) {
    case IconType.online_icon: return '输入图标URL'
    case IconType.text_icon: return '输入1-2个字符'
    case IconType.upload_icon: return '输入图标URL'
    default: return '输入图标URL'
  }
})

const iconPreviewUrl = computed(() => {
  if (props.currentIconType === IconType.online_icon) {
    return props.iconValue || props.formData.icon || props.link.icon || 'https://api.iconify.design/mdi:web.svg'
  }
  return props.formData.icon || props.link.icon || 'https://api.iconify.design/mdi:web.svg'
})

const textIconPreview = computed(() => {
  if (props.currentIconType === IconType.text_icon) {
    const text = props.iconValue || props.formData.textIcon || props.link.textIcon || props.formData.name
    return text ? text.charAt(0).toUpperCase() : 'A'
  }
  return props.formData.textIcon || props.link.textIcon ?
    (props.formData.textIcon || props.link.textIcon).charAt(0).toUpperCase() :
    props.formData.name ? props.formData.name.charAt(0).toUpperCase() : 'A'
})

const uploadIconUrl = computed(() => {
  return props.currentIconType === 'upload_icon'
    ? (props.iconValue || props.formData.uploadIcon || props.link.uploadIcon || 'https://api.iconify.design/mdi:cart.svg')
    : (props.formData.uploadIcon || props.link.uploadIcon || 'https://api.iconify.design/mdi:cart.svg')
})

const selectIconType = (type: IconType) => {
  emit('select-icon-type', type)
}

const fetchFavicon = (url: string) => {
  emit('fetch-favicon', url)
}
</script>

<style scoped lang="scss">
.icon-preview-section {
  margin-bottom: 1rem;
}

.icon-preview-container {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

label {
  display: flex;
  flex-direction: row;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text);
  gap: 0.5rem;
  margin-top: 1rem;

  strong {
    min-width: 80px;
    text-align: justify;
    text-align-last: justify;
    margin-right: 0.5rem;
  }
}

.divider {
  height: 1px;
  background-color: var(--border);
  margin: 1rem -1.75rem;
  width: calc(100% + 3.5rem);
}
</style>
