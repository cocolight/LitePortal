
export async function autoSelect(intUrl: string, extUrl: string): Promise<string> {
  // 如果内网地址为空，直接使用外网地址
  if (!intUrl) return extUrl

  // 如果外网地址为空，直接使用内网地址
  if (!extUrl) return intUrl

  try {
    // 尝试通过创建一个 Image 对象来检测内网地址是否可访问
    return new Promise((resolve) => {
      const img = new Image()
      const timeout = setTimeout(() => {
        resolve(extUrl) // 超时则使用外网地址
      }, 1000)

      img.onload = () => {
        clearTimeout(timeout)
        resolve(intUrl) // 加载成功使用内网地址
      }

      img.onerror = () => {
        clearTimeout(timeout)
        resolve(extUrl) // 加载失败使用外网地址
      }

      // 设置图片源，尝试加载内网地址的 favicon
      const url = intUrl.startsWith('http') ? intUrl : `https://${intUrl}`
      img.src = `${url}/favicon.ico?t=${Date.now()}`
    })
  } catch {
    return extUrl
  }
}