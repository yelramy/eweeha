import { NextRequest } from 'next/server'
import { generateOgImageBuffer } from '@/lib/generateOgImage'

export const revalidate = 86400

/**
 * Dynamic OG image — optional title/subtitle/badge query params.
 * Example: /og-image?title=Bridal%20Car&subtitle=Beirut%20Weddings
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const title = searchParams.get('title') || 'Eweeha!'
    const subtitle = searchParams.get('subtitle') || 'WEDDING CARS IN LEBANON'
    const badge =
      searchParams.get('badge') ||
      'Chauffeur included · Bridal cars · Full convoys · All Lebanon'

    const { buffer, contentType } = await generateOgImageBuffer({
      title,
      subtitle,
      badge,
    })

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      },
    })
  } catch (error) {
    console.error('Error generating OG image:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}
