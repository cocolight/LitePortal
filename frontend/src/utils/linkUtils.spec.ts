/**
 * B4 回归测试：内网可达性探测（autoSelect）
 *
 * ★ 这组测试的存在意义：防止有人把探测逻辑改回「用 favicon 判断可达性」。
 * 该 bug 曾让 lucky / easynode / openwrt 等**无 favicon 的内网服务**被
 * 一律误判为不可达，点击图标错误地跳到公网地址。
 *
 * 因此每条用例都必须验证：
 *   1) 判据是**网络层可达性**，与 favicon 无关
 *   2) 不产生任何 favicon 请求
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { autoSelect } from '@/utils/linkUtils'

/** 记录 fetch 调用序列，用于断言「探测路径」 */
let calls: Array<{ url: string; method: string }>

const realFetch = globalThis.fetch
const realAbort = globalThis.AbortController

beforeEach(() => {
  calls = []
})

afterEach(() => {
  globalThis.fetch = realFetch
  globalThis.AbortController = realAbort
  vi.restoreAllMocks()
})

/**
 * 安装可控的 fetch。
 * @param mode ok=resolve；reject=网络失败；hang=永不 settle（须靠 signal 打断）
 */
function mockFetch(mode: 'ok' | 'reject' | 'hang') {
  globalThis.fetch = vi.fn((url: string, opts: { method?: string; signal?: AbortSignal }) => {
    calls.push({ url: String(url), method: opts.method ?? 'GET' })

    if (mode === 'ok') {
      // no-cors 探测拿到的是 opaque 响应，状态码为 0 且不可读
      return Promise.resolve({ type: 'opaque', status: 0 } as Response)
    }
    if (mode === 'reject') {
      return Promise.reject(new TypeError('Failed to fetch'))
    }
    // hang：真实 fetch 会被 AbortSignal 打断，mock 必须监听 signal 才忠实
    return new Promise((_, reject) => {
      const sig = opts.signal
      if (sig) {
        if (sig.aborted) return reject(new DOMException('Aborted', 'AbortError'))
        sig.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
      }
    })
  }) as unknown as typeof fetch
}

describe('autoSelect —— 地址缺省场景（不发起探测）', () => {
  it('内网地址为空 → 用外网地址，且完全不发起网络探测', async () => {
    mockFetch('ok')
    const result = await autoSelect('', 'https://ext.example.com')
    expect(result).toBe('https://ext.example.com')
    expect(calls).toHaveLength(0)
  })

  it('外网地址为空 → 直接用内网地址，不发起探测', async () => {
    mockFetch('ok')
    const result = await autoSelect('http://192.168.1.10:8080', '')
    expect(result).toBe('http://192.168.1.10:8080')
    expect(calls).toHaveLength(0)
  })

  it('两者都为空 → 返回空串（调用方据此不打开窗口）', async () => {
    mockFetch('ok')
    const result = await autoSelect('', '')
    expect(result).toBe('')
    expect(calls).toHaveLength(0)
  })
})

describe('autoSelect —— 可达性判定（B4 核心回归）', () => {
  it('内网可达且【无 favicon】→ 走内网地址（这是 B4 修复的核心场景）', async () => {
    mockFetch('ok')
    const result = await autoSelect('http://192.168.1.10:16601', 'https://ext.example.com')
    // 旧实现会把这里判成不可达并返回 extUrl
    expect(result).toBe('http://192.168.1.10:16601')
  })

  it('★ 探测请求绝不包含 favicon（保证与图标资源解耦）', async () => {
    mockFetch('ok')
    await autoSelect('http://192.168.1.10:16601', 'https://ext.example.com')
    expect(calls.length).toBeGreaterThan(0)
    for (const c of calls) {
      expect(c.url).not.toContain('favicon')
    }
  })

  it('★ 探测方法为 HEAD（不下载响应体，仅探活）', async () => {
    mockFetch('ok')
    await autoSelect('http://192.168.1.10:16601', 'https://ext.example.com')
    for (const c of calls) {
      expect(c.method).toBe('HEAD')
    }
  })

  it('内网不可达 → 回退外网地址', async () => {
    mockFetch('reject')
    const result = await autoSelect('http://192.168.99.99:8080', 'https://ext.example.com')
    expect(result).toBe('https://ext.example.com')
  })

  it('探测超时 → 回退外网地址（AbortController 生效）', async () => {
    mockFetch('hang')
    const result = await autoSelect('http://192.168.1.10:8080', 'https://ext.example.com')
    expect(result).toBe('https://ext.example.com')
  }, 10000)
})

describe('autoSelect —— scheme 处理', () => {
  it('裸地址优先尝试 http（内网服务常只跑 http，不能只探 https）', async () => {
    mockFetch('ok')
    await autoSelect('192.168.1.10:8080', 'https://ext.example.com')
    expect(calls[0].url).toBe('http://192.168.1.10:8080')
  })

  it('裸地址在 http 失败后会继续尝试 https', async () => {
    mockFetch('reject')
    await autoSelect('192.168.1.10:8080', 'https://ext.example.com')
    expect(calls.map((c) => c.url)).toEqual([
      'http://192.168.1.10:8080',
      'https://192.168.1.10:8080',
    ])
  })

  it('带 scheme 的地址只探测一次，不重复尝试', async () => {
    mockFetch('ok')
    await autoSelect('http://192.168.1.10:8080', 'https://ext.example.com')
    expect(calls).toHaveLength(1)
  })

  it('地址末尾多余斜杠不会造成双斜杠请求', async () => {
    mockFetch('ok')
    await autoSelect('http://192.168.1.10:8080/', 'https://ext.example.com')
    expect(calls[0].url).toBe('http://192.168.1.10:8080')
  })
})

describe('autoSelect —— 优雅降级', () => {
  it('环境不支持 fetch → 回退外网地址而非抛错', async () => {
    // @ts-expect-error 刻意模拟浏览器过旧、无 fetch 的环境
    delete globalThis.fetch
    const result = await autoSelect('http://192.168.1.10:8080', 'https://ext.example.com')
    expect(result).toBe('https://ext.example.com')
  })
})
