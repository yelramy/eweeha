import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Breadcrumbs from '@/components/Breadcrumbs'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import { routes } from '@/lib/routes'

type RouteSlug = keyof typeof routes

export async function generateStaticParams() {
  return Object.keys(routes).map((slug) => ({
    slug,
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const route = routes[slug as RouteSlug]
  
  if (!route) {
    return {
      title: 'Route Not Found'
    }
  }

  // Ensure absolute URL for og:image with fallback
  const ogImageUrl = route.image 
    ? (route.image.startsWith('http') 
        ? route.image 
        : `https://eweeha.com${route.image}`)
    : 'https://eweeha.com/og-image.jpg'

  return {
    title: `${route.title} | Eweeha`,
    description: route.description,
    alternates: {
      canonical: `https://eweeha.com/routes/${slug}`
    },
    openGraph: {
      title: route.title,
      description: route.description,
      url: `https://eweeha.com/routes/${slug}`,
      type: 'website',
      images: [{
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: route.title
      }]
    }
  }
}

export default async function RoutePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const route = routes[slug as RouteSlug]

  if (!route) {
    notFound()
  }

  // Generate route-specific schema
  const routeSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: route.title,
    description: route.description,
    serviceType: 'Wedding car rental with chauffeur',
    provider: {
      '@type': 'Organization',
      '@id': 'https://eweeha.com/#organization',
      name: 'Eweeha'
    },
    areaServed: {
      '@type': 'Place',
      name: route.to
    }
  }

  const offerSchema = route.priceRange ? {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    name: route.title,
    description: route.description,
    availability: 'https://schema.org/InStock',
    url: `https://eweeha.com/routes/${slug}`,
    priceCurrency: 'USD',
    price: route.priceRange.min,
    priceSpecification: {
      '@type': 'PriceSpecification',
      priceCurrency: 'USD',
      minPrice: route.priceRange.min,
      maxPrice: route.priceRange.max,
      valueAddedTaxIncluded: true
    },
    seller: {
      '@type': 'Organization',
      '@id': 'https://eweeha.com/#organization',
      name: 'Eweeha'
    }
  } : {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    name: route.title,
    description: route.description,
    availability: 'https://schema.org/InStock',
    url: `https://eweeha.com/routes/${slug}`,
    priceSpecification: {
      '@type': 'PriceSpecification',
      priceCurrency: 'USD',
      valueAddedTaxIncluded: true
    },
    seller: {
      '@type': 'Organization',
      '@id': 'https://eweeha.com/#organization',
      name: 'Eweeha'
    }
  }

  const faqSchema = route.faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: route.faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  } : null

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(routeSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(offerSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <Breadcrumbs />

      <div className="min-h-screen bg-white dark:bg-gray-900">
        {/* Hero Section */}
        <section className="bg-cream-50 dark:bg-gray-800 border-b border-warm-200 dark:border-gray-700 py-12 md:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h1 className="text-3xl md:text-5xl text-charcoal-600 dark:text-white mb-4">{route.title}</h1>
            <p className="text-lg md:text-xl text-warm-700 dark:text-gray-300 mb-6">{route.description}</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-warm-500 dark:text-gray-400">Coverage</div>
                <div className="font-semibold text-charcoal-600 dark:text-white">{route.distance}</div>
              </div>
              <div>
                <div className="text-warm-500 dark:text-gray-400">Packages</div>
                <div className="font-semibold text-charcoal-600 dark:text-white">{route.duration}</div>
              </div>
              <div>
                <div className="text-warm-500 dark:text-gray-400">Availability</div>
                <div className="font-semibold text-charcoal-600 dark:text-white">7 days a week</div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12 md:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {/* What's Included */}
              <div>
                <h2 className="text-2xl font-normal text-gray-900 dark:text-white mb-4">What&apos;s Included</h2>
                <ul className="space-y-3">
                  {route.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                      <span className="text-primary-700 dark:text-primary-300 font-bold mt-0.5">✓</span>
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pricing */}
              <div>
                <h2 className="text-2xl font-normal text-gray-900 dark:text-white mb-4">Pricing</h2>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  {route.priceRange ? (
                    <>
                      <p className="text-2xl text-gray-900 dark:text-white mb-1 font-semibold">
                        ${route.priceRange.min} – ${route.priceRange.max}
                      </p>
                      {route.referenceVehicle && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                          From ${route.priceRange.min} with {route.referenceVehicle}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Indicative range, from a single bridal car to a full multi-car convoy — final quote
                        depends on the cars, hours, and route
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg text-gray-900 dark:text-white mb-2 font-medium">
                        Contact for Quote
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Pricing depends on the car and the convoy size
                      </p>
                    </>
                  )}
                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <li>• Suited chauffeur included</li>
                    <li>• Fuel &amp; tolls included</li>
                    <li>• Ribbon &amp; flower décor on request</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* FAQs */}
            {route.faqs.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-normal text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {route.faqs.map((faq, index) => (
                    <div key={index} className="border-l-4 border-primary-500 bg-cream-50 dark:bg-gray-800 p-4 rounded-r-lg">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{faq.question}</h3>
                      <p className="text-gray-700 dark:text-gray-300 text-sm">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button href="/booking" variant="warning" size="lg">
                Check My Wedding Date
              </Button>
              <Button href="/#booking" variant="outline" size="lg">
                Request Custom Quote
              </Button>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  )
}
