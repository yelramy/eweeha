/** Cloudinary URL helpers for fleet / vehicle images */

const FLEET_THUMB_TRANSFORM = 'c_fit,w_900,h_675,g_center,q_auto,f_auto'

/**
 * Fit the full car inside the card frame (no aggressive crop).
 */
export function fleetCardImageUrl(url: string): string {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) {
    return url
  }
  if (url.includes(FLEET_THUMB_TRANSFORM)) return url
  return url.replace('/upload/', `/upload/${FLEET_THUMB_TRANSFORM}/`)
}

/**
 * Detail page hero — slightly larger fit box.
 */
export function fleetHeroImageUrl(url: string): string {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) {
    return url
  }
  return url.replace('/upload/', '/upload/c_fit,w_1200,h_900,g_center,q_auto,f_auto/')
}
