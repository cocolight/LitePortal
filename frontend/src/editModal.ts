import type { Link } from './contextMenu'
import { showNotification } from './notification'

export function openEditModal(link: Link, onSave: () => void) {
  const overlay = document.createElement('div')
  overlay.className = 'modal-overlay'
  overlay.innerHTML = `
    <div class="modal">
      <h3>${link.id ? '编辑' : '新增'}图标</h3>
      <label>标题
        <input id="mName"  value="${link.name}"  />
      </label>
      <label>描述
        <input id="mDesc"  value="${link.desc || ''}" />
      </label>
      <label>图标 URL
        <input id="mIcon"  value="${link.icon}"  />
      </label>
      <label>内网地址
        <input id="mInt"   value="${link.int}"   />
      </label>
      <label>公网地址
        <input id="mExt"   value="${link.ext}"   />
      </label>
      <div class="modal-btns">
        <button id="mSave">保存</button>
        <button id="mCancel">取消</button>
      </div>
    </div>
  `
  document.body.appendChild(overlay)

  const getVal = (id: string) => (overlay.querySelector(id) as HTMLInputElement).value.trim()

  overlay.querySelector('#mSave')!.addEventListener('click', () => {
    const payload: Link = {
      id: link.id,
      name: getVal('#mName'),
      desc: getVal('#mDesc'),
      icon: getVal('#mIcon'),
      int: getVal('#mInt'),
      ext: getVal('#mExt')
    }
    fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(response => {
      if (response.ok) {
        // 保存成功
        document.body.removeChild(overlay)
        onSave()
        showNotification('保存成功', 'success')
      } else {
        // 保存失败
        showNotification('保存失败: ' + response.statusText, 'error')
      }
    }).catch(error => {
      // 网络错误
      showNotification('保存失败: ' + error.message, 'error')
    })
  })
  overlay.querySelector('#mCancel')!.addEventListener('click', () => {
    document.body.removeChild(overlay)
  })
}