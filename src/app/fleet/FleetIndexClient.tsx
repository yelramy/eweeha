'use client'

import Link from 'next/link'
import Image from 'next/image'
import Footer from '@/components/Footer'
import FleetGrid from '@/components/FleetGrid'
import { sortFleetForDisplay } from '@/lib/fleetCategories'
import { Vehicle } from '@/types/vehicle'

export default function FleetIndexClient({ vehicles }: { vehicles: Vehicle[] }) {
  return (
    <>
      <header className="bg-cream-50/95 dark:bg-gray-900 backdrop-blur shadow-sm sticky top-0 z-40 border-b border-warm-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Eweeha — Wedding Cars Lebanon"
              width={144}
              height={144}
              className="w-10 h-10 sm:w-11 sm:h-11 object-contain"
            />
            <span className="text-[10px] tracking-[0.28em] text-charcoal-500 dark:text-gray-300 uppercase leading-snug">
              Wedding Cars<span className="block">Lebanon</span>
            </span>
          </Link>
          <nav className="flex items-center gap-3 sm:gap-5 text-sm">
            <Link href="/" className="text-gray-700 dark:text-gray-200 hover:text-primary-700 dark:hover:text-white transition-colors">
              Home
            </Link>
            <Link
              href="/booking"
              className="px-4 py-2 rounded-md bg-gradient-to-br from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white text-sm font-medium transition-all"
            >
              Book Now
            </Link>
          </nav>
        </div>
      </header>
      <main className="min-h-screen bg-white dark:bg-gray-900">
        <section className="py-10 md:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-8">
              <p className="script-accent text-2xl text-primary-600 dark:text-primary-300 mb-1">the cars</p>
              <h1 className="text-2xl md:text-4xl text-charcoal-500 dark:text-white mb-2">Full Wedding Fleet</h1>
              <p className="text-sm md:text-base text-warm-600 dark:text-gray-400 max-w-2xl mx-auto">
                Every car below includes a suited chauffeur, wedding-day timing, and ribbon &amp; flower décor on request.
              </p>
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
