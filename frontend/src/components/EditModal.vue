<template>
  <teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="handleCancel">
      <div class="modal">
        <h3>{{ isEdit ? '编辑' : '新增' }}图标</h3>

        <!-- 图标预览区域 -->
        <div class="icon-preview-section">
          <div class="icon-preview-container">
            <!-- 在线图标 -->
            <div class="preview-item online-icon-wrapper" @click="selectIconType(IconType.online_icon)">
              <div class="preview-icon online-icon" :class="{ selected: currentIconType === IconType.online_icon }">
                <img :src="iconPreviewUrl" alt="在线图标" onerror="this.src='https://api.iconify.design/mdi:web.svg'" />
              </div>
              <div class="preview-label">在线图标</div>
            </div>
            <!-- 文本图标 -->
            <div class="preview-item text-icon-wrapper" @click="selectIconType(IconType.text_icon)">
              <div class="preview-icon text-icon" :class="{ selected: currentIconType === IconType.text_icon }">
                {{ textIconPreview }}
              </div>
              <div class="preview-label">文字图标</div>
            </div>
            <!-- 图标库图标 -->
            <div class="preview-item" @click="selectIconType(IconType.upload_icon)">
              <div class="preview-icon upload-icon" :class="{ selected: currentIconType === IconType.upload_icon }">
                <img
                  :src="currentIconType === 'upload_icon' ? (iconValue || formData.uploadIcon || link.uploadIcon || 'https://api.iconify.design/mdi:cart.svg') : (formData.uploadIcon || link.uploadIcon || 'https://api.iconify.design/mdi:cart.svg')"
                  alt="定制图标" onerror="this.src='https://api.iconify.design/mdi:cart.svg'" />
              </div>
              <div class="preview-label">定制图标</div>
            </div>
          </div>
          <!-- 图标文字 -->
          <label>
            <strong>{{ iconLabel }}</strong>
            <!-- 原生搜索框 -->
            <div class="input-wrapper">
              <input v-model="iconValue" :placeholder="iconPlaceholder"
                @keydown.enter="fetchFavicon(formData.int || formData.ext)" />
              <button class="search-btn" type="button" @click="fetchFavicon(formData.int || formData.ext)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 5L20.5 19l-5-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                </svg>
              </button>
            </div>
          </label>
          <div class="divider"></div>
        </div>

        <label>
          <strong>标题</strong>
          <input id="mName" v-model="formData.name" />
        </label>

        <label>
          <strong>描述</strong>
          <input id="mDesc" v-model="formData.desc" />
        </label>

        <label>
          <strong>内网地址</strong>
          <input id="mInt" v-model="formData.int" />
        </label>

        <label>
          <strong>公网地址</strong>
          <input id="mExt" v-model="formData.ext" />
        </label>

        <div class="modal-btns">
          <button id="mSave" @click="handleSave">保存</button>
          <button id="mCancel" @click="handleCancel">取消</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useLinkStore } from '@/stores/linkStore'
import { showNotification } from '@/utils/notification.ts'
import { IconType } from '@/types'
import type { EditModalProps } from '@/types'
// import SearchBar from './SearchBar.vue'

const props = withDefaults(defineProps<EditModalProps>(),{
  visible: false,
  link: () => ({name: '', desc: '', int: '', ext: '', icon: '', iconType: IconType.online_icon, textIcon: '', uploadIcon: ''})
})

const emit = defineEmits(['update:visible', 'save'])

const linkStore = useLinkStore()

const isEdit = computed(() => !!props.link.id)
// 表单数据
const formData = ref({ ...props.link })

// 图标类型
const currentIconType = ref<IconType>(
  isEdit.value ? props.link.iconType || IconType.online_icon: IconType.online_icon
)
const iconValue = ref('')

// 计算属性
const iconLabel = computed(() => {
  switch (currentIconType.value) {
    case IconType.online_icon: return '图标URL'
    case IconType.text_icon: return '图标文字'
    case IconType.upload_icon: return '图标URL'
    default: return '图标URL'
  }
})


const iconPlaceholder = computed(() => {
  switch (currentIconType.value) {
    case IconType.online_icon: return '输入图标URL'
    case IconType.text_icon: return '输入1-2个字符'
    case IconType.upload_icon: return '输入图标URL'
    default: return '输入图标URL'
  }
})

const iconPreviewUrl = computed(() => {
  if (currentIconType.value === IconType.online_icon) {
    return iconValue.value || formData.value.icon || props.link.icon || 'https://api.iconify.design/mdi:web.svg'
  }
  return formData.value.icon || props.link.icon || 'https://api.iconify.design/mdi:web.svg'
})

const textIconPreview = computed(() => {
  if (currentIconType.value === IconType.text_icon) {
    const text = iconValue.value || formData.value.textIcon || props.link.textIcon || formData.value.name
    return text ? text.charAt(0).toUpperCase() : 'A'
  }
  return formData.value.textIcon || props.link.textIcon ?
    (formData.value.textIcon || props.link.textIcon).charAt(0).toUpperCase() :
    formData.value.name ? formData.value.name.charAt(0).toUpperCase() : 'A'
})

