<template>
  <teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="handleCancel">
      <div class="modal">
        <h3>{{ isEdit ? '编辑' : '新增' }}图标</h3>
        <div class="icon-preview-section">
          <IconPreview :isEdit="isEdit" v-model:iconType="localLinkState.iconType" v-model:onlineIcon="localLinkState.onlineIcon"
            v-model:textIcon="localLinkState.textIcon" v-model:uploadIcon="localLinkState.uploadIcon" v-model:paidIcon="localLinkState.paidIcon" @fetch-favicon="handlefetchFavicon" />
          <div class="divider"></div>
        </div>
        <FormData v-model:name="localLinkState.name" v-model:desc="localLinkState.desc" v-model:intUrl="localLinkState.intUrl"
          v-model:extUrl="localLinkState.extUrl" />
        <div class="modal-btns">
          <button id="mSave" @click="handleSave">保存</button>
          <button id="mCancel" @click="handleCancel">取消</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
  import { cloneDeep } from 'lodash-es'
  import { computed, watch, reactive } from 'vue'
  import IconPreview from './IconPreview.vue';
  import FormData from './FormData.vue';
  import { useLinkStore } from '@/stores/linkStore'
  import { IconType } from '@/types'
  import { showNotification } from '@/utils/notification.ts'
  import type { EditModalProps } from '@/types'
  // import { generateTextSvg } from '@/utils/iconUtils'


  const emit = defineEmits<{
    'update:visible': [visible: boolean]
    'save': []
  }>()

  const props = withDefaults(defineProps<EditModalProps>(), {
    visible: false,
    link: () => ({ linkId:'', name: '', desc: '', intUrl: '', extUrl: '', onlineIcon: '', iconType: IconType.onlineIcon, textIcon: '', uploadIcon: '', paidIcon: '' })
  })

  const localLinkState = reactive({
    ...cloneDeep(props.link),
    iconType: props.link.iconType || IconType.onlineIcon
  })

  // 监听 props.link 的变化
  watch(() => props.link, (newLink) => {
    if (newLink) {
      Object.assign(localLinkState, {
        ...newLink,
        iconType: newLink.iconType || IconType.onlineIcon
      });
    }
  }, { deep: true, immediate: true });


  const linkStore = useLinkStore()

  const isEdit = computed(() => !!props.link.linkId)

  // 监听表单是否变化，用于显示保存按钮
  const hasChanges = computed(() => {
    const original = props.link
    return !(
      original.name === localLinkState.name &&
      original.desc === localLinkState.desc &&
      original.intUrl === localLinkState.intUrl &&
      original.extUrl === localLinkState.extUrl &&
      original.iconType === localLinkState.iconType &&
      original.onlineIcon === localLinkState.onlineIcon &&
      original.textIcon === localLinkState.textIcon &&
      original.paidIcon === localLinkState.paidIcon
    )
  })

  // 监听表单数据变化，自动获取图标
  let fetchTimer: ReturnType<typeof setTimeout>

  // 监听内外网址变化，自动获取在线图标（仅在onlineIcon为空时）
  watch([() => localLinkState.intUrl, () => localLinkState.extUrl, () => localLinkState.onlineIcon], ([newInt, newExt, onlineIcon]) => {
    clearTimeout(fetchTimer);
    const url = newInt || newExt;

    if (!url || onlineIcon) return
    fetchTimer = setTimeout(() => autoFetchIcon(url), 1500);

  })

  // 自动获取图标
  const autoFetchIcon = async (url: string) => {
    if (!url) return

    try {
      await fetchFavicon(IconType.onlineIcon, url)
      // const faviconUrl = await fetchFavicon(IconType.onlineIcon, url)
      // localLinkState.onlineIcon = faviconUrl

    } catch (error) {
      console.error('获取网站图标失败:', error)
    }
  }

  // 获取网站图标
  async function fetchFavicon(iconType: IconType, url: string) {

    switch (iconType) {
      case IconType.onlineIcon:
        localLinkState.onlineIcon = await fetchOnlineIcon(url)
        break
      case IconType.textIcon:
        localLinkState.textIcon = await fetchTextIcon(url)
        break
      case IconType.paidIcon:
        localLinkState.paidIcon = await fetchPaidIcon(url)
        break
      default:
        throw new Error('无效的图标类型')
    }
  }

  async function fetchOnlineIcon(url: string) {
    if (!url.trim()) return ''
    if (/[\u4e00-\u9fa9\s<>]/.test(url)) return ''

    try {
      // 规范化URL，确保有协议
      let finalUrl = url

      // 检查是否已经是完整的URL（包含协议）
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        // 检查是否是完整的图标路径（包含常见的图标扩展名）
        const isIconPath = /\.(ico|png|jpg|jpeg|svg|gif|webp)(\?.*)?$/i.test(url)

        if (isIconPath) {
          // 如果是图标路径但没有协议，需要添加协议
          // 检查URL是否包含有效域名或IP
          if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(url) && !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url)) {
            showNotification('请输入有效的网址', 'error')
            return ''
          }
          finalUrl = 'https://' + url
        } else {
          // 不是图标路径，当作域名处理
          // 检查URL是否包含有效域名或IP
          if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(url) && !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(url)) {
            showNotification('请输入有效的网址', 'error')
            return ''
          }
          finalUrl = 'https://' + url
        }
      }

      // 创建URL对象以验证和标准化URL
      let urlObj: URL
      try {
        urlObj = new URL(finalUrl)
      } catch (e) {
        showNotification('无效的网址', 'error')
        return ''
      }

      // 检查当前URL是否已经是图标文件
      const isAlreadyIcon = /\.(ico|png|jpg|jpeg|svg|gif|webp)(\?.*)?$/i.test(urlObj.pathname)

      if (isAlreadyIcon) {
        // 直接尝试用户输入的图标URL
        try {
          const img = new Image()
          img.src = finalUrl

          await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
          })

          return finalUrl
        } catch (e) {
          // 如果直接加载失败，继续尝试其他路径
        }
      }

      // 如果不是图标文件或直接加载失败，尝试常见的图标路径
      const iconPaths = [
        '/favicon.ico',
        '/apple-touch-icon.png',
        '/apple-touch-icon-precomposed.png',
        '/favicon.svg',
        '/favicon.png',
        '/favicon-32x32.png',
        '/favicon-16x16.png'
      ]

      // 尝试每个路径
      for (const path of iconPaths) {
        try {
          const iconUrl = urlObj.origin + path
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

      // 所有尝试都失败
      showNotification('无法获取网站图标', 'error')
      return ''

    } catch (error) {
      showNotification('获取图标失败', 'error')
      console.error('获取网站图标失败:', error)
      return ''
    }
  }

  async function fetchTextIcon(text: string) {
    return text
  }

  async function fetchPaidIcon(url: string) {
    // TODO: 实现付费图标获取逻辑
    showNotification('图标库功能尚未实现', 'info')
    return 'https://api.iconify.design/mdi:cart.svg'
  }

  const handlefetchFavicon = async (iconType: IconType, url: string) => {
    if (url) {
      await fetchFavicon(iconType, url)
      return;
    }

    if (iconType === IconType.onlineIcon) {
      const srcUrl = localLinkState.intUrl || localLinkState.extUrl
      if (srcUrl?.trim()) {
        await fetchFavicon(iconType, url)
        return;
      }
      showNotification('请输入图标地址', 'error')
    }

  }

  // 保存
  const handleSave = async () => {

    if (!hasChanges.value) {
      showNotification('没有数据变更', 'info')
      emit('update:visible', false)
      return
    }

    try {
      // 根据是编辑还是添加执行不同操作
      const action = isEdit.value
        ? () => linkStore.updateLink(localLinkState)
        : () => {
          const {linkId, ...rest} = localLinkState
          return linkStore.addLink(rest);
        }

      const success = await action();

      if (success) {
        emit('update:visible', false);
        emit('save');
        showNotification(isEdit.value ? '更新成功' : '添加成功', 'success');
      } else {
        throw new Error(linkStore.error || (isEdit.value ? '更新失败' : '添加失败'));
      }
    } catch (error) {
      showNotification('更新保存失败', 'error');
    }
  };

  // 取消
  const handleCancel = () => {
    emit('update:visible', false)
  }

</script>

<style scoped lang="scss">
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
    width: 90vw;
    max-width: 480px;
    min-width: 320px;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--border);
    animation: slideUp 0.3s ease-out;
    box-sizing: border-box;

    h3 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
  }

  .icon-preview-section {
    margin-bottom: 1rem;
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