import type { IconType, Link, LinkBase } from './link'
import { ComputedRef } from 'vue'

export interface LinkStoreState {
  links: Link[]
  loading: boolean
  error: string | null
  message: string | null
}

export interface LinkStoreGetters {
    links: ComputedRef<Link[]>
    loading: ComputedRef<boolean>
    error: ComputedRef<string | null>
    linkCount: ComputedRef<number>
    getLinkById: (linkId: string | number)=> ComputedRef<Link | undefined>
    getLinkByIntExt: (int: string, ext: string)=> ComputedRef<Link | undefined>
    getAllIconTypes: ()=> ComputedRef<IconType[]>
}

export interface LinkStoreActions {
  fetchLinks: ()=> Promise<void>
  addLink: (link: LinkBase)=> Promise<boolean>
  updateLink:(link: Link)=> Promise<boolean>
  deleteLink:(link: Link)=> Promise<boolean>
  clearError: ()=> void
  resetState: ()=> void
}
