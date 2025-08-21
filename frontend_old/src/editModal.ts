import type { Link } from './contextMenu'
import { showNotification } from './notification'

// 获取网站图标的函数
async function fetchFavicon(url: string): Promise<string> {
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
    ];

    // 首先尝试从HTML中获取图标链接
    try {
      const response = await fetch(domain, {
        method: 'GET',
        mode: 'no-cors'
      });

      // 由于no-cors模式，我们无法直接读取响应内容
      // 所以直接尝试常见的图标路径
    } catch (e) {
      // 如果无法获取HTML，继续尝试常见路径
    }

    // 尝试每个路径
    for (const path of iconPaths) {
      try {
        const iconUrl = domain + path;
        const img = new Image();
        img.src = iconUrl;

        // 如果图片加载成功，返回URL
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        return iconUrl;
      } catch (e) {
        // 继续尝试下一个路径
      }
    }

    // 如果所有常见路径都失败，尝试使用第三方服务
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
  } catch (error) {
    throw new Error('无法获取网站图标');
  }
}

export function openEditModal(link: Link, onSave: () => void) {
  const overlay = document.createElement('div')
  overlay.className = 'modal-overlay'
  overlay.innerHTML = `
    <div class="modal">
      <h3>${link.id ? '编辑' : '新增'}图标</h3>

      <!-- 图标预览区域 -->
      <div class="icon-preview-section">
        <!-- 标题已移除 -->
        <div class="icon-preview-container">
          <div class="preview-item online-icon-wrapper">
            <div class="preview-icon online-icon selected">
              <img src="${link.icon || 'https://api.iconify.design/mdi:web.svg'}" alt="在线图标" onerror="this.src='https://api.iconify.design/mdi:web.svg'" />
            </div>
            <div class="preview-label">在线图标</div>
            <div class="fetch-hint">获取图标</div>
          </div>
          <div class="preview-item text-icon-wrapper">
            <div class="preview-icon text-icon">${link.textIcon ? link.textIcon.charAt(0).toUpperCase() : (link.name ? link.name.charAt(0).toUpperCase() : 'A')}</div>
            <div class="preview-label">文字图标</div>
          </div>
          <div class="preview-item">
            <div class="preview-icon upload-icon">
              <img src="${link.uploadIcon || 'https://api.iconify.design/mdi:upload.svg'}" alt="上传图标" onerror="this.src='https://api.iconify.design/mdi:upload.svg'" />
            </div>
            <div class="preview-label">上传图标</div>
          </div>
        </div>
        <label><strong>图标URL</strong>
          <input id="mIcon"  value="${link.textIcon || link.icon}"  />
        </label>
        <div class="divider"></div>
      </div>

      <label><strong>标题</strong>
        <input id="mName"  value="${link.name}"  />
      </label>
      <label><strong>描述</strong>
        <input id="mDesc"  value="${link.desc || ''}" />
      </label>
      <label><strong>内网地址</strong>
        <input id="mInt"   value="${link.int}"   />
      </label>
      <label><strong>公网地址</strong>
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

  // 实时更新预览
  const nameInput = overlay.querySelector('#mName') as HTMLInputElement
  const iconInput = overlay.querySelector('#mIcon') as HTMLInputElement
  const onlineIcon = overlay.querySelector('.online-icon img') as HTMLImageElement
  const textIcon = overlay.querySelector('.text-icon') as HTMLDivElement
  const onlineIconWrapper = overlay.querySelector('.online-icon-wrapper') as HTMLDivElement
  const fetchHint = overlay.querySelector('.fetch-hint') as HTMLDivElement
  const intInput = overlay.querySelector('#mInt') as HTMLInputElement

  // 保存当前图标类型的变量
  let currentIconType = 'online' // 'online', 'text', 'upload'

  // 根据已有数据确定初始图标类型
  if (link.textIcon) {
    currentIconType = 'text'
  } else if (link.uploadIcon) {
    currentIconType = 'upload'
  } else {
    currentIconType = 'online'
  }
  const extInput = overlay.querySelector('#mExt') as HTMLInputElement

  nameInput.addEventListener('input', () => {
    const name = nameInput.value.trim()
    textIcon.textContent = name ? name.charAt(0).toUpperCase() : 'A'
  })

  iconInput.addEventListener('input', () => {
    const iconUrl = iconInput.value.trim()
    if (iconUrl) {
      onlineIcon.src = iconUrl
    }
  })

  // 当内网或外网地址输入时，自动获取图标
  const autoFetchIcon = async (url: string) => {
    if (!url) return

    try {
      showNotification('正在获取网站图标...', 'info')
      const faviconUrl = await fetchFavicon(url)
      iconInput.value = faviconUrl
      onlineIcon.src = faviconUrl
      showNotification('成功获取网站图标', 'success')
    } catch (error) {
      iconInput.value = '在线图标获取失败'
      showNotification('获取网站图标失败', 'error')
    }
  }

  // 添加输入事件监听，当输入URL时延迟获取图标
  let fetchTimer: NodeJS.Timeout
  const setupUrlInputListener = (input: HTMLInputElement) => {
    input.addEventListener('input', () => {
      clearTimeout(fetchTimer)
      const url = input.value.trim()
      if (url) {
        fetchTimer = setTimeout(() => autoFetchIcon(url), 1000) // 延迟1秒获取
      }
    })
  }

  setupUrlInputListener(intInput)
  setupUrlInputListener(extInput)

  // 在线图标点击交互
  onlineIconWrapper.addEventListener('click', () => {
    // 切换到在线图标类型
    currentIconType = 'online'

    // 恢复标签文字为"图标URL"
    const iconUrlLabel = overlay.querySelector('label:has(#mIcon) strong')
    if (iconUrlLabel) {
      iconUrlLabel.textContent = '图标URL'
    }

    // 如果已有在线图标，则显示它
    if (link.icon) {
      iconInput.value = link.icon
      onlineIcon.src = link.icon
    }
  })

  // 文字图标点击事件
  const textIconWrapper = overlay.querySelector('.text-icon-wrapper') as HTMLDivElement

  textIconWrapper.addEventListener('click', () => {
    // 修改标签文字
    const iconUrlLabel = overlay.querySelector('label:has(#mIcon) strong')
    if (iconUrlLabel) {
      iconUrlLabel.textContent = '图标文字'
    }

    // 优先使用已保存的文字图标值，如果没有则使用标题的前两个字
    const name = nameInput.value.trim()
    let textValue = ''

    // 如果已有文字图标值，使用它
    if (link.textIcon) {
      textValue = link.textIcon
    } else if (name) {
      // 否则取标题的前两个字，如果只有一个字就取一个
      textValue = name.length >= 2 ? name.substring(0, 2) : name
    }

    if (textValue) {
      iconInput.value = textValue
      // 更新文字图标显示
      textIcon.textContent = textValue.charAt(0).toUpperCase()
      // 设置当前图标类型为文字图标
      currentIconType = 'text'
    }
  })

  // 保存当前图标类型的变量
  // let currentIconType = 'online' // 'online', 'text', 'upload'

  // 监听图标输入框的变化，判断当前图标类型
  iconInput.addEventListener('input', () => {
    const iconValue = iconInput.value.trim()

    // 如果输入的是URL，则是在线图标
    if (iconValue && (iconValue.startsWith('http://') || iconValue.startsWith('https://') || iconValue.includes('/'))) {
      currentIconType = 'online'
      onlineIcon.src = iconValue
    }
    // 如果输入的不是URL，则是文字图标
    else if (iconValue && iconValue.length <= 2) {
      currentIconType = 'text'
      textIcon.textContent = iconValue.charAt(0).toUpperCase()
    }
  })

  overlay.querySelector('#mSave')!.addEventListener('click', () => {
    // 根据当前图标类型设置相应的字段
    let iconValue = getVal('#mIcon')
    let textIconValue = ''
    let uploadIconValue = link.uploadIcon || ''

    if (currentIconType === 'online') {
      // 在线图标，保存到icon字段
      // textIcon和uploadIcon保持不变
    } else if (currentIconType === 'text') {
      // 文字图标，保存到textIcon字段
      textIconValue = iconValue
      iconValue = link.icon || '' // 保留原始的在线图标URL
    } else if (currentIconType === 'upload') {
      // 上传图标，保存到uploadIcon字段
      uploadIconValue = iconValue
      iconValue = link.icon || '' // 保留原始的在线图标URL
    }

    const payload: Link = {
      id: link.id,
      name: getVal('#mName'),
      desc: getVal('#mDesc'),
      icon: iconValue,
      textIcon: textIconValue,
      uploadIcon: uploadIconValue,
      int: getVal('#mInt'),
      ext: getVal('#mExt')
    }

    // 创建请求数据，确保字段名与数据库一致
    const requestData = {
      id: link.id,
      name: getVal('#mName'),
      desc: getVal('#mDesc'),
      icon: iconValue,
      textIcon: textIconValue,
      uploadIcon: uploadIconValue,
      int: getVal('#mInt'),
      ext: getVal('#mExt')
    }
    fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
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