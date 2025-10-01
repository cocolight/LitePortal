<template>
  <div class="icon-preview-container">
    <!-- 在线图标 -->
    <div class="preview-item online-icon-wrapper" @click="selectIconType(IconType.onlineIcon)">
      <div class="preview-icon online-icon" :class="{ selected: props.iconType === IconType.onlineIcon }">
        <img :src="iconPreviewUrl" alt="在线图标" onerror="this.src=DEFAULT_ICONS.online" />
      </div>
      <div class="preview-label">在线图标</div>
    </div>
    <!-- 文本图标 -->
    <div class="preview-item text-icon-wrapper" @click="selectIconType(IconType.textIcon)">
      <div class="preview-icon text-icon" :class="{ selected: props.iconType === IconType.textIcon }">
        {{ textIconPreview }}
      </div>
      <div class="preview-label">文字图标</div>
    </div>
    <!-- 图标库图标 -->
    <div class="preview-item" @click="selectIconType(IconType.paidIcon)">
      <div class="preview-icon paid-icon" :class="{ selected: props.iconType === IconType.paidIcon }">
        <img :src=paidIconPreviewUrl alt="定制图标" onerror="this.src=DEFAULT_ICONS.paid" />
      </div>
      <div class="preview-label">定制图标</div>
    </div>
  </div>
  <!-- 图标文字 -->
  <label>
    <strong>{{ iconLabel }}</strong>
    <!-- 原生搜索框 -->
    <div class="input-wrapper">
      <input v-model="iconValue" :placeholder="iconPlaceholder">
      <button class="search-btn" type="button" @click="triggerFetch">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 5L20.5 19l-5-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
      </button>
    </div>
  </label>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import type { IcomPreviewProps } from './types'
  import { IconType } from '@/types'

  const DEFAULT_ICONS = {
    online: 'https://api.iconify.design/mdi:web.svg',
    paid: 'https://api.iconify.design/mdi:cart.svg'
  }

  const props = defineProps<IcomPreviewProps>()

  // 图标框值
  const iconValue = ref('')

  // 定义事件
  const emit = defineEmits<{
    // 双向绑定事件
    'update:iconType': [value: IconType]
    'update:onlineIcon': [value: string]
    'update:textIcon': [value: string]
    'update:paidIcon': [value: string]
    // 获取图标
    'fetchFavicon': [iconType: IconType, iconValue: string]
  }>()

  const iconPreviewUrl = computed(() => {
    return props.onlineIcon || DEFAULT_ICONS.online
  })

  const textIconPreview = computed(() => {
    const text = props.textIcon || 'A'
    return text.charAt(0).toUpperCase()
  })

  const paidIconPreviewUrl = computed(() => {
    return props.paidIcon || DEFAULT_ICONS.paid
  })

  // 图标输入框名称
  const iconLabel = computed(() => {
    switch (props.iconType) {
      case IconType.onlineIcon: return '图标URL'
      case IconType.textIcon: return '图标文字'
      case IconType.paidIcon: return '图标ID'
      default: return '图标URL'
    }
  })
  // 图标输入框提示词
  const iconPlaceholder = computed(() => {
    switch (props.iconType) {
      case IconType.onlineIcon: return '输入图标URL'
      case IconType.textIcon: return '输入1-2个字符'
      case IconType.paidIcon: return '输入图标ID'
      default: return '输入图标URL'
    }
  })

  // 选择图标类型
  const selectIconType = (newType: IconType) => {
    // 保存当前类型的值, 防止切换时丢失
    switch (props.iconType) {
      case IconType.onlineIcon:
        if (iconValue.value) {
          emit('update:onlineIcon', iconValue.value )
        }
        break;
      case IconType.textIcon:
        if (iconValue.value) {
          emit('update:textIcon', iconValue.value )
        }
        break;
      case IconType.paidIcon:
        if (iconValue.value) {
          emit('update:paidIcon', iconValue.value )
        }
        break;
    }

    // 更新当前类型
    emit('update:iconType', newType)

    // 加载新类型的值
    switch (newType) {
      case IconType.onlineIcon:
        iconValue.value = props.onlineIcon || '';
        break;
      case IconType.textIcon:
        iconValue.value = props.textIcon || '';
        break;
      case IconType.paidIcon:
        iconValue.value = props.paidIcon || '';
        break;
    }
  };

  // 手动获取图标
  const triggerFetch = () => {
    emit('fetchFavicon', props.iconType || IconType.onlineIcon, iconValue.value)
  }

  // 监听图标类型和值的变化
  watch([() => props.onlineIcon, () => props.textIcon, () => props.uploadIcon, () => props.paidIcon], ([newOnlineIcon, newTextIcon, newUploadIcon, newPaidIcon]) => {
    switch (props.iconType) {
      case IconType.onlineIcon:
        iconValue.value = newOnlineIcon || '';
        break;
      case IconType.textIcon:
        iconValue.value = newTextIcon || '';
        break;
      case IconType.uploadIcon:
        iconValue.value = newUploadIcon || '';
        break;
      case IconType.paidIcon:
        iconValue.value = newPaidIcon || '';
        break;
      default:
        iconValue.value = '';
    }
  }, { immediate: true })






</script>

<style scoped lang="scss">
/* ========== 公共变量 ========== */
$input-height: 32px;
$input-padding-x: 0.625rem;
$input-border-radius: 4px;
$input-border: 1px solid var(--border);
$input-bg: #fff;
$input-focus-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);

.icon-preview-container {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

.preview-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.preview-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-align: center;
}

.preview-icon {
  width: 60px;
  height: 60px;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  border: 1px solid var(--border);
  overflow: hidden;

  &.selected {
    box-shadow: 0 0 0 2px var(--accent);
  }

  img {
    width: 36px;
    height: 36px;
    object-fit: contain;
  }
}

.online-icon-wrapper,
.text-icon-wrapper {
  position: relative;
  cursor: pointer;
}

.text-icon {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--gradient-1) 0%, var(--gradient-2) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

label {
  display: flex;
  flex-direction: row;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text);
  gap: 0.5rem;

  strong {
    min-width: 80px;
    text-align: justify;
    text-align-last: justify;
    margin-right: 0.5rem;
  }
}

.input-wrapper {
  display: flex;
  flex: 1;
  align-items: stretch;
  border: $input-border;
  border-radius: $input-border-radius;
  background: $input-bg;
  height: $input-height;
  min-width: 0;
  transition: var(--transition);

  &:focus-within {
    border-color: var(--accent);
    box-shadow: $input-focus-shadow;
  }

  input {
    border: none;
    border-right: none;
    outline: none;
    height: 100%;
    padding: 0 $input-padding-x;
    border-radius: 4px 0 0 4px !important;
    flex: 1;
    min-width: 0;
    width: 100%;
    font-size: 14px;
    background: transparent;
  }

  .search-btn {
    border: none;
    // border-left: none;
    border-left: 1px solid var(--border);
    background: #f5f7fa;
    cursor: pointer;
    padding: 0 10px;
    display: flex;
    align-items: center;
    height: 100%;
    border-radius: 0 $input-border-radius $input-border-radius 0;
    margin-left: 0;
    transition: background 0.2s;

    &:hover {
      background: #e6e8eb;
    }

    svg {
      fill: #606266;
    }
  }
}
</style>