/**
 * 链接可达性工具
 */

/** 内网地址探测超时（毫秒） */
const PROBE_TIMEOUT = 1500

/**
 * 生成候选地址：用户输入可能带 scheme，也可能只填 `192.168.1.2:8080` 这类裸地址。
 * 裸地址同时尝试 http 与 https —— 内网服务（lucky / openwrt 等）常常只跑 http，
 * 若只探测 https 会把它们误判为不可达。
 */
function candidateUrls(url: string): string[] {
  const trimmed = url.trim()
  const bare = trimmed.replace(/\/+$/, '')
  if (bare.startsWith('http://') || bare.startsWith('https://')) {
    return [bare]
  }
  return [`http://${bare}`, `https://${bare}`]
}

/**
 * 探测内网地址是否可达（网络层）。
 *
 * ★ 与历史实现的差异：旧实现用 `new Image()` 加载 `${intUrl}/favicon.ico`
 * 来判断可达性，等价于把「有没有 favicon」当成「服务通不通」，
 * 于是 lucky / easynode / openwrt 等**不提供 favicon 的内网服务**一律被判为
 * 不可达，点击图标时会错误地跳到公网地址。
 *
 * 现在改用 `fetch` 的 `no-cors` 模式探测：只要网络层能建立连接就 resolve
 * （返回 opaque 响应，状态码不可见也不关心），连接失败才 reject。
 * 判定依据从「有无图标资源」变为「网络层可达性」，与图标资源完全解耦。
 */
async function isReachable(url: string, timeout: number = PROBE_TIMEOUT): Promise<boolean> {
  // 浏览器过旧或环境不支持 fetch 时，视为不可达（交由调用方回退外网）
  if (typeof fetch !== 'function') return false

  // 裸地址要试 http / https 两种 scheme，任一可达即算可达
  for (const candidate of candidateUrls(url)) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)

    try {
      await fetch(candidate, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal,
      })
      return true
    } catch {
      // 连接被拒绝 / 超时 / 混合内容拦截 / 证书问题 → 试下一个候选
    } finally {
      clearTimeout(timer)
    }
  }

  return false
}

/**
 * 自动选择点击图标时要打开的地址。
 *
 * 规则：内网地址存在且网络层可达 → 用内网；否则回退外网地址。
 * 内网为空时直接用外网，外网为空时直接用内网。
 */
export async function autoSelect(intUrl: string, extUrl: string): Promise<string> {
  // 内网地址为空 → 只能用外网
  if (!intUrl) return extUrl

  // 外网地址为空 → 只能走内网，无需探测
  if (!extUrl) return intUrl

  // 内网可达 → 局域网内打开内网地址（不依赖该服务是否提供 favicon）
  if (await isReachable(intUrl)) return intUrl

  return extUrl
}
