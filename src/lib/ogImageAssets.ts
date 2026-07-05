import { promises as fs } from 'fs'
import path from 'path'

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  svg: 'image/svg+xml',
}

export async function loadPublicAsset(relativePath: string): Promise<string | null> {
  try {
    const filePath = path.join(process.cwd(), 'public', relativePath)
    const file = await fs.readFile(filePath)
    const ext = path.extname(relativePath).slice(1).toLowerCase()
    const mime = MIME_BY_EXT[ext] ?? 'application/octet-stream'
    return `data:${mime};base64,${file.toString('base64')}`
  } catch {
    return null
  }
}

export async function loadOgImageAssets() {
  const [logoSrc, heroSrc] = await Promise.all([
    loadPublicAsset('logo.png'),
    loadPublicAsset('images/hero-bg.jpg'),
  ])

  return { logoSrc, heroSrc }
}
