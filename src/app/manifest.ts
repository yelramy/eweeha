import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Eweeha - Wedding Cars Lebanon',
    short_name: 'Eweeha',
    description: 'Wedding car rental in Lebanon with chauffeur: bridal cars, classics, convertibles, and full wedding cortège convoys. Book online.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFEF9',
    theme_color: '#9C7838',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    categories: ['weddings', 'transportation', 'lifestyle'],
    lang: 'en-US',
    dir: 'ltr',
    orientation: 'portrait-primary',
  }
}

