import { autoSelect } from '@/utils/linkUtils'
import type { Link } from '@/types'

export function useLinks() {

  const openLink = async (link: Link): Promise<void> => {
    const url = await autoSelect(link.int, link.ext)
    if (url) {
      url && window.open(url, '_blank')
    }
  }

  return {
    openLink
  }
}