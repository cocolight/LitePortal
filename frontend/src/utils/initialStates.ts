import type { LinkStoreState } from "@/types"

export const initialLinkStoreState = (): LinkStoreState => ({
  links: [],
  loading: false,
  error: null,
})