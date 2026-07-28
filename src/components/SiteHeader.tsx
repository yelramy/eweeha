'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Bars3Icon } from '@heroicons/react/24/outline'
import MobileMenu from '@/components/MobileMenu'

const linkClass =
  'whitespace-nowrap text-gray-700 dark:text-gray-200 hover:text-primary-700 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-md px-2 py-1'

/**
 * Shared site header for non-homepage routes. Anchor items point at the
 * homepage sections (/#fleet, /#services, /#contact) since the anchors
 * only exist there.
 */
export default function SiteHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="bg-cream-50/95 dark:bg-gray-900 backdrop-blur shadow-sm sticky top-0 z-40 border-b border-warm-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-2 sm:py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Eweeha — Wedding Cars Lebanon"
              width={144}
              height={144}
              className="w-11 h-11 sm:w-12 sm:h-12 object-contain"
              priority
            />
            <span className="text-[10px] sm:text-[11px] tracking-[0.28em] text-charcoal-500 dark:text-gray-300 uppercase leading-snug">
              Wedding Cars<span className="block">Lebanon</span>
            </span>
          </Link>
          <div className="hidden lg:flex items-center gap-6">
            <nav className="flex space-x-6">
              <Link href="/#fleet" className={linkClass}>
                The Cars
              </Link>
              <Link href="/fleet" className={linkClass}>
                Full Fleet
              </Link>
              <Link href="/#services" className={linkClass}>
                Services
              </Link>
              <Link href="/booking" className={linkClass}>
                Book Now
              </Link>
              <Link href="/#contact" className={linkClass}>
                Contact
              </Link>
              <Link
                href="/booking/lookup"
                className="whitespace-nowrap text-gray-700 dark:text-gray-200 hover:text-primary-700 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-md px-3 py-1.5 border border-warm-300 dark:border-gray-600 hover:bg-cream-100 dark:hover:bg-gray-700 font-medium text-sm"
              >
                Track Booking
              </Link>
            </nav>
          </div>
          <button
            className="lg:hidden p-0.5 rounded-md text-gray-700 dark:text-gray-200 hover:bg-cream-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
        </div>
      </div>
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </header>
  )
}
