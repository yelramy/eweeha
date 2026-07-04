import { NextResponse } from 'next/server'
import { siteConfig } from '@/lib/seoManager'
import vehicles from '@/lib/vehicles'

/**
 * Image Sitemap Generator
 * Helps search engines discover and index images
 */
export async function GET() {
  try {
    const baseUrl = siteConfig.url
    const allVehicles = await vehicles.getAll()

    // Collect all images from vehicles
    const imageEntries: Array<{
      loc: string
      images: Array<{
        loc: string
        title?: string
        caption?: string
      }>
    }> = []

    // Add vehicle images
    for (const vehicle of allVehicles) {
      const vehicleUrl = `${baseUrl}/fleet/${vehicle.slug}`

      const vehicleImages: Array<{ loc: string; title?: string; caption?: string }> = []

      // Main image
      if (vehicle.images?.main) {
        vehicleImages.push({
          loc: vehicle.images.main.startsWith('http') 
            ? vehicle.images.main 
            : `${baseUrl}${vehicle.images.main}`,
          title: vehicle.name,
          caption: `${vehicle.name} - ${vehicle.capacity || vehicle.specifications?.seating || 'Multiple seating options'}`
        })
      }

      // Gallery images
      if (vehicle.images?.gallery && vehicle.images.gallery.length > 0) {
        vehicle.images.gallery.forEach((image: string) => {
          vehicleImages.push({
            loc: image.startsWith('http') ? image : `${baseUrl}${image}`,
            title: vehicle.name,
            caption: `${vehicle.name} interior/exterior view`
          })
        })
      }

      if (vehicleImages.length > 0) {
        imageEntries.push({
          loc: vehicleUrl,
          images: vehicleImages
        })
      }
    }

    // Add homepage brand images
    imageEntries.push({
      loc: baseUrl,
      images: [
        {
          loc: `${baseUrl}/logo.png`,
          title: 'Eweeha — Wedding Cars Lebanon',
          caption: 'Wedding car rental with chauffeur across Lebanon'
        }
      ]
    })

    // Generate XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${imageEntries.map(entry => `  <url>
    <loc>${escapeXml(entry.loc)}</loc>
${entry.images.map(image => `    <image:image>
      <image:loc>${escapeXml(image.loc)}</image:loc>
${image.title ? `      <image:title>${escapeXml(image.title)}</image:title>` : ''}
${image.caption ? `      <image:caption>${escapeXml(image.caption)}</image:caption>` : ''}
    </image:image>`).join('\n')}
  </url>`).join('\n')}
</urlset>`

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    })
  } catch (error) {
    console.error('Error generating image sitemap:', error)
    return new NextResponse('Error generating image sitemap', { status: 500 })
  }
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '&': return '&amp;'
      case '\'': return '&apos;'
      case '"': return '&quot;'
      default: return c
    }
  })
}

