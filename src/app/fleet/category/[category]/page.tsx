import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import SiteHeader from '@/components/SiteHeader'
import Footer from '@/components/Footer'
import ImageWithFallback from '@/components/ImageWithFallback'
import { cached } from '@/lib/cache'
import {
  FLEET_CATEGORIES,
  getFleetCategories,
  sortFleetForDisplay,
} from '@/lib/fleetCategories'

export const revalidate = 300

const categoryContent: Record<
  string,
  { title: string; description: string; intro: string; canonical: string }
> = {
  'rolls-bentley': {
    title: 'Luxury Wedding Cars in Lebanon — Rolls-Royce & Bentley',
    description:
      'Explore chauffeur-driven Rolls-Royce, Bentley, and flagship luxury wedding cars in Lebanon for bridal arrivals, groom entrances, and photos.',
    intro:
      'Choose a flagship wedding car for a formal bridal arrival, groom entrance, or wedding photos. Every booking includes a suited chauffeur and planned wedding-day timing.',
    canonical: 'luxury-wedding-cars-lebanon',
  },
  'classic-vintage': {
    title: 'Classic & Vintage Wedding Cars in Lebanon',
    description:
      'Browse classic and vintage wedding cars with chauffeur in Lebanon, including timeless convertibles and restored ceremony cars.',
    intro:
      'Classic and vintage cars bring character to ceremony arrivals, exits, and photography. Compare the available models, colors, passenger space, and pricing zones.',
    canonical: 'classic-vintage-wedding-cars-lebanon',
  },
  'sports-convertible': {
    title: 'Exotic & Convertible Wedding Cars in Lebanon',
    description:
      'Browse chauffeur-driven exotic, sports, and convertible wedding cars in Lebanon for groom entrances, photoshoots, and special arrivals.',
    intro:
      'Sports cars and convertibles suit dramatic groom entrances, open-top photos, and couples who want a modern alternative to a traditional bridal sedan.',
    canonical: 'exotic-convertible-wedding-cars-lebanon',
  },
  'luxury-sedan': {
    title: 'Luxury Bridal Cars with Chauffeur in Lebanon',
    description:
      'Find modern luxury bridal sedans with professional chauffeurs in Lebanon for weddings, family transport, and elegant ceremony arrivals.',
    intro:
      'Luxury sedans combine a formal wedding-day appearance with comfortable seating, climate control, and a smooth chauffeur-driven journey.',
    canonical: 'luxury-bridal-cars-lebanon',
  },
  'suv-limo': {
    title: 'Stretch Limousines & Wedding SUVs in Lebanon',
    description:
      'Explore stretch limousines and luxury wedding SUVs with chauffeur in Lebanon for bridal parties, group entrances, and wedding convoys.',
    intro:
      'Stretch limousines and luxury SUVs work well for bridal parties, coordinated convoys, and couples who want a bold, spacious wedding entrance.',
    canonical: 'stretch-limousines-wedding-suvs-lebanon',
  },
}

const slugToCategory = Object.fromEntries(
  Object.entries(categoryContent).map(([category, content]) => [content.canonical, category])
)

export function generateStaticParams() {
  return Object.values(categoryContent).map(content => ({ category: content.canonical }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category: slug } = await params
  const category = slugToCategory[slug]
  const content = categoryContent[category]
  if (!content) return { title: 'Wedding Car Category | Eweeha' }

  return {
    title: { absolute: `${content.title} | Eweeha` },
    description: content.description,
    alternates: { canonical: `https://eweeha.com/fleet/category/${slug}` },
  }
}

export default async function FleetCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category: slug } = await params
  const categoryId = slugToCategory[slug]
  const content = categoryContent[categoryId]
  const category = FLEET_CATEGORIES.find(item => item.id === categoryId)
  if (!content || !category) notFound()

  const vehicles = sortFleetForDisplay(await cached.vehicles.getAvailable()).filter(vehicle =>
    getFleetCategories(vehicle, new Set(FLEET_CATEGORIES.map(item => item.id))).includes(categoryId)
  )

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: content.title,
    numberOfItems: vehicles.length,
    itemListElement: vehicles.map((vehicle, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `https://eweeha.com/fleet/${vehicle.slug}`,
      name: vehicle.name,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />
      <SiteHeader />
      <main className="min-h-screen bg-white dark:bg-gray-900">
        <section className="py-12 md:py-16 border-b border-warm-200 dark:border-gray-700">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <nav className="text-sm text-warm-600 dark:text-gray-400 mb-5">
              <Link href="/fleet" className="underline underline-offset-2">
                Wedding Car Fleet
              </Link>{' '}
              / {category.title}
            </nav>
            <h1 className="text-3xl md:text-5xl text-charcoal-500 dark:text-white mb-4">
              {content.title}
            </h1>
            <p className="text-base md:text-lg text-warm-700 dark:text-gray-300 max-w-3xl leading-relaxed">
              {content.intro}
            </p>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map(vehicle => (
                <Link
                  key={vehicle.id}
                  href={`/fleet/${vehicle.slug}`}
                  className="group bg-cream-50 dark:bg-gray-800 border border-warm-200 dark:border-gray-700 rounded-xl overflow-hidden hover-lift"
                >
                  <ImageWithFallback
                    src={vehicle.images.main}
                    alt={`${vehicle.name} wedding car with chauffeur in Lebanon`}
                    width={640}
                    height={420}
                    className="w-full h-56 object-cover"
                    fallback={<div className="w-full h-56 bg-warm-100 dark:bg-gray-700" />}
                  />
                  <div className="p-5">
                    <h2 className="text-lg font-semibold text-charcoal-500 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-300">
                      {vehicle.name}
                    </h2>
                    <p className="text-sm text-warm-600 dark:text-gray-400 mt-2 line-clamp-3">
                      {vehicle.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-12 rounded-xl bg-primary-900 text-cream-50 p-8 text-center">
              <h2 className="text-2xl md:text-3xl mb-3">Choose your wedding cars</h2>
              <p className="text-primary-100 mb-6 max-w-2xl mx-auto">
                Send your date, locations, and preferred cars. We will confirm availability,
                chauffeur timing, and pricing for your wedding route.
              </p>
              <Link
                href="/booking"
                className="inline-block bg-cream-50 text-primary-900 px-7 py-3 rounded-lg font-semibold"
              >
                Request a Quote
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
