/**
 * B3 回归测试：文字图标（含中文）的 SVG 生成
 *
 * ★ 这组测试的存在意义：防止有人把生成逻辑改回「双层 encodeURIComponent」。
 * 旧实现在 `<text>` 内先编码一次字符，整段 SVG 又编码一次，于是
 *   `中` → `%E4%B8%AD` → `%25E4%25B8%25AD`
 * 浏览器解 data URL 时只解一层，SVG 文本节点里留下字面量 `%E4%B8%AD`，
 * 渲染出来就是 `%B8` 这类乱码。
 *
 * 因此每条用例都必须验证：**编码恰好发生一次**，且解码后 SVG 文本节点
 * 里的内容与原始字符逐字相等。
 */
import { describe, it, expect } from 'vitest'
import { generateTextSvg, pickTextIconChar, toProxiedIconUrl } from '@/utils/iconUtils'

/** 解开 data URL 的百分号编码，还原出 SVG 源文本 */
function decodeDataUrl(dataUrl: string): string {
  const comma = dataUrl.indexOf(',')
  return decodeURIComponent(dataUrl.slice(comma + 1))
}

/** 取出 <text> 元素的文本内容 */
function textContent(svg: string): string {
  const match = svg.match(/<text[\s\S]*?>([\s\S]*?)<\/text>/)
  if (!match) throw new Error(`no <text> node in: ${svg}`)
  return match[1]
}

describe('generateTextSvg —— data URL 基本形态', () => {
  it('返回 image/svg+xml 的 data URL 且显式声明 utf-8', () => {
    const url = generateTextSvg('A')
    expect(url.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true)
  })

  it('解码后是一段合法的 <svg> 文档', () => {
    const svg = decodeDataUrl(generateTextSvg('A'))
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg.endsWith('</svg>')).toBe(true)
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"')
    expect(svg).toContain('viewBox="0 0 100 100"')
  })
})

describe('generateTextSvg —— B3 核心：中文不得出现乱码（禁止双层编码）', () => {
  it('★ 中文单字解码后文本节点与原文逐字相等', () => {
    const svg = decodeDataUrl(generateTextSvg('中'))
    expect(textContent(svg)).toBe('中')
  })

  it('★ 文本节点中不含任何残留的百分号编码（双层编码的直接特征）', () => {
    const svg = decodeDataUrl(generateTextSvg('中'))
    expect(textContent(svg)).not.toContain('%')
    expect(svg).not.toContain('%E4%B8%AD') // 未解码的 UTF-8 序列字面量
  })

  it('★ 中文不会被渲染成 %B8 这类乱码（实测截图中的错误形态）', () => {
    const svg = decodeDataUrl(generateTextSvg('中文'))
    expect(textContent(svg)).not.toMatch(/%[0-9A-Fa-f]{2}/)
  })

  it('日文 / 韩文同样无损', () => {
    for (const ch of ['あ', 'ア', '한', '글']) {
      expect(textContent(decodeDataUrl(generateTextSvg(ch)))).toBe(ch)
    }
  })

  it('ASCII 字母数字不受影响', () => {
    for (const ch of ['A', 'z', '7']) {
      expect(textContent(decodeDataUrl(generateTextSvg(ch)))).toBe(ch)
    }
  })
})

describe('generateTextSvg —— XML 转义（防注入 / 防解析错乱）', () => {
  it('& 被转义为 &amp;，解码后仍可还原为原字符', () => {
    const svg = decodeDataUrl(generateTextSvg('&'))
    expect(textContent(svg)).toBe('&amp;')
  })

  it('< 被转义，不会破坏 SVG 结构', () => {
    const svg = decodeDataUrl(generateTextSvg('<'))
    expect(textContent(svg)).toBe('&lt;')
    // <text> 仍正常闭合，未产生多余标签
    expect(svg.match(/<text/g)).toHaveLength(1)
  })

  it('> 被转义', () => {
    expect(textContent(decodeDataUrl(generateTextSvg('>')))).toBe('&gt;')
  })
})

describe('generateTextSvg —— CJK 自适应排版', () => {
  it('CJK 字号略小于默认（0.93 倍）以适配方块字', () => {
    const cjk = decodeDataUrl(generateTextSvg('中'))
    const latin = decodeDataUrl(generateTextSvg('A'))
    expect(cjk).toContain('font-size="55.800000000000004"')
    expect(latin).toContain('font-size="60"')
  })

  it('CJK 与西文使用不同的垂直基线', () => {
    expect(decodeDataUrl(generateTextSvg('中'))).toContain('y="58%"')
    expect(decodeDataUrl(generateTextSvg('A'))).toContain('y="62%"')
  })

  it('字号可通过 options 覆盖，且 CJK 仍按比例缩放', () => {
    expect(decodeDataUrl(generateTextSvg('A', { fontSize: 80 }))).toContain('font-size="80"')
    expect(decodeDataUrl(generateTextSvg('中', { fontSize: 80 }))).toContain('font-size="74.4"')
  })
})

