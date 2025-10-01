// frontend/src/types/link.ts
// export type IconType = 'online_icon' | 'text_icon' | 'upload_icon'

export enum IconType {
  onlineIcon = 'online_icon',
  textIcon = 'text_icon',
  uploadIcon = 'upload_icon',
  paidIcon = 'paid_icon',
}

export interface LinkBase {
  name?: string
  onlineIcon?: string
  textIcon?: string
  uploadIcon?: string
  paidIcon?: string
  iconType?: IconType
  intUrl?: string
  extUrl?: string
  desc?: string
}

export interface Link extends LinkBase{
  linkId: string
}

export const DEFAULT_LINK: Link = {
  linkId: '',
  name: '',
  onlineIcon: '',
  textIcon: '',
  uploadIcon: '',
  paidIcon: '',
  iconType: IconType.onlineIcon,
  intUrl: '',
  extUrl: '',
  desc: ''
}
