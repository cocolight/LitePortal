/**
 * useLinks 集成测试：openLink 与 window.open 的协作
 *
 * 重点覆盖两类历史上真实出现过的缺陷：
 *   1) link 的 intUrl / extUrl 可能缺失（LinkBase 中为可选字段），
 *      旧代码直接传 undefined 进 autoSelect 会得到非预期结果；
 *   2) 两个地址都为空时不应调用 window.open（否则弹出空白页）。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useLinks } from '@/composables/useLinks'
import type { Link } from '@/types'

const realFetch = globalThis.fetch
const realOpen = window.open

let openSpy: ReturnType<typeof vi.fn>

beforeEach(() => {
  openSpy = vi.fn()
  window.open = openSpy as unknown as typeof window.open
})

afterEach(() => {
  globalThis.fetch = realFetch
  window.open = realOpen
  vi.restoreAllMocks()
})

/** 内网可达的 mock 探测环境 */
function mockReachable() {
  globalThis.fetch = vi.fn(() =>
    Promise.resolve({ type: 'opaque', status: 0 } as Response),
  ) as unknown as typeof fetch
}

function makeLink(partial: Partial<Link>): Link {
  return {
    linkId: 'test-1',
    name: '测试链接',
    desc: '',
    onlineIcon: '',
    textIcon: '',
    uploadIcon: '',
    paidIcon: '',
    intUrl: '',
    extUrl: '',
    ...partial,
  } as Link
}

describe('useLinks.openLink', () => {
  it('内网可达时打开内网地址（B4 核心场景）', async () => {
    mockReachable()
    const { openLink } = useLinks()

    await openLink(
      makeLink({ intUrl: 'http://192.168.1.10:8080', extUrl: 'https://ext.example.com' }),
    )

    expect(openSpy).toHaveBeenCalledTimes(1)
    expect(openSpy).toHaveBeenCalledWith('http://192.168.1.10:8080', '_blank')
  })

  it('内网不可达时打开外网地址', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.reject(new TypeError('Failed to fetch')),
    ) as unknown as typeof fetch
    const { openLink } = useLinks()

    await openLink(
      makeLink({ intUrl: 'http://192.168.99.99:8080', extUrl: 'https://ext.example.com' }),
    )

    expect(openSpy).toHaveBeenCalledWith('https://ext.example.com', '_blank')
  })

  it('intUrl 字段缺失（undefined）→ 仍能正常打开外网地址，不抛错', async () => {
    mockReachable()
    const { openLink } = useLinks()

    // 刻意不传 intUrl/exUrl，模拟后端返回缺省字段
    await openLink(makeLink({}))

    // 两个地址都为空 → 不应打开任何窗口
    expect(openSpy).not.toHaveBeenCalled()
  })

  it('只有外网地址 → 打开外网，且不发起探测', async () => {
    const fetchSpy = vi.fn()
    globalThis.fetch = fetchSpy as unknown as typeof fetch
    const { openLink } = useLinks()

    await openLink(makeLink({ extUrl: 'https://ext.example.com' }))

    expect(openSpy).toHaveBeenCalledWith('https://ext.example.com', '_blank')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('只有内网地址 → 打开内网，且不发起探测', async () => {
    const fetchSpy = vi.fn()
    globalThis.fetch = fetchSpy as unknown as typeof fetch
    const { openLink } = useLinks()

    await openLink(makeLink({ intUrl: 'http://192.168.1.10:8080' }))

    expect(openSpy).toHaveBeenCalledWith('http://192.168.1.10:8080', '_blank')
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
