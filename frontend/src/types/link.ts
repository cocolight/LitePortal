// frontend/src/types/link.ts
// export type IconType = 'online_icon' | 'text_icon' | 'upload_icon'

export enum IconType {
  online_icon = 'online_icon',
  text_icon = 'text_icon',
  upload_icon = 'upload_icon'
}

export interface LinkBase {
  name: string
  icon?: string
  textIcon?: string
  uploadIcon?: string
  iconType?: IconType
  int: string
  ext: string
  desc?: string
}

export interface Link extends LinkBase{
  id?: string | number
}

export const DEFAULT_LINK: LinkBase = {
  name: '',
  icon: '',
  textIcon: '',
  uploadIcon: '',
  iconType: IconType.online_icon,
  int: '',
  ext: '',
  desc: ''
}
