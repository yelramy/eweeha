/**
 * Server Component: Fetches SEO settings and provides tracking scripts
 */

import { getSeoSettings } from '@/lib/seoManager'
import { TrackingScripts } from './Analytics'

export async function TrackingProvider() {
  const seoSettings = await getSeoSettings()

  if (!seoSettings?.googleAnalyticsId && !seoSettings?.facebookPixelId) {
    return null
  }

  return (
    <TrackingScripts
      googleAnalyticsId={seoSettings.googleAnalyticsId}
      facebookPixelId={seoSettings.facebookPixelId}
    />
  )
}


