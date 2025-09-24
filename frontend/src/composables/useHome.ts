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
    await store.fetchLinks()
    if(store.error){
      showNotification('刷新失败: ' + store.error, 'error')
      store.clearError()
    }else{
      showNotification('刷新成功', 'success')
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
  const handleDeleteLink = (link: Pick<Link, 'linkId' | 'name'>) => {
    deletingLinkName.value = link.name
    deletingLinkId.value = link.linkId
    confirmDialogVisible.value = true
  }

  // 确认删除链接
  const confirmDeleteLink = async () => {
    // 先从前端状态中移除要删除的链接，提供即时反馈
    const linkToDelete = links.value.find(link => link.linkId === deletingLinkId.value)
    if (linkToDelete) {
      // 使用store方法从状态中移除链接
      store.removeLinkFromState(deletingLinkId.value)
    }

    // 然后发送删除请求
    const success = await store.deleteLink(deletingLinkId.value)
    if (!success) {
      // 如果删除失败，恢复链接
      if (linkToDelete) {
        store.restoreLinkToState(linkToDelete)
      }
      showNotification('删除失败', 'error')
      return
    }
    showNotification('删除成功', 'success')
  }



  // 添加新链接
  const handleAddLink = () => {
    editingLink.value = { ...DEFAULT_LINK }
    editModalVisible.value = true
  }

  // 保存链接后刷新数据
  const handleSaveLink = () => {
    // 不再需要在这里刷新数据，因为addLink和updateLink方法已经处理了
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

