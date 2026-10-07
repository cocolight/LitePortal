// src/utils/iconUtils.ts

/** 匹配 CJK 字符（中日韩），用于微调字号与基线 */
const CJK_RE = /[\u4e00-\u9fa5\u3040-\u30ff\u3130-\u318f\uac00-\ud7af]/

/** XML 文本节点转义：& < > 必须转义，否则会被解析器误认为标签或实体起始 */
const escapeXml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * 生成文字图标的 SVG Data URL。
 *
 * ★ 曾经的双重编码缺陷（B3）：旧实现在 `<text>` 内先对字符做一次
 * `encodeURIComponent`，随后又把整段 SVG 做第二次 `encodeURIComponent`，
 * 于是 `中` → `%E4%B8%AD` → `%25E4%25B8%25AD`。浏览器解码 data URL 时
 * 只解一层，SVG 文本节点里剩下的是**字面量** `%E4%B8%AD`，
 * 渲染出来就成了 `%B8` 这类乱码。
 *
 * 正确做法：SVG 源文本中直接写原始字符（仅做 XML 转义），
 * 只在构造 data URL 时编码**一次**。
 *
 * @param char - 要显示的字符（建议 1-2 个字符）
 * @param options - 配置项（可选）
 */
export const generateTextSvg = (
  char: string,
  options?: {
    bgColor?: string
    textColor?: string
    shape?: 'circle' | 'rect'
    fontSize?: number
  },
) => {
  const { bgColor = '#f5f5f5', textColor = '#333', shape = 'rect', fontSize = 60 } = options || {}

  const isCJK = CJK_RE.test(char)
  const yPos = isCJK ? '58%' : '62%'
  const finalFontSize = isCJK ? fontSize * 0.93 : fontSize

  const shapeEl =
    shape === 'circle'
      ? `<circle cx="50" cy="50" r="45" fill="${bgColor}"/>`
      : `<rect width="100%" height="100%" rx="15" fill="${bgColor}"/>`

  // SVG 源文本内保留原始字符，整段只在返回时编码一次
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">` +
    shapeEl +
    `<text x="50%" y="${yPos}" font-size="${finalFontSize}"` +
    ` font-family="Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif"` +
    ` text-anchor="middle" fill="${textColor}" font-weight="bold"` +
    ` dominant-baseline="middle">${escapeXml(char)}</text>` +
    `</svg>`

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/**
 * 从文字图标的输入中取出要渲染的那个字符。
 *
 * 统一 Card（首页图标）与 IconPreview（编辑弹窗预览）两处的截取规则，
 * 避免同一条数据在两处显示成不同字符。
 *
 * 规则：
 *  1. 取首个字符——中文单字本身就是完整语义单元，不做大小写转换
 *     （`toUpperCase()` 对 CJK 无影响，但会让 `a` 显示成 `A`，
 *      与用户输入不一致；`ß` → `SS` 更会凭空多出一个字符）。
 *  2. 输入为空时回退到 `fallback`（通常是链接名称），仍为空则用 `A`。
 */
export function pickTextIconChar(text: string | undefined, fallback?: string): string {
  const source = (text || '').trim()
  if (source) return Array.from(source)[0]
  const fb = (fallback || '').trim()
  return fb ? Array.from(fb)[0] : 'A'
}
