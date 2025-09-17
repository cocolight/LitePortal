<template>
  <teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="handleCancel">
      <div class="modal">
        <h3>{{ isEdit ? '编辑' : '新增' }}图标</h3>
        <div class="icon-preview-section">
          <IconPreview :isEdit="isEdit" v-model:iconType="localLinkState.iconType" v-model:onlineIcon="localLinkState.onlineIcon"
            v-model:textIcon="localLinkState.textIcon" v-model:uploadIcon="localLinkState.uploadIcon" @fetch-favicon="fetchFavicon" />
          <div class="divider"></div>
        </div>
        <FormData v-model:name="localLinkState.name" v-model:desc="localLinkState.desc" v-model:int="localLinkState.int"
          v-model:ext="localLinkState.ext" />
        <div class="modal-btns">
          <button id="mSave" @click="handleSave">保存</button>
          <button id="mCancel" @click="handleCancel">取消</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
  import { computed, watch, reactive, toRefs } from 'vue'
  import IconPreview from './IconPreview.vue';
  import FormData from './FormData.vue';
  import { useLinkStore } from '@/stores/linkStore'
  import { IconType } from '@/types'
  import { showNotification } from '@/utils/notification.ts'
  import type { EditModalProps } from '@/types'


  const emit = defineEmits<{
    'update:visible': [visible: boolean]
    'save': []
  }>()

  const props = withDefaults(defineProps<EditModalProps>(), {
    visible: false,
    link: () => ({ name: '', desc: '', int: '', ext: '', icon: '', iconType: IconType.onlineIcon, textIcon: '', uploadIcon: '' })
  })

  const localLinkState = reactive({
    ...props.link,
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

  const isEdit = computed(() => !!props.link.id)

  // 监听表单数据变化，自动获取图标
  let fetchTimer: ReturnType<typeof setTimeout>

  // 监听内外网址变化，自动获取在线图标（仅在onlineIcon为空时）
  watch([() => localLinkState.int, () => localLinkState.ext, () => localLinkState.onlineIcon], ([newInt, newExt, onlineIcon]) => {
    clearTimeout(fetchTimer);
    const url = newInt || newExt;
    if (url && !onlineIcon) {
      fetchTimer = setTimeout(() => autoFetchIcon(url), 1000);
    }
  })

  // 自动获取图标
  const autoFetchIcon = async (url: string) => {
    if (!url) return

    try {
      const faviconUrl = await fetchFavicon(IconType.onlineIcon, url)
      localLinkState.onlineIcon = faviconUrl
      // if (currentIconType.value === IconType.onlineIcon) {
      //   iconValue.value = faviconUrl
      // }
    } catch (error) {
      console.error('获取网站图标失败:', error)
    }
  }

  // 获取网站图标
  async function fetchFavicon(iconType: IconType, url: string) {
    switch (iconType) {
      case IconType.onlineIcon:
        return fetchOnlineIcon(url)
      case IconType.textIcon:
        return localLinkState.textIcon
      case IconType.paidIcon:
        return fetchPaidIcon(url)
      // case IconType.upload_icon:
      //   return localLinkState.uploadIcon
      default:
        throw new Error('无效的图标类型')
    }
  }

  async function fetchOnlineIcon(url: string) {
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
      // return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`
    } catch (error) {
      showNotification('获取图标失败', 'error')
      console.error('获取网站图标失败:', error)
      // return DEFAULT_ICONS.online
      // throw new Error('无法获取网站图标')
    }
  }

  async function fetchPaidIcon(url: string) {
    // TODO: 实现付费图标获取逻辑
    return ''
  }

  // 图标类型
  // const currentIconType = computed(() => localLinkState.iconType)

  // 图标值
  // const iconValue = computed({
  //   get() {
  //     switch (currentIconType.value) {

  //   }
  // }

  // 保存
  const handleSave = async () => {
    // 准备基础数据
    // const { onlineIcon, textIcon, uploadIcon, name, desc, int, ext } = localLinkState;
    // const { link } = props;

    // 准备图标数据，根据当前类型设置值
    // const iconData = {
    //   [IconType.onlineIcon]: iconValue.value,
    //   [IconType.text_icon]: iconValue.value || (name ? name.substring(0, 2) : ''),
    //   [IconType.upload_icon]: iconValue.value
    // };

    // 构建请求载荷
    // const payload = {
    //   id: link.id,
    //   name,
    //   desc,
    //   icon: currentIconType.value === IconType.onlineIcon ? iconData[IconType.onlineIcon] : icon || link.icon || '',
    //   textIcon: currentIconType.value === IconType.text_icon ? iconData[IconType.text_icon] : textIcon || link.textIcon || '',
    //   uploadIcon: currentIconType.value === IconType.upload_icon ? iconData[IconType.upload_icon] : uploadIcon || link.uploadIcon || '',
    //   iconType: currentIconType.value,
    //   int,
    //   ext
    // };

    try {
      // 根据是编辑还是添加执行不同操作
      const action = isEdit.value
        ? () => linkStore.updateLink(localLinkState)
        : () => linkStore.addLink(localLinkState);

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