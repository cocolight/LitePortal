import { openEditModal } from './editModal'
import { showNotification } from './notification'
import { showDeleteConfirmDialog } from './confirmDialog'

export interface Link {
  id?: string
  name: string
  icon: string
  textIcon?: string
  uploadIcon?: string
  int: string
  ext: string
  desc?: string
}

export function showContextMenu(
  e: MouseEvent,
  link: Link,
  onRefresh: () => void
) {
  e.preventDefault()
  const menu = document.createElement('div')
  menu.className = 'ctx-menu'
  menu.innerHTML = `
    <div class="ctx-menu-item" data-action="edit">
      <span class="ctx-menu-icon">✏️</span>
      <span class="ctx-menu-text">编辑</span>
    </div>
    <div class="ctx-menu-item" data-action="delete">
      <span class="ctx-menu-icon">🗑️</span>
      <span class="ctx-menu-text">删除</span>
    </div>
  `
  menu.style.cssText = `
    position:fixed;
    left:${e.clientX}px;
    top:${e.clientY}px;
    background:var(--card, #fff);
    border:1px solid var(--border, #e0e0e0);
    border-radius:8px;
    box-shadow:0 4px 12px rgba(0, 0, 0, 0.1);
    z-index:9999;
    min-width:120px;
    overflow:hidden;
    transform-origin:top left;
    animation:contextMenuFadeIn 0.2s ease-out;
  `
  document.body.appendChild(menu)

  // 使用闭包保存当前link的引用，避免后续操作时引用到错误的link对象
  const currentLink = { ...link }

  const handler = (ev: MouseEvent) => {
    // 确保点击的是菜单项而不是菜单本身
    const target = ev.target as HTMLElement
    const menuItem = target.closest('.ctx-menu-item') as HTMLElement

    if (!menuItem) return

    const action = menuItem.dataset.action
    if (action === 'edit') {
      openEditModal(currentLink, onRefresh)
      removeMenu()
      document.removeEventListener('click', handler)
      return
    }

    if (action === 'delete') {
      // 先移除菜单和事件监听器，避免重复触发
      removeMenu()
      document.removeEventListener('click', handler)

      // 创建自定义确认对话框
      showDeleteConfirmDialog(currentLink.name, () => {
        /* 调后端删除 */
        fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', id: currentLink.id })
        }).then(response => {
          if (response.ok) {
            onRefresh()
            showNotification('删除成功', 'success')
          } else {
            showNotification('删除失败: ' + response.statusText, 'error')
          }
        }).catch(error => {
          showNotification('删除失败: ' + error.message, 'error')
        })
      })
    }
  }

  // 移除菜单的函数，避免重复代码
  const removeMenu = () => {
    if (document.body.contains(menu)) {
      document.body.removeChild(menu)
    }
  }

  document.addEventListener('click', handler)
  // 添加一个备用的事件监听器，确保菜单能被移除
  setTimeout(() => {
    document.addEventListener('click', removeMenu, { once: true })
  }, 0)

  // 添加右键菜单样式（如果尚未添加）
  if (!document.getElementById('context-menu-styles')) {
    const style = document.createElement('style')
    style.id = 'context-menu-styles'
    style.textContent = `
      @keyframes contextMenuFadeIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }

      .ctx-menu-item {
        display: flex;
        align-items: center;
        padding: 10px 16px;
        color: var(--text, #333);
        font-size: 14px;
        cursor: pointer;
        transition: background-color 0.2s ease;
      }

      .ctx-menu-item:hover {
        background-color: var(--hover, #f5f5f5);
      }

      .ctx-menu-item:first-child {
        border-bottom: 1px solid var(--border, #e0e0e0);
      }

      .ctx-menu-icon {
        margin-right: 12px;
        font-size: 16px;
      }

      .ctx-menu-text {
        font-weight: 500;
      }
    `
    document.head.appendChild(style)
  }
}