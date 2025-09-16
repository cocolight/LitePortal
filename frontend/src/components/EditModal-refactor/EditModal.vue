<template>
  <teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="handleCancel">
      <div class="modal">
        <h3>{{ isEdit ? '编辑' : '新增' }}图标</h3>

        <IconPreviewSection
          :current-icon-type="currentIconType"
          :icon-value="iconValue"
          :form-data="formData"
          :link="props.link"
          @select-icon-type="selectIconType"
          @fetch-favicon="fetchFavicon"
        />

        <FormFields
          v-model:name="formData.name"
          v-model:desc="formData.desc"
          v-model:int="formData.int"
          v-model:ext="formData.ext"
        />

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
import IconPreviewSection from './IconPreviewSection.vue'
import FormFields from './FormFields.vue'

const props = withDefaults(defineProps<EditModalProps>(), {
  visible: false,
  link: () => ({
    name: '',
    desc: '',
    int: '',
    ext: '',
    icon: '',
    iconType: IconType.online_icon,
    textIcon: '',
    uploadIcon: ''
  })
})

const emit = defineEmits(['update:visible', 'save'])

const linkStore = useLinkStore()
const isEdit = computed(() => !!props.link.id)
const formData = ref({ ...props.link })
const currentIconType = ref<IconType>(
  isEdit.value ? props.link.iconType || IconType.online_icon : IconType.online_icon
)
const iconValue = ref('')

// 监听props.link变化
watch(() => props.link, (newLink) => {
  formData.value = { ...newLink }
  updateIconTypeAndValue(newLink)
}, { immediate: true })

// 监听表单数据变化，自动获取图标
let fetchTimer: ReturnType<typeof setTimeout>
watch([() => formData.value.int, () => formData.value.ext], ([intUrl, extUrl]) => {
  clearTimeout(fetchTimer)
  const url = intUrl || extUrl
  if (url) {
    fetchTimer = setTimeout(() => autoFetchIcon(url), 1000)
  }
})

const updateIconTypeAndValue = (link: any) => {
  if (link.iconType) {
    currentIconType.value = link.iconType
    if (link.iconType === IconType.text_icon) {
      iconValue.value = link.textIcon || ''
    } else if (link.iconType === IconType.upload_icon) {
      iconValue.value = link.uploadIcon || ''
    } else {
      iconValue.value = link.icon || ''
    }
  } else if (link.textIcon) {
    currentIconType.value = IconType.text_icon
    iconValue.value = link.textIcon
  } else if (link.uploadIcon) {
    currentIconType.value = IconType.upload_icon
    iconValue.value = link.uploadIcon
  } else {
    currentIconType.value = IconType.online_icon
    iconValue.value = link.icon || ''
  }
}

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

const selectIconType = (type: IconType) => {
  // 保存当前编辑的值
  if (type !== IconType.online_icon && iconValue.value && currentIconType.value === IconType.online_icon) {
    formData.value.icon = iconValue.value
  } else if (type !== IconType.text_icon && iconValue.value && currentIconType.value === IconType.text_icon) {
    formData.value.textIcon = iconValue.value
  } else if (type !== IconType.upload_icon && iconValue.value && currentIconType.value === IconType.upload_icon) {
    formData.value.uploadIcon = iconValue.value
  }

  currentIconType.value = type

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

async function fetchFavicon(url: string) {
  try {
    let domain = url
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      domain = 'https://' + url
    }

    const urlObj = new URL(domain)
    domain = urlObj.origin

    const iconPaths = [
      '/favicon.ico',
      '/apple-touch-icon.png',
      '/apple-touch-icon-precomposed.png',
      '/favicon.svg',
      '/favicon.png'
    ]

    for (const path of iconPaths) {
      try {
        const iconUrl = domain + path
        const img = new Image()
        img.src = iconUrl

        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
        })

        return iconUrl
      } catch (e) {
        continue
      }
    }
    showNotification('获取图标成功', 'success')
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`
  } catch (error) {
    showNotification('获取图标失败', 'error')
    throw new Error('无法获取网站图标')
  }
}

const handleSave = async () => {
  let finalIconValue = formData.value.icon || props.link.icon || ''
  let finalTextIconValue = formData.value.textIcon || props.link.textIcon || ''
  let finalUploadIconValue = formData.value.uploadIcon || props.link.uploadIcon || ''

  if (currentIconType.value === IconType.online_icon) {
    finalIconValue = iconValue.value
  } else if (currentIconType.value === IconType.text_icon) {
    finalTextIconValue = iconValue.value || (formData.value.name ? formData.value.name.substring(0, 2) : '')
  } else if (currentIconType.value === IconType.upload_icon) {
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
