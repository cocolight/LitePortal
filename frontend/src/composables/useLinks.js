import { useLinkStore } from '../stores/linkStore'

export async function autoSelect(intUrl, extUrl) {
  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), 1000)
    await fetch(intUrl, { 
      method: 'HEAD', 
      mode: 'no-cors', 
      signal: controller.signal 
    })
    clearTimeout(id)
    return intUrl
  } catch {
    return extUrl
  }
}

export function useLinks() {
  const linkStore = useLinkStore()
  
  const openLink = async (link) => {
    const url = await autoSelect(link.int, link.ext)
    if (url) {
      window.open(url, '_blank')
    }
  }
  
  return {
    links: linkStore.getLinks,
    loading: linkStore.isLoading,
    error: linkStore.getError,
    fetchLinks: linkStore.fetchLinks,
    addLink: linkStore.addLink,
    updateLink: linkStore.updateLink,
    deleteLink: linkStore.deleteLink,
    openLink
  }
}
