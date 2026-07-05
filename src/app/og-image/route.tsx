import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { OgImageCard } from '@/lib/og-image-template'
import { loadOgImageAssets } from '@/lib/ogImageAssets'

export const revalidate = 86400

/**
 * Dynamic OG image — same premium template with optional title/subtitle overrides.
 * Example: /og-image?title=Bridal%20Car&subtitle=Beirut%20Weddings
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const title = searchParams.get('title') || 'Eweeha!'
    const subtitle = searchParams.get('subtitle') || 'Wedding Cars in Lebanon'
    const badge =
      searchParams.get('badge') ||
      'Chauffeur included · Bridal cars · Full convoys · All Lebanon'

    const { logoSrc, heroSrc } = await loadOgImageAssets()

    return new ImageResponse(
      (
        <OgImageCard
          logoSrc={logoSrc}
          heroSrc={heroSrc}
          title={title}
          subtitle={subtitle}
          badge={badge}
        />
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
        },
      }
    )
  } catch (error) {
    console.error('Error generating OG image:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}
