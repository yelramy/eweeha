import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cached } from '@/lib/cache'
import VehicleDetailClient from './VehicleDetailClient'
import { formatUsd, getVehiclePricingInfo } from '@/utils/vehiclePricing'
import { getVehicleReviews, getVehicleRatingStats } from '@/lib/reviews'

// ISR: Revalidate every 10 minutes
export const revalidate = 600

// Pre-generate pages for all vehicles at build time
export async function generateStaticParams() {
  const vehicles = await cached.vehicles.getAll()
  return vehicles.map((vehicle) => ({ id: vehicle.id }))
}

// Generate SEO metadata
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const vehicle = await cached.vehicles.getById(id)
  
  if (!vehicle) {
    return { title: 'Vehicle Not Found | Eweeha' }
  }

  const pricingInfo = vehicle ? getVehiclePricingInfo(vehicle) : null
  const pricingSnippet = pricingInfo
    ? pricingInfo.hasRange
      ? `${formatUsd(pricingInfo.min)}-${formatUsd(pricingInfo.max)}`
      : formatUsd(pricingInfo.min)
    : null
  const descriptionPricingText = pricingSnippet
    ? pricingInfo?.hasRange
      ? `Starting between ${pricingSnippet}/day`
      : `Starting at ${pricingSnippet}/day`
    : 'Contact us for pricing'

  // Always use slug for canonical URL (SEO best practice)
  const canonicalSlug = vehicle.slug || id

  return {
    title: `${vehicle.name} - Wedding Car in Lebanon | Eweeha`,
    description: `Rent ${vehicle.name} in Lebanon. ${vehicle.description} Capacity: ${vehicle.capacity}. ${descriptionPricingText} with driver.`,
    alternates: {
      canonical: `https://eweeha.com/fleet/${canonicalSlug}`,
    },
    openGraph: {
      title: `${vehicle.name} - Wedding Car Rental in Lebanon`,
      description: vehicle.description,
      images: [vehicle.images.main],
      url: `https://eweeha.com/fleet/${canonicalSlug}`,
    },
  }
}

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  // Fetch vehicle and config in parallel - single clean caching layer
  const [vehicle, config] = await Promise.all([
    cached.vehicles.getById(id),
    cached.config(),
  ])

  if (!vehicle) {
    notFound()
  }

  // Fetch reviews + rating stats for this vehicle
  const [reviews, ratingStats] = await Promise.all([
    getVehicleReviews(vehicle.id),
    getVehicleRatingStats(vehicle.id),
  ])

  // Get pricing for schema
  const pricingInfo = getVehiclePricingInfo(vehicle)
  const canonicalSlug = vehicle.slug || id

  // Product + Offer schema for fleet vehicles
  const productSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: vehicle.name,
    description: vehicle.description,
    image: vehicle.images.main,
    sku: vehicle.id,
    brand: {
      '@type': 'Brand',
      name: 'Eweeha'
    },
    category: 'Vehicle Rental',
    offers: pricingInfo ? (
      pricingInfo.hasRange ? {
        '@type': 'AggregateOffer',
        url: `https://eweeha.com/fleet/${canonicalSlug}`,
        priceCurrency: 'USD',
        lowPrice: pricingInfo.min,
        highPrice: pricingInfo.max,
        offerCount: 2,
        availability: vehicle.available 
          ? 'https://schema.org/InStock' 
          : 'https://schema.org/OutOfStock',
        priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        seller: {
          '@type': 'Organization',
          '@id': 'https://eweeha.com/#organization',
          name: 'Eweeha'
        }
      } : {
        '@type': 'Offer',
        url: `https://eweeha.com/fleet/${canonicalSlug}`,
        priceCurrency: 'USD',
        price: pricingInfo.min,
        availability: vehicle.available 
          ? 'https://schema.org/InStock' 
          : 'https://schema.org/OutOfStock',
        priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        seller: {
          '@type': 'Organization',
          '@id': 'https://eweeha.com/#organization',
          name: 'Eweeha'
        }
      }
    ) : {
      '@type': 'Offer',
      url: `https://eweeha.com/fleet/${canonicalSlug}`,
      priceCurrency: 'USD',
      availability: vehicle.available 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        '@id': 'https://eweeha.com/#organization',
        name: 'Eweeha'
      }
    }
  }

  if (ratingStats.totalReviews > 0) {
    productSchema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(ratingStats.averageRating.toFixed(2)),
      reviewCount: ratingStats.totalReviews,
      bestRating: 5,
      worstRating: 1,
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <VehicleDetailClient
        vehicle={vehicle}
        config={config}
        reviews={reviews}
        ratingStats={ratingStats}
      />
    </>
  )
}
