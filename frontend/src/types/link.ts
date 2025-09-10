// frontend/src/types/link.ts
export interface Link {
  id?: string | number
  name: string
  icon?: string
  textIcon?: string
  uploadIcon?: string
  iconType?: 'online_icon' | 'text_icon' | 'upload_icon'
  int: string
  ext: string
  desc?: string
}
