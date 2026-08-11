'use client'

import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import Footer from '@/components/Footer'
import FleetGrid from '@/components/FleetGrid'
import {
  FLEET_CATEGORIES,
  FleetCategory,
  categorySlug,
  sortFleetForDisplay,
} from '@/lib/fleetCategories'
import { Vehicle } from '@/types/vehicle'

export default function FleetIndexClient({
  vehicles,
  categories = FLEET_CATEGORIES,
}: {
  vehicles: Vehicle[]
  categories?: FleetCategory[]
}) {
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
            <nav aria-label="Fleet categories" className="mb-8 flex flex-wrap justify-center gap-2">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/fleet/category/${categorySlug(category.id)}`}
                  className="rounded-full border border-warm-300 dark:border-gray-600 px-4 py-1.5 text-sm text-charcoal-500 dark:text-gray-200 hover:bg-cream-100 dark:hover:bg-gray-800 hover:border-primary-400 dark:hover:border-primary-500 transition-colors"
                >
                  {category.title}
                </Link>
              ))}
            </nav>
            <FleetGrid vehicles={sortFleetForDisplay(vehicles, categories)} />
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