describe('generateTextSvg —— 形状与颜色选项', () => {
  it('默认使用圆角矩形', () => {
    const svg = decodeDataUrl(generateTextSvg('A'))
    expect(svg).toContain('<rect')
    expect(svg).not.toContain('<circle')
  })

  it('shape=circle 时改用圆', () => {
    const svg = decodeDataUrl(generateTextSvg('A', { shape: 'circle' }))
    expect(svg).toContain('<circle cx="50" cy="50" r="45"')
    expect(svg).not.toContain('<rect')
  })

  it('背景色与文字色可覆盖', () => {
    const svg = decodeDataUrl(generateTextSvg('A', { bgColor: '#ff0000', textColor: '#ffffff' }))
    expect(svg).toContain('fill="#ff0000"')
    expect(svg).toContain('fill="#ffffff"')
  })

  it('缺省配色稳定（防止误改默认值）', () => {
    const svg = decodeDataUrl(generateTextSvg('A'))
    expect(svg).toContain('fill="#f5f5f5"')
    expect(svg).toContain('fill="#333"')
  })
})

describe('pickTextIconChar —— Card 与 IconPreview 共享的截取规则', () => {
  it('取首个字符', () => {
    expect(pickTextIconChar('中文')).toBe('中')
    expect(pickTextIconChar('ab')).toBe('a')
  })

  it('★ 不做大小写转换（旧 IconPreview 用 toUpperCase，与 Card 显示不一致）', () => {
    expect(pickTextIconChar('a')).toBe('a')
    expect(pickTextIconChar('z')).toBe('z')
  })

  it('★ 不会把 ß 变成两字符（toUpperCase 会产生 "SS"）', () => {
    const out = pickTextIconChar('ß')
    expect(out).toBe('ß')
    expect(out).toHaveLength(1)
  })

  it('★ emoji 等代理对按整字符截取，不产生半个码点', () => {
    expect(pickTextIconChar('😀x')).toBe('😀')
    expect(Array.from(pickTextIconChar('😀x'))).toHaveLength(1)
  })

  it('输入为空时回退到 fallback（通常是链接名称）', () => {
    expect(pickTextIconChar('', '个人博客')).toBe('个')
    expect(pickTextIconChar(undefined, 'LitePortal')).toBe('L')
  })

  it('输入与 fallback 都为空时回退到 A', () => {
    expect(pickTextIconChar('')).toBe('A')
    expect(pickTextIconChar(undefined, '')).toBe('A')
    expect(pickTextIconChar('   ', '  ')).toBe('A')
  })

  it('忽略首尾空白', () => {
    expect(pickTextIconChar('  中  ')).toBe('中')
  })
})

/**
 * F8 回归测试：在线图标地址的后端代理改写
 *
 * 这组测试锁定两件事：
 *   1. http/https 远程图标必须被改写成 /icons/proxy?url=... （否则不经过缓存）；
 *   2. 内联数据与相对路径必须原样返回（data URI 不应被二次代理）。
 */
describe('toProxiedIconUrl —— 在线图标代理改写（F8）', () => {
  it('http/https 地址被改写为 /icons/proxy 且原地址被编码', () => {
    const out = toProxiedIconUrl('https://api.iconify.design/mdi:web.svg')
    expect(out).toContain('/icons/proxy?url=')
    expect(out).toContain(encodeURIComponent('https://api.iconify.design/mdi:web.svg'))
  })

  it('改写后不含未编码的原始 URL（避免 ? & 破坏查询串）', () => {
    const raw = 'https://a.com/i.png?a=1&b=2'
    const out = toProxiedIconUrl(raw)
    expect(out).not.toContain(raw)
    expect(out).toContain(encodeURIComponent(raw))
  })

  it('http 与 https 均被代理', () => {
    expect(toProxiedIconUrl('http://a.com/i.ico')).toContain('/icons/proxy?url=')
    expect(toProxiedIconUrl('https://a.com/i.ico')).toContain('/icons/proxy?url=')
  })

  it('★ data URI 原样返回，不被代理', () => {
    const dataUri = 'data:image/svg+xml;charset=utf-8,%3Csvg%3E%3C%2Fsvg%3E'
    expect(toProxiedIconUrl(dataUri)).toBe(dataUri)
  })

  it('★ blob 与相对路径原样返回', () => {
    expect(toProxiedIconUrl('blob:http://localhost/abc')).toBe('blob:http://localhost/abc')
    expect(toProxiedIconUrl('/assets/local.svg')).toBe('/assets/local.svg')
  })

  it('空值返回空字符串（调用方据此回退默认图标）', () => {
    expect(toProxiedIconUrl('')).toBe('')
    expect(toProxiedIconUrl(undefined)).toBe('')
  })
})
