<template>
  <div class="icon-preview-container">
    <!-- 在线图标 -->
    <div class="preview-item online-icon-wrapper" @click="selectIconType(IconType.online_icon)">
      <div class="preview-icon online-icon" :class="{ selected: props.iconType === IconType.online_icon }">
        <img :src="iconPreviewUrl" alt="在线图标" onerror="this.src=DEFAULT_ICONS.online" />
      </div>
      <div class="preview-label">在线图标</div>
    </div>
    <!-- 文本图标 -->
    <div class="preview-item text-icon-wrapper" @click="selectIconType(IconType.text_icon)">
      <div class="preview-icon text-icon" :class="{ selected: props.iconType === IconType.text_icon }">
        {{ textIconPreview }}
      </div>
      <div class="preview-label">文字图标</div>
    </div>
    <!-- 图标库图标 -->
    <div class="preview-item" @click="selectIconType(IconType.paid_icon)">
      <div class="preview-icon upload-icon" :class="{ selected: props.iconType === IconType.paid_icon }">
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
  import { computed, ref } from 'vue'
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
    if (props.iconType === IconType.online_icon) {
      return props.onlineIcon || DEFAULT_ICONS.online
    }
    return props.onlineIcon || DEFAULT_ICONS.online
  })

  const textIconPreview = computed(() => {
    if (props.iconType === IconType.text_icon) {
      const text = props.textIcon
      return text ? text.charAt(0).toUpperCase() : 'A'
    }
    return props.textIcon || 'A'
  })

  const paidIconPreviewUrl = computed(() => {
    return props.uploadIcon || DEFAULT_ICONS.paid
  })

  // 图标输入框名称
  const iconLabel = computed(() => {
    switch (props.iconType) {
      case IconType.online_icon: return '图标URL'
      case IconType.text_icon: return '图标文字'
      case IconType.paid_icon: return '图标ID'
      default: return '图标URL'
    }
  })
  // 图标输入框提示词
  const iconPlaceholder = computed(() => {
    switch (props.iconType) {
      case IconType.online_icon: return '输入图标URL'
      case IconType.text_icon: return '输入1-2个字符'
      case IconType.paid_icon: return '输入图标ID'
      default: return '输入图标URL'
    }
  })

  // 选择图标类型
  const selectIconType = (newType: IconType) => {
    // 保存当前类型的值, 防止切换时丢失
    switch (props.iconType) {
      case IconType.online_icon:
        if (iconValue.value) {
          emit('update:onlineIcon', iconValue.value )
        }
        break;
      case IconType.text_icon:
        if (iconValue.value) {
          emit('update:textIcon', iconValue.value )
        }
        break;
      case IconType.paid_icon:
        if (iconValue.value) {
          emit('update:paidIcon', iconValue.value )
        }
        break;
    }

    // 更新当前类型
    emit('update:iconType', newType)

    // 加载新类型的值
    switch (newType) {
      case IconType.online_icon:
        iconValue.value = props.onlineIcon || '';
        break;
      case IconType.text_icon:
        iconValue.value = props.textIcon || '';
        break;
      case IconType.paid_icon:
        iconValue.value = props.paidIcon || '';
        break;
    }
  };

  // 手动获取图标
  const triggerFetch = () => {
    emit('fetchFavicon', props.iconType || IconType.online_icon, iconValue.value)
  }



</script>

<style scoped lang="scss">
  /* ========== 公共变量 ========== */
  $input-height: 32px;
  $input-padding-x: 0.625rem;
  $input-border-radius: 4px;
  $input-border: 1px solid var(--border);
  $input-bg: #fff;
  $input-focus-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);

  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    animation: fadeIn 0.2s ease-out;
  }

  .modal {
    background: var(--card);
    padding: 1.75rem;
    border-radius: var(--radius);
    width: 480px;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--border);
    animation: slideUp 0.3s ease-out;

    h3 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
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

      /* 普通输入框 -> 统一高度 */
      input {
        flex: 1;
        height: $input-height;
        padding: 0 $input-padding-x;
        border-radius: $input-border-radius;
        border: $input-border;
        background: $input-bg;
        color: var(--text);
        transition: var(--transition);
        text-align: left;

        &:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: $input-focus-shadow;
        }
      }
    }
  }

  /* ========== 一体式搜索框（与普通输入框同高） ========== */
  .input-wrapper {
    display: flex;
    flex: 1;
    align-items: stretch;
    border: $input-border;
    border-radius: $input-border-radius;
    // overflow: hidden;
    background: $input-bg;
    height: $input-height;

    input {
      border: none;
      border-right: none;
      outline: none;
      height: 100%;
      padding: 0 $input-padding-x;
      border-radius: 4px 0 0 4px !important;
      flex: 1;
      min-width: 240px;
      font-size: 14px;
      background: transparent;
    }

    .search-btn {
      border: none;
      border-left: none;
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

  /* ===== 以下保持原样，仅嵌套优化 ===== */
  .icon-preview-section {
    margin-bottom: 1rem;
  }

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

  .modal-btns {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    margin-top: 0.5rem;

    button {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      transition: var(--transition);

      &:first-child {
        background: var(--accent);
        color: #fff;

        &:hover {
          background: var(--accent-hover);
          transform: translateY(-1px);
          box-shadow: var(--shadow);
        }
      }

      &:last-child {
        background: #fff;
        color: #ef4444;
        border: 1px solid #ef4444;

        &:hover {
          background: #ef4444;
          color: #fff;
          transform: translateY(-1px);
          box-shadow: var(--shadow);
        }
      }
    }
  }

  .divider {
    height: 1px;
    background-color: var(--border);
    margin: 1rem -1.75rem;
    width: calc(100% + 3.5rem);
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>