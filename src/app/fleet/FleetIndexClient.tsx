'use client'

import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import Footer from '@/components/Footer'
import FleetGrid from '@/components/FleetGrid'
import { FLEET_CATEGORIES, sortFleetForDisplay } from '@/lib/fleetCategories'
import { Vehicle } from '@/types/vehicle'

const categoryLinks = [
  'luxury-wedding-cars-lebanon',
  'classic-vintage-wedding-cars-lebanon',
  'exotic-convertible-wedding-cars-lebanon',
  'luxury-bridal-cars-lebanon',
  'stretch-limousines-wedding-suvs-lebanon',
]

export default function FleetIndexClient({ vehicles }: { vehicles: Vehicle[] }) {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-white dark:bg-gray-900">
        <section className="py-10 md:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-8">
              <p className="script-accent text-2xl text-primary-600 dark:text-primary-300 mb-1">the cars</p>
              <h1 className="text-2xl md:text-4xl text-charcoal-500 dark:text-white mb-2">Wedding Car Rental in Lebanon</h1>
              <p className="text-sm md:text-base text-warm-600 dark:text-gray-400 max-w-2xl mx-auto">
                Every car below includes a suited chauffeur and wedding-day timing — no stickers or ads on any car.
              </p>
            </div>
            <div className="mb-10 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {FLEET_CATEGORIES.map((category, index) => (
                <Link
                  key={category.id}
                  href={`/fleet/category/${categoryLinks[index]}`}
                  className="rounded-lg border border-warm-200 dark:border-gray-700 p-4 text-center hover:bg-cream-50 dark:hover:bg-gray-800"
                >
                  <span className="font-semibold text-charcoal-500 dark:text-white">
                    {category.title}
                  </span>
                </Link>
              ))}
            </div>
            <FleetGrid vehicles={sortFleetForDisplay(vehicles)} />
            <p className="mt-12 text-center text-sm text-warm-600 dark:text-gray-400">
              Not sure which cars to pick?{' '}
              <Link href="/#fleet" className="text-primary-700 dark:text-primary-300 underline underline-offset-2">
                See our featured picks
              </Link>{' '}
              or{' '}
              <Link href="/booking" className="text-primary-700 dark:text-primary-300 underline underline-offset-2">
                request a quote
              </Link>
              .
            </p>
          </div>
        </section>
        <Footer />
      </main>
    </>
  )
}
