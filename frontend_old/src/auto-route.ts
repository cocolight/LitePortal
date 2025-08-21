export async function autoSelect(intUrl: string, extUrl: string): Promise<string> {
  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), 1000)
    await fetch(intUrl, { method: 'HEAD', mode: 'no-cors', signal: controller.signal })
    clearTimeout(id)
    return intUrl
  } catch {
    return extUrl
  }
}