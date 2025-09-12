// src/utils/iconUtils.ts

/**
 * 生成文字图标的SVG Data URL
 * @param char - 要显示的字符（建议1-2个字符）
 * @param options - 配置项（可选）
 */
export const generateTextSvg = (
  char: string,
  options?: {
    bgColor?: string
    textColor?: string
    shape?: 'circle' | 'rect'
    fontSize?: number
  }
) => {
  const {
    bgColor = '#f5f5f5',
    textColor = '#333',
    shape = 'rect',
    fontSize = 60
  } = options || {}

  const isCJK = /[\u4e00-\u9fa5\u3040-\u30ff\u3130-\u318f\uac00-\ud7af]/.test(char)
  const yPos = isCJK ? '58%' : '62%'
  const finalFontSize = isCJK ? fontSize * 0.93 : fontSize

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      ${shape === 'circle'
        ? `<circle cx="50" cy="50" r="45" fill="${bgColor}"/>`
        : `<rect width="100%" height="100%" rx="15" fill="${bgColor}"/>`
      }
      <text
        x="50%"
        y="${yPos}"
        font-size="${finalFontSize}"
        font-family="Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif"
        text-anchor="middle"
        fill="${textColor}"
        font-weight="bold"
        dominant-baseline="middle"
      >
        ${encodeURIComponent(char)}
      </text>
    </svg>
  `

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
