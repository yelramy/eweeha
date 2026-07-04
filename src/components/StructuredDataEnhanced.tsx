'use client'

/**
 * Enhanced Structured Data Components for SEO
 * Provides rich schema markup for different content types
 */

/**
 * Vehicle/Product Schema for fleet pages
 */
export function VehicleSchema({ 
  vehicle,
  rating
}: { 
  vehicle: {
    id: string
    name: string
    description: string
    price: number
    mainImage: string
    category: string
    capacity: string
    features: string[]
    available: boolean
  }
  rating?: {
    averageRating: number
    totalReviews: number
  }
}) {
  // Get base URL with Vercel fallback
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL 
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || ''

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': vehicle.name,
    'description': vehicle.description,
    'image': vehicle.mainImage,
    'brand': {
      '@type': 'Brand',
      'name': 'Eweeha'
    },
    'category': 'Vehicle Rental',
    'offers': {
      '@type': 'Offer',
      'price': vehicle.price,
      'priceCurrency': 'USD',
      'availability': vehicle.available 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
      'priceValidUntil': new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      'url': `${baseUrl}/fleet/${vehicle.id}`,
      'seller': {
        '@type': 'Organization',
        'name': 'Eweeha'
      }
    },
    'additionalProperty': vehicle.features.map(feature => ({
      '@type': 'PropertyValue',
      'name': 'Feature',
      'value': feature
    }))
  }

  // Only include rating if we have real reviews
  if (rating && rating.totalReviews > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      'ratingValue': rating.averageRating.toFixed(1),
      'reviewCount': rating.totalReviews.toString(),
      'bestRating': '5',
      'worstRating': '1'
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

/**
 * FAQ Page Schema
 */
export function FAQSchema({ 
  faqs 
}: { 
  faqs: Array<{ question: string; answer: string }> 
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(faq => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.answer
      }
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

/**
 * Service Schema for service pages
 */
export function ServiceSchema({ 
  service 
}: { 
  service: {
    name: string
    description: string
    provider?: string
    areaServed?: string
    priceRange?: string
  }
}) {
  // Get base URL with Vercel fallback
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL 
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || ''

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    'serviceType': service.name,
    'description': service.description,
    'provider': {
      '@type': 'Organization',
      'name': service.provider || 'Eweeha',
      'url': baseUrl
    },
    'areaServed': {
      '@type': 'Country',
      'name': service.areaServed || 'Lebanon'
    },
    'hasOfferCatalog': {
      '@type': 'OfferCatalog',
      'name': 'Wedding Car Services',
      'itemListElement': [
        {
          '@type': 'Offer',
          'itemOffered': {
            '@type': 'Service',
            'name': service.name
          }
        }
      ]
    },
    'priceRange': service.priceRange || '$50-$120'
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

/**
 * Local Business with Reviews Schema
 */
export function LocalBusinessSchema({
  name,
  description,
  telephone,
  address,
  rating,
  reviewCount,
  priceRange
}: {
  name: string
  description: string
  telephone: string
  address: string
  rating?: number
  reviewCount?: number
  priceRange?: string
}) {
  // Get base URL with Vercel fallback
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL 
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || ''

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'AutoRental',
    'name': name,
    'description': description,
    'url': baseUrl,
    'telephone': telephone,
    'priceRange': priceRange || '$50-$120',
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': address,
      'addressLocality': 'Beirut',
      'addressRegion': 'Beirut Governorate',
      'addressCountry': 'LB'
    },
    'geo': {
      '@type': 'GeoCoordinates',
      'latitude': '33.8938',
      'longitude': '35.5018'
    },
    'areaServed': {
      '@type': 'Country',
      'name': 'Lebanon'
    },
    'openingHours': 'Mo-Su 00:00-24:00',
    'paymentAccepted': ['Credit Card', 'Cash', 'Bank Transfer', 'OMT'],
    'currenciesAccepted': 'USD'
  }

  // Only include rating if we have real reviews with minimum threshold
  if (rating && reviewCount && reviewCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      'ratingValue': rating.toFixed(1),
      'reviewCount': reviewCount.toString(),
      'bestRating': '5',
      'worstRating': '1'
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

/**
 * Booking/Reservation Schema
 */
export function BookingSchema() {
  // Get base URL with Vercel fallback
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL 
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || ''

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ReservationAction',
    'target': {
      '@type': 'EntryPoint',
      'urlTemplate': `${baseUrl}/booking`,
      'actionPlatform': [
        'http://schema.org/DesktopWebPlatform',
        'http://schema.org/MobileWebPlatform'
      ]
    },
    'result': {
      '@type': 'RentalCarReservation',
      'provider': {
        '@type': 'Organization',
        'name': 'Eweeha'
      }
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

/**
 * Article/Blog Post Schema
 */
export function ArticleSchema({
  title,
  description,
  datePublished,
  dateModified,
  authorName,
  image
}: {
  title: string
  description: string
  datePublished: string
  dateModified?: string
  authorName?: string
  image?: string
}) {
  // Get base URL with Vercel fallback
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL 
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || ''

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': title,
    'description': description,
    'image': image || `${baseUrl}/og-image.jpg`,
    'datePublished': datePublished,
    'dateModified': dateModified || datePublished,
    'author': {
      '@type': 'Organization',
      'name': authorName || 'Eweeha'
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'Eweeha',
      'logo': {
        '@type': 'ImageObject',
        'url': `${baseUrl}/logo.png`
      }
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

/**
 * WebSite Schema with Search Action
 */
export function WebSiteSchema() {
  // Get base URL with Vercel fallback
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL 
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || ''

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'Eweeha',
    'url': baseUrl,
    'potentialAction': {
      '@type': 'SearchAction',
      'target': {
        '@type': 'EntryPoint',
        'urlTemplate': `${baseUrl}/fleet?search={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

/**
 * Contact Page Schema
 */
export function ContactSchema({
  telephone,
  email,
  address
}: {
  telephone: string
  email: string
  address: string
}) {
  // Get base URL with Vercel fallback
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL 
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || ''

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    'mainEntity': {
      '@type': 'Organization',
      'name': 'Eweeha',
      'url': baseUrl,
      'contactPoint': {
        '@type': 'ContactPoint',
        'telephone': telephone,
        'email': email,
        'contactType': 'Customer Service',
        'availableLanguage': ['English', 'Arabic'],
        'areaServed': 'LB'
      },
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': address,
        'addressLocality': 'Beirut',
        'addressCountry': 'LB'
      }
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

/**
 * ItemList Schema for listing pages
 */
export function ItemListSchema({
  items,
  listName
}: {
  items: Array<{
    name: string
    url: string
    image?: string
    description?: string
  }>
  listName: string
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': listName,
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'item': {
        '@type': 'Product',
        'name': item.name,
        'url': item.url,
        'image': item.image,
        'description': item.description
      }
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
