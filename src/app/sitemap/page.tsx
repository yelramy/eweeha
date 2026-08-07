import { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import Footer from '@/components/Footer'
import { cached } from '@/lib/cache'
import { routes } from '@/lib/routes'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Site Map | Eweeha — Wedding Cars Lebanon',
  description: 'Every page on Eweeha: fleet, services, wedding areas, booking, and company pages.',
  alternates: { canonical: 'https://eweeha.com/sitemap' },
}

const mainPages = [
  { href: '/', label: 'Home' },
  { href: '/wedding-car-rental-lebanon', label: 'Full Fleet' },
  { href: '/booking', label: 'Book Now' },
  { href: '/booking/lookup', label: 'Track Booking' },
  { href: '/routes', label: 'Wedding Areas & Experiences' },
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact' },
  { href: '/faq', label: 'FAQ' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/privacy', label: 'Privacy Policy' },
]

const servicePages = [
  { href: '/services/wedding-convoy', label: 'Wedding Convoy' },
  { href: '/services/bridal-car', label: 'Bridal Car & Chauffeur' },
  { href: '/services/photoshoot-cars', label: 'Classic & Convertible Cars' },
  { href: '/services/guest-shuttle', label: 'Guest Shuttle Vans' },
]

function LinkList({ items }: { items: { href: string; label: string }[] }) {
  return (
    <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="text-primary-700 dark:text-primary-300 hover:underline text-sm md:text-base"
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default async function SiteMapPage() {
  const vehicles = (await cached.vehicles.getAll()).filter((v) => v.available !== false)

  const areaRoutes = Object.values(routes)
    .filter((r) => r.category === 'areas')
    .map((r) => ({ href: `/routes/${r.slug}`, label: r.title }))
  const experienceRoutes = Object.values(routes)
    .filter((r) => r.category === 'experiences')
    .map((r) => ({ href: `/routes/${r.slug}`, label: r.title }))

  const sections = [
    { title: 'Main Pages', items: mainPages },
    { title: 'Services', items: servicePages },
    { title: 'Wedding Areas We Serve', items: areaRoutes },
    { title: 'Signature Experiences', items: experienceRoutes },
    {
      title: 'The Fleet',
      items: vehicles.map((v) => ({ href: `/fleet/${v.slug}`, label: v.name })),
    },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <SiteHeader />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-charcoal-600 dark:text-white mb-3">
          Site Map
        </h1>
        <p className="text-warm-600 dark:text-gray-400 mb-10">
          Every page on Eweeha, in one place.
        </p>

        <div className="space-y-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-warm-200 dark:border-gray-700">
                {section.title}
              </h2>
              <LinkList items={section.items} />
            </section>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  )
}
