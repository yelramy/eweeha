/**
 * Server Component: Fetches SEO settings and provides tracking scripts
 */

import { getSeoSettings, siteConfig } from '@/lib/seoManager'
import { TrackingScripts } from './Analytics'

export async function TrackingProvider() {
  const seoSettings = await getSeoSettings()
  // Previews and local dev must not report into the live Analytics property.
  const googleAnalyticsId =
    seoSettings?.googleAnalyticsId ||
    (process.env.VERCEL_ENV === 'production' ? siteConfig.googleAnalyticsId : undefined)
  const facebookPixelId = seoSettings?.facebookPixelId

  if (!googleAnalyticsId && !facebookPixelId) {
    return null
  }

  return (
    <TrackingScripts
      googleAnalyticsId={googleAnalyticsId}
      facebookPixelId={facebookPixelId}
    />
  )
}