// 监听 props.link 变化，更新表单数据
watch(() => props.link, (newLink) => {
  formData.value = { ...newLink }

  // 确定初始图标类型
  if (newLink.iconType) {
    currentIconType.value = newLink.iconType
    if (newLink.iconType === IconType.text_icon) {
      iconValue.value = newLink.textIcon || ''
    } else if (newLink.iconType === IconType.upload_icon) {
      iconValue.value = newLink.uploadIcon || ''
    } else {
      iconValue.value = newLink.icon || ''
    }
  } else if (newLink.textIcon) {
    currentIconType.value = IconType.text_icon
    iconValue.value = newLink.textIcon
  } else if (newLink.uploadIcon) {
    currentIconType.value = IconType.upload_icon
    iconValue.value = newLink.uploadIcon
  } else {
    currentIconType.value = IconType.online_icon
    iconValue.value = newLink.icon || ''
  }
}, { immediate: true })

// 监听表单数据变化，自动获取图标
let fetchTimer: ReturnType<typeof setTimeout>
const autoFetchIcon = async (url: string) => {
  if (!url) return

  try {
    const faviconUrl = await fetchFavicon(url)
    if (currentIconType.value === 'online_icon') {
      iconValue.value = faviconUrl
    }
  } catch (error) {
    console.error('获取网站图标失败:', error)
  }
}

watch(() => formData.value.int, (newUrl) => {
  clearTimeout(fetchTimer)
  if (newUrl) {
    fetchTimer = setTimeout(() => autoFetchIcon(newUrl), 1000)
  }
})

watch(() => formData.value.ext, (newUrl) => {
  clearTimeout(fetchTimer)
  if (newUrl) {
    fetchTimer = setTimeout(() => autoFetchIcon(newUrl), 1000)
  }
})

// 选择图标类型
const selectIconType = (type: IconType) => {
  currentIconType.value = type

  // 保存当前编辑的值，确保切换类型时不会丢失已输入的内容
  if (type !== IconType.online_icon && iconValue.value && currentIconType.value === IconType.online_icon) {
    formData.value.icon = iconValue.value
  } else if (type !== IconType.text_icon && iconValue.value && currentIconType.value === IconType.text_icon) {
    formData.value.textIcon = iconValue.value
  } else if (type !== IconType.upload_icon && iconValue.value && currentIconType.value === IconType.upload_icon) {
    formData.value.uploadIcon = iconValue.value
  }

  // 根据选择的类型加载对应的值
  switch (type) {
    case IconType.online_icon:
      iconValue.value = formData.value.icon || props.link.icon || ''
      break
    case IconType.text_icon:
      iconValue.value = formData.value.textIcon || props.link.textIcon ||
        (formData.value.name ? formData.value.name.substring(0, 2) : '')
      break
    case IconType.upload_icon:
      iconValue.value = formData.value.uploadIcon || props.link.uploadIcon || ''
      break
  }
}

// 获取网站图标
async function fetchFavicon(url: string) {
  try {
    // 规范化URL，确保有协议
    let domain = url
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      domain = 'https://' + url
    }

    // 创建URL对象以提取域名
    const urlObj = new URL(domain)
    domain = urlObj.origin

    // 尝试多种可能的图标路径
    const iconPaths = [
      '/favicon.ico',
      '/apple-touch-icon.png',
      '/apple-touch-icon-precomposed.png',
      '/favicon.svg',
      '/favicon.png'
    ]

    // 尝试每个路径
    for (const path of iconPaths) {
      try {
        const iconUrl = domain + path
        const img = new Image()
        img.src = iconUrl

        // 如果图片加载成功，返回URL
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
        })

        return iconUrl
      } catch (e) {
        // 继续尝试下一个路径
      }
    }
    showNotification('获取图标成功', 'success')
    // 如果所有常见路径都失败，尝试使用第三方服务
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`
  } catch (error) {
    showNotification('获取图标失败', 'error')
    throw new Error('无法获取网站图标')
  }
}

// 保存
const handleSave = async () => {
  // 确保所有图标类型的值都被保存
  let finalIconValue = formData.value.icon || props.link.icon || ''
  let finalTextIconValue = formData.value.textIcon || props.link.textIcon || ''
  let finalUploadIconValue = formData.value.uploadIcon || props.link.uploadIcon || ''

  // 根据当前选中的图标类型更新对应的值
  if (currentIconType.value === IconType.online_icon) {
    // 在线图标，更新icon字段
    finalIconValue = iconValue.value
  } else if (currentIconType.value === IconType.text_icon) {
    // 文字图标，更新textIcon字段
    finalTextIconValue = iconValue.value || (formData.value.name ? formData.value.name.substring(0, 2) : '')
  } else if (currentIconType.value === IconType.upload_icon) {
    // 上传图标，更新uploadIcon字段
    finalUploadIconValue = iconValue.value
  }

  const payload = {
    id: props.link.id,
    name: formData.value.name,
    desc: formData.value.desc,
    icon: finalIconValue,
    textIcon: finalTextIconValue,
    uploadIcon: finalUploadIconValue,
    iconType: currentIconType.value,
    int: formData.value.int,
    ext: formData.value.ext
  }

  let success
  if (isEdit.value) {
    success = await linkStore.updateLink(payload)
  } else {
    success = await linkStore.addLink(payload)
  }

  if (success) {
    emit('update:visible', false)
    emit('save')
    showNotification(isEdit.value ? '更新成功' : '添加成功', 'success')
  } else {
    showNotification(linkStore.error || (isEdit.value ? '更新失败' : '添加失败'), 'error')
  }
}

// 取消
const handleCancel = () => {
  emit('update:visible', false)
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
  from { opacity: 0; }
  to { opacity: 1; }
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
