import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Eweeha — Wedding Cars Lebanon',
    short_name: 'Eweeha',
    description:
      'Wedding car rental in Lebanon with chauffeur: bridal cars, classics, convertibles, and full wedding convoys. Book online or WhatsApp.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#FFFEF9',
    theme_color: '#742F38',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['weddings', 'transportation', 'lifestyle'],
    lang: 'en-US',
    dir: 'ltr',
    orientation: 'portrait-primary',
  }
}
