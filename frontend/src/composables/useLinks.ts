import { autoSelect } from '@/utils/linkUtils'
import type { Link } from '@/types'

export function useLinks() {

  const openLink = async (link: Link): Promise<void> => {
    // intUrl / extUrl 在 LinkBase 中是可选字段，这里补空串：
    // autoSelect 内部本就按「空串即缺省」处理早退，语义一致
    const url = await autoSelect(link.intUrl ?? '', link.extUrl ?? '')
    if (url) {
      window.open(url, '_blank')
    }
  }

  return {
    openLink
  }
}