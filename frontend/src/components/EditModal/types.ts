import type { Link } from '@/types'
import { IconType } from '@/types'

// EditModal 组件的 Props 接口
export interface EditModalProps {
  visible?: boolean
  link?: Link
}

export interface IcomPreviewProps {
    isEdit?: boolean
    onlineIcon?: string
    textIcon?: string
    uploadIcon?: string
    paidIcon?: string
    iconType: IconType
}