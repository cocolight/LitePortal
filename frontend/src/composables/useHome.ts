import { onMounted, ref } from 'vue'
// import { useLinks } from './useLinks'
import { useLinkStore } from '@/stores/linkStore'
import { showNotification } from '@/utils/notification'
import type { Link } from '@/types'
import { DEFAULT_LINK } from '@/types'
import { storeToRefs } from 'pinia'

export function useHome() {
  // 链接数据
  const store = useLinkStore()
  const { links, loading, error} = storeToRefs(store)


  // 右键菜单状态
  const contextMenuVisible = ref(false)
  const contextMenuPosition = ref({ x: 0, y: 0 })
  const selectedLink = ref<Link>({ ...DEFAULT_LINK })

  // 编辑模态框状态
  const editModalVisible = ref(false)
  const editingLink = ref<Link>({ ...DEFAULT_LINK })

  // 确认对话框状态
  const confirmDialogVisible = ref(false)
  const deletingLinkName = ref('')
  const deletingLinkId = ref()


  // 获取链接数据
  const handleRefreshLinks =async()=>{
    try {
      await store.fetchLinks()
      showNotification('刷新成功', 'success')
    }catch (error) {
      showNotification('刷新失败', 'error')
    }

  }
  // 显示右键菜单
  const showContextMenu = (event: MouseEvent, link: Link) => {
    event.preventDefault()
    contextMenuPosition.value = { x: event.clientX, y: event.clientY }
    selectedLink.value = link
    contextMenuVisible.value = true
  }

  // 编辑链接
  const handleEditLink = (link: Link) => {
    editingLink.value = { ...link }
    editModalVisible.value = true
  }

  // 删除链接
  const handleDeleteLink = (link: Pick<Link, 'id' | 'name'>) => {
    deletingLinkName.value = link.name
    deletingLinkId.value = link.id
    confirmDialogVisible.value = true
  }

  // 确认删除链接
  const confirmDeleteLink = async () => {
    const success = await store.deleteLink(deletingLinkId.value)
    if (!success) {
      showNotification('删除失败', 'error')
      return
    }
    showNotification('删除成功', 'success')
    await store.fetchLinks()
  }



  // 添加新链接
  const handleAddLink = () => {
    editingLink.value = { ...DEFAULT_LINK }
    editModalVisible.value = true
  }

  // 保存链接后刷新数据
  const handleSaveLink = () => {
    store.fetchLinks()
  }

  onMounted(async () => {
    await handleRefreshLinks().catch(console.error)
  })

  return {
    // 链接数据
    links: links,
    loading: loading,
    error: error,

    // 右键菜单状态
    contextMenuVisible,
    contextMenuPosition,
    selectedLink,

    // 编辑模态框状态
    editModalVisible,
    editingLink,

    // 确认对话框状态
    confirmDialogVisible,
    deletingLinkName,

    // 方法
    showContextMenu,
    handleEditLink,
    handleDeleteLink,
    confirmDeleteLink,
    handleAddLink,
    handleSaveLink,
    handleRefreshLinks
  }
}

