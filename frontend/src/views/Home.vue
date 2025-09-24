<template>
  <div class="home-container">
    <SearchBox />

    <CardGrid :links="links" :loading="loading" :error="error" @show-context-menu="showContextMenu"
      @add-link="handleAddLink" />

    <!-- 右键菜单 -->
    <ContextMenu v-model:visible="contextMenuVisible" :position="contextMenuPosition" :link="selectedLink"
      @edit="handleEditLink" @delete="handleDeleteLink" @refresh="handleSaveLink" />

    <!-- 编辑模态框 -->
    <EditModal v-model:visible="editModalVisible" :link="editingLink" @save="handleSaveLink" :key="modalKey"/>

    <!-- 确认对话框 -->
    <ConfirmDialog v-model:visible="confirmDialogVisible" :item-name="deletingLinkName" @confirm="confirmDeleteLink" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import SearchBox from '@/components/SearchBox.vue'
import CardGrid from '@/components/CardGrid.vue'
import ContextMenu from '@/components/ContextMenu.vue'
import EditModal from '@/components/EditModal'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { useHome } from '@/composables/useHome'

const modalKey = ref(0)

// 使用首页业务逻辑
const {
  links,
  loading,
  error,
  contextMenuVisible,
  contextMenuPosition,
  selectedLink,
  editModalVisible,
  editingLink,
  confirmDialogVisible,
  deletingLinkName,
  showContextMenu,
  handleEditLink,
  handleDeleteLink,
  confirmDeleteLink,
  handleAddLink,
  handleSaveLink,
  // handleRefreshLinks
} = useHome()

watch(editModalVisible, v => { if (v) modalKey.value++ })
</script>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
</style>
