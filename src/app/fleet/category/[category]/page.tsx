import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import SiteHeader from '@/components/SiteHeader'
import Footer from '@/components/Footer'
import FleetGrid from '@/components/FleetGrid'
import { cached } from '@/lib/cache'
import { getFleetCategoriesFromDb } from '@/lib/fleetCategoriesDb'
import {
  FleetCategory,
  CATEGORY_SEO_SLUGS,
  categorySlug,
  resolveCategorySlug,
  getFleetCategories,
  sortFleetForDisplay,
} from '@/lib/fleetCategories'

export const revalidate = 300

const categoryContent: Record<
  string,
  { title: string; description: string; intro: string }
> = {
  'rolls-bentley': {
    title: 'Luxury Wedding Cars in Lebanon — Rolls-Royce & Bentley',
    description:
      'Explore chauffeur-driven Rolls-Royce, Bentley, and flagship luxury wedding cars in Lebanon for bridal arrivals, groom entrances, and photos.',
    intro:
      'Choose a flagship wedding car for a formal bridal arrival, groom entrance, or wedding photos. Every booking includes a suited chauffeur and planned wedding-day timing.',
  },
  'classic-vintage': {
    title: 'Classic & Vintage Wedding Cars in Lebanon',
    description:
      'Browse classic and vintage wedding cars with chauffeur in Lebanon, including timeless convertibles and restored ceremony cars.',
    intro:
      'Classic and vintage cars bring character to ceremony arrivals, exits, and photography. Compare the available models, colors, passenger space, and pricing zones.',
  },
  'sports-convertible': {
    title: 'Exotic & Convertible Wedding Cars in Lebanon',
    description:
      'Browse chauffeur-driven exotic, sports, and convertible wedding cars in Lebanon for groom entrances, photoshoots, and special arrivals.',
    intro:
      'Sports cars and convertibles suit dramatic groom entrances, open-top photos, and couples who want a modern alternative to a traditional bridal sedan.',
  },
  'luxury-sedan': {
    title: 'Luxury Bridal Cars with Chauffeur in Lebanon',
    description:
      'Find modern luxury bridal sedans with professional chauffeurs in Lebanon for weddings, family transport, and elegant ceremony arrivals.',
    intro:
      'Luxury sedans combine a formal wedding-day appearance with comfortable seating, climate control, and a smooth chauffeur-driven journey.',
  },
  'suv-limo': {
    title: 'Stretch Limousines & Wedding SUVs in Lebanon',
    description:
      'Explore stretch limousines and luxury wedding SUVs with chauffeur in Lebanon for bridal parties, group entrances, and wedding convoys.',
    intro:
      'Stretch limousines and luxury SUVs work well for bridal parties, coordinated convoys, and couples who want a bold, spacious wedding entrance.',
  },
}

function contentFor(category: FleetCategory) {
  return (
    categoryContent[category.id] ?? {
      title: `${category.title} — Wedding Cars in Lebanon`,
      description: `Browse chauffeur-driven ${category.title.toLowerCase()} wedding cars in Lebanon with pricing, photos, and wedding-day timing included.`,
      intro:
        category.blurb ||
        'Every car below includes a suited chauffeur and planned wedding-day timing. Compare models, passenger space, and pricing zones.',
    }
  )
}

export function generateStaticParams() {
  return Object.values(CATEGORY_SEO_SLUGS).map((slug) => ({ category: slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category: slug } = await params
  const category = resolveCategorySlug(slug, await getFleetCategoriesFromDb())
  if (!category) return { title: 'Wedding Car Category | Eweeha' }
  const content = contentFor(category)

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
  const categories = await getFleetCategoriesFromDb()
  const category = resolveCategorySlug(slug, categories)
  if (!category) notFound()
  const content = contentFor(category)

  const validIds = new Set(categories.map((c) => c.id))
  const vehicles = sortFleetForDisplay(await cached.vehicles.getAvailable(), categories).filter(
    (vehicle) => getFleetCategories(vehicle, validIds).includes(category.id)
  )

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: content.title,
    numberOfItems: vehicles.length,
    itemListElement: vehicles.map((vehicle, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: vehicle.name,
      url: `https://eweeha.com/fleet/${vehicle.id}`,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <SiteHeader />

        <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-14 md:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <nav aria-label="Breadcrumb" className="text-sm text-primary-100 mb-4">
              <Link href="/wedding-car-rental-lebanon" className="underline underline-offset-2 hover:text-white">
                Wedding Car Rental in Lebanon
              </Link>
              <span className="mx-2">/</span>
              <span>{category.title}</span>
            </nav>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">{content.title.split(' — ')[0]}</h1>
            <p className="text-lg md:text-xl text-primary-50 max-w-2xl mx-auto mb-8">{content.intro}</p>
            <Link
              href="/booking"
              className="inline-block bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold hover:bg-cream-100 transition-colors"
            >
              Check My Date
            </Link>
          </div>
        </section>

        <section className="py-10 md:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <FleetGrid vehicles={vehicles} />
            <p className="mt-12 text-center text-sm text-warm-600 dark:text-gray-400">
              Looking for something different?{' '}
              <Link
                href="/wedding-car-rental-lebanon"
                className="text-primary-700 dark:text-primary-300 underline underline-offset-2"
              >
                Browse the full fleet
              </Link>
              .
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <section className="text-center bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl p-8 md:p-12 text-white">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Lock Your Wedding Car</h2>
            <p className="text-lg md:text-xl text-white mb-8">
              Tell us your date and venue — we confirm availability and a full quote the same day
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/booking"
                className="inline-block bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold hover:bg-cream-100 transition-colors"
              >
                Request a Quote
              </Link>
              <a
                href="https://wa.me/96170971841"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-[#25D366] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#1DA851] transition-colors"
              >
                WhatsApp Us
              </a>
            </div>
          </section>
        </div>

        <Footer />
      </div>
    </>
  )
}
