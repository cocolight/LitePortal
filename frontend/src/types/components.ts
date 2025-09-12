// frontend/src/types/components.ts
import type { Link } from './link'

// CardGrid 组件的 Props 接口
export interface CardGridProps {
  links: Link[]
  loading: boolean
  error: string | null
}

// Card 组件的 Props 接口
export interface CardProps {
  link?: Link
  isAddCard?: boolean
}


// ContextMenu 组件的 Props 接口
// export interface ContextMenuProps {
//   x: number
//   y: number
//   visible: boolean
//   linkData?: ContextMenuLinkData
// }


