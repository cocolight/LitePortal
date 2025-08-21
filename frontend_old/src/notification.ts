// 通知模块
export function showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
  // 创建通知元素
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  // 添加样式
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 4px;
    color: white;
    font-weight: 500;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    opacity: 0;
    transform: translateY(-20px);
    transition: opacity 0.3s, transform 0.3s;
    max-width: 300px;
  `;
  
  // 根据类型设置背景色
  switch (type) {
    case 'success':
      notification.style.backgroundColor = '#4caf50';
      break;
    case 'error':
      notification.style.backgroundColor = '#f44336';
      break;
    case 'info':
    default:
      notification.style.backgroundColor = '#2196f3';
      break;
  }
  
  // 添加到页面
  document.body.appendChild(notification);
  
  // 触发动画
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateY(0)';
  }, 10);
  
  // 自动关闭
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-20px)';
    
    // 动画结束后移除元素
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
}
