import { ImageResponse } from 'next/og'
import { OgImageCard } from '@/lib/og-image-template'
import { loadOgImageAssets } from '@/lib/ogImageAssets'

/**
 * Default Open Graph image (1200x630)
 * Referenced as /og-image.jpg for social sharing and JSON-LD.
 */

export const revalidate = 86400

export async function GET() {
  const { logoSrc, heroSrc } = await loadOgImageAssets()

  return new ImageResponse(
    (
      <OgImageCard
        logoSrc={logoSrc}
        heroSrc={heroSrc}
        title="Eweeha!"
        subtitle="Wedding Cars in Lebanon"
        badge="Chauffeur included · Bridal cars · Full convoys · All Lebanon"
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
}
