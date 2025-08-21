<script setup>
import { ref, onMounted } from 'vue'
import SearchBox from './components/SearchBox.vue'
import CardGrid from './components/CardGrid.vue'
import ContextMenu from './components/ContextMenu.vue'
import EditModal from './components/EditModal.vue'

import ConfirmDialog from './components/ConfirmDialog.vue'
import ThemeToggle from './components/ThemeToggle.vue'
import { useLinks } from './composables/useLinks'
import { useTheme } from './composables/useTheme'

// 初始化主题
const { theme } = useTheme()

// 链接数据
const { fetchLinks, loading, error } = useLinks()

// 右键菜单状态
const contextMenuVisible = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })
const selectedLink = ref({})

// 编辑模态框状态
const editModalVisible = ref(false)
const editingLink = ref({})

// 确认对话框状态
const confirmDialogVisible = ref(false)
const deletingLinkName = ref('')


// 组件挂载时获取链接数据
onMounted(() => {
  fetchLinks()
})

// 显示右键菜单
const showContextMenu = (event, link) => {
  event.preventDefault()
  contextMenuPosition.value = { x: event.clientX, y: event.clientY }
  selectedLink.value = link
  contextMenuVisible.value = true
}

// 编辑链接
const handleEditLink = (link) => {
  editingLink.value = link
  editModalVisible.value = true
}

// 删除链接
const handleDeleteLink = (link) => {
  deletingLinkName.value = link.name
  selectedLink.value = link
  confirmDialogVisible.value = true
}

// 确认删除链接
const confirmDeleteLink = async () => {
  const { deleteLink } = useLinks()
  await deleteLink(selectedLink.value.id)
}

// 添加新链接
const handleAddLink = () => {
  editingLink.value = {
    name: '',
    icon: '',
    textIcon: '',
    uploadIcon: '',
    int: '',
    ext: '',
    desc: ''
  }
  editModalVisible.value = true
}

// 保存链接后刷新数据
const handleSaveLink = () => {
  fetchLinks()
}
</script>

<template>
  <div class="app-container">
    <header>
      <h1>LitePortal</h1>
      <ThemeToggle />
    </header>
    
    <main>
      <SearchBox />
      <CardGrid 
        @show-context-menu="showContextMenu"
        @add-link="handleAddLink"
      />
    </main>
    
    <!-- 右键菜单 -->
    <ContextMenu 
      v-model:visible="contextMenuVisible"
      :position="contextMenuPosition"
      :link="selectedLink"
      @edit="handleEditLink"
      @delete="handleDeleteLink"
      @refresh="fetchLinks"
    />
    
    <!-- 编辑模态框 -->
    <EditModal 
      v-model:visible="editModalVisible"
      :link="editingLink"
      @save="handleSaveLink"
    />
    
    <!-- 确认对话框 -->
    <ConfirmDialog 
      v-model:visible="confirmDialogVisible"
      :item-name="deletingLinkName"
      @confirm="confirmDeleteLink"
    />
    

  </div>
</template>

<style scoped>
.app-container {
  max-width: 1280px;
  margin: 0 auto;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

main {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
</style>
