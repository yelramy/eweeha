import { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'
import Footer from '@/components/Footer'
import { routes } from '@/lib/routes'

export const metadata: Metadata = {
  title: 'Wedding Car Areas & Experiences in Lebanon | Eweeha',
  description: 'Wedding cars everywhere in Lebanon: Beirut, Jounieh & Harissa, Byblos & Batroun, Broummana, Aley & Bhamdoun, Faraya, the Chouf, Zahle & the Bekaa, the South and the North. Plus classic car photoshoots, convertibles, and zaffe arrivals.',
  alternates: {
    canonical: 'https://eweeha.com/routes'
  },
  openGraph: {
    title: 'Wedding Car Areas & Experiences in Lebanon',
    description: 'Chauffeured wedding cars for every ceremony and venue across Lebanon — plus classic car photoshoots and convertible convoys.',
    url: 'https://eweeha.com/routes',
    type: 'website'
  }
}

// Helper to get routes by category
const getRoutesByCategory = (category: string) => {
  return Object.values(routes).filter(route => route.category === category)
}

const routeCategories = [
  {
    id: 'areas',
    title: 'Wedding Areas We Serve',
    description: 'From the coast to the cedars — bridal cars and wedding convoys for every region\'s ceremonies and venues',
    routes: getRoutesByCategory('areas')
  },
  {
    id: 'experiences',
    title: 'Signature Experiences',
    description: 'The moments that make a Lebanese wedding: classics for the photos, convertibles for the convoy, and the grand zaffe arrival',
    routes: getRoutesByCategory('experiences')
  }
]

// Structured data for the routes page
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Wedding Car Areas & Experiences in Lebanon',
  description: 'Wedding car rental coverage areas and signature wedding experiences across Lebanon',
  itemListElement: Object.values(routes).map((route, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    item: {
      '@type': 'Service',
      name: route.title,
      url: `https://eweeha.com/routes/${route.slug}`,
      serviceType: 'Wedding car rental with chauffeur'
    }
  }))
}

export default function RoutesIndexPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <Breadcrumbs />

      <div className="min-h-screen bg-white dark:bg-gray-900">
        {/* Hero Section */}
        <section className="bg-cream-50 dark:bg-gray-800 border-b border-warm-200 dark:border-gray-700 py-12 md:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <p className="script-accent text-2xl text-primary-600 dark:text-primary-300 mb-2">wherever you say yes</p>
            <h1 className="text-3xl md:text-5xl text-charcoal-600 dark:text-white mb-4">
              Wedding Areas &amp; Experiences
            </h1>
            <p className="text-lg md:text-xl text-warm-700 dark:text-gray-300 max-w-3xl">
              Chauffeured wedding cars for every ceremony and venue in Lebanon.
              Every booking includes a suited chauffeur, fuel, tolls, and coordinated timing.
            </p>
          </div>
        </section>

        {/* Routes by Category */}
        <section className="py-12 md:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="space-y-12">
              {routeCategories.map((category) => (
                <div key={category.id}>
                  <div className="mb-6">
                    <h2 className="text-2xl md:text-3xl text-gray-900 dark:text-white mb-2">
                      {category.title}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      {category.description}
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {category.routes.map((route) => (
                      <Link
                        key={route.slug}
                        href={`/routes/${route.slug}`}
                        className="group block bg-white dark:bg-gray-800 border border-warm-200 dark:border-gray-700 rounded-lg p-6 hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-lg transition-all"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">
                          {route.title}
                        </h3>

                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                          <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3 C 8 3 5 6 5 10 C 5 15 12 21 12 21 C 12 21 19 15 19 10 C 19 6 16 3 12 3 Z" stroke="#9C7838" strokeWidth="1.6" /><circle cx="12" cy="10" r="2.4" fill="#DBA396" /></svg>
                            <span>{route.to}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8.5" stroke="#9C7838" strokeWidth="1.6" /><path d="M12 7.5 V 12 L 15 14" stroke="#9C7838" strokeWidth="1.6" strokeLinecap="round" /></svg>
                            <span>{route.duration}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end">
                          <span className="text-primary-700 dark:text-primary-300 group-hover:translate-x-1 transition-transform">
                            View Details →
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Section */}
            <div className="mt-16 bg-gradient-to-br from-primary-50 to-cream-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-8 md:p-12 text-center">
              <h2 className="text-2xl md:text-3xl text-gray-900 dark:text-white mb-4">
                Getting married somewhere else?
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
                We cover every village and venue in Lebanon. Tell us your ceremony and venue and we&apos;ll plan the convoy around them.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/booking"
                  className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                >
                  Request a Quote
                </Link>
                <Link
                  href="/contact"
                  className="inline-block bg-white dark:bg-gray-800 border border-warm-300 dark:border-gray-600 text-gray-900 dark:text-white hover:border-primary-600 dark:hover:border-primary-500 px-8 py-3 rounded-lg font-medium transition-colors"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  )
}
