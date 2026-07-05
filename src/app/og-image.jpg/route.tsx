import { generateOgImageBuffer } from '@/lib/generateOgImage'

/**
 * Default Open Graph image (1200×630 JPEG, under WhatsApp's 600KB limit).
 */

export const revalidate = 86400

export async function GET() {
  const { buffer, contentType } = await generateOgImageBuffer()

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': 'inline',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
    },
  })
}
