// 删除确认对话框模块
export function showDeleteConfirmDialog(itemName: string, onConfirm: () => void) {
  // 创建遮罩层
  const overlay = document.createElement('div');
  overlay.className = 'confirm-dialog-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.3s ease;
  `;
  
  // 创建对话框容器
  const dialog = document.createElement('div');
  dialog.className = 'confirm-dialog';
  dialog.style.cssText = `
    background-color: var(--card, #fff);
    border-radius: 8px;
    padding: 24px;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    transform: translateY(20px);
    transition: transform 0.3s ease;
  `;
  
  // 创建标题
  const title = document.createElement('h3');
  title.textContent = '确认删除';
  title.style.cssText = `
    margin: 0 0 16px 0;
    color: var(--text, #333);
    font-size: 18px;
    font-weight: 600;
  `;
  
  // 创建消息内容
  const message = document.createElement('p');
  message.textContent = `确定要删除 "${itemName}" 吗？此操作不可撤销。`;
  message.style.cssText = `
    margin: 0 0 24px 0;
    color: var(--text, #333);
    font-size: 16px;
    line-height: 1.5;
    font-weight: 500;
  `;
  
  // 创建按钮容器
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  `;
  
  // 创建取消按钮
  const cancelButton = document.createElement('button');
  cancelButton.textContent = '取消';
  cancelButton.style.cssText = `
    padding: 8px 16px;
    border: 1px solid var(--border, #ddd);
    border-radius: 4px;
    background-color: transparent;
    color: var(--text, #333);
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.2s;
  `;
  
  // 创建确认按钮
  const confirmButton = document.createElement('button');
  confirmButton.textContent = '确认删除';
  confirmButton.style.cssText = `
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    background-color: #f44336;
    color: white;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.2s;
  `;
  
  // 添加悬停效果
  cancelButton.addEventListener('mouseover', () => {
    cancelButton.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
  });
  
  cancelButton.addEventListener('mouseout', () => {
    cancelButton.style.backgroundColor = 'transparent';
  });
  
  confirmButton.addEventListener('mouseover', () => {
    confirmButton.style.backgroundColor = '#d32f2f';
  });
  
  confirmButton.addEventListener('mouseout', () => {
    confirmButton.style.backgroundColor = '#f44336';
  });
  
  // 添加事件监听器
  cancelButton.addEventListener('click', () => {
    overlay.style.opacity = '0';
    dialog.style.transform = 'translateY(20px)';
    setTimeout(() => {
      document.body.removeChild(overlay);
    }, 300);
  });
  
  confirmButton.addEventListener('click', () => {
    overlay.style.opacity = '0';
    dialog.style.transform = 'translateY(20px)';
    setTimeout(() => {
      document.body.removeChild(overlay);
      onConfirm();
    }, 300);
  });
  
  // 组装对话框
  buttonContainer.appendChild(cancelButton);
  buttonContainer.appendChild(confirmButton);
  dialog.appendChild(title);
  dialog.appendChild(message);
  dialog.appendChild(buttonContainer);
  overlay.appendChild(dialog);
  
  // 添加到页面并显示动画
  document.body.appendChild(overlay);
  
  // 触发动画
  setTimeout(() => {
    overlay.style.opacity = '1';
    dialog.style.transform = 'translateY(0)';
  }, 10);
}
