'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { PhoneIcon, ChatBubbleLeftRightIcon, Bars3Icon } from '@heroicons/react/24/outline'
import ImageWithFallback from '@/components/ImageWithFallback'
import AIBookingAssistant from '@/components/AIBookingAssistant'
import Button from '@/components/Button'
import MobileMenu from '@/components/MobileMenu'
import Footer from '@/components/Footer'
import ServiceCard, { ServiceCardsGrid } from '@/components/ServiceCard'
import { Vehicle } from '@/types/vehicle'
import { AppConfig } from '@/constants/configDefaults'
import ReviewsSection from '@/components/ReviewsSection'
import type { Review } from '@/lib/reviews'

interface ServiceItem {
  title: string
  description: string
  icon: string
  image?: string
}

interface HomeClientProps {
  initialVehicles: Vehicle[]
  config: AppConfig
  services: ServiceItem[]
  reviews?: Review[]
  ratingStats?: { averageRating: number; totalReviews: number }
}

/** Ribbon divider — a wedding-car ribbon with a center bow */
function RibbonDivider({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 28" className={className} fill="none" aria-hidden="true">
      <path d="M 6 16 C 50 8 74 20 92 15" stroke="#8E3B46" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 108 15 C 126 20 150 8 194 16" stroke="#8E3B46" strokeWidth="1.5" strokeLinecap="round" />
      {/* bow */}
      <path d="M 100 14 C 92 6 82 8 84 14 C 85.5 19 95 18 100 14 Z" fill="#EBC3C9" stroke="#8E3B46" strokeWidth="1.3" />
      <path d="M 100 14 C 108 6 118 8 116 14 C 114.5 19 105 18 100 14 Z" fill="#EBC3C9" stroke="#8E3B46" strokeWidth="1.3" />
      <circle cx="100" cy="14" r="2.6" fill="#8E3B46" />
      <path d="M 97 17 C 94 21 93 23 91 25 M 103 17 C 106 21 107 23 109 25" stroke="#8E3B46" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

/** Hand-drawn classic wedding car with ribbon bow and trailing cans */
function WeddingCarIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 520 300" className={className} fill="none" aria-hidden="true">
      {/* ground line */}
      <path d="M 20 252 H 500" stroke="#D4C8B7" strokeWidth="2" strokeLinecap="round" strokeDasharray="1 10" />

      {/* trailing cans on strings */}
      <g stroke="#8A7A69" strokeWidth="1.6">
        <path d="M 78 216 C 60 224 48 236 44 246" />
        <path d="M 78 220 C 66 230 62 240 62 248" />
        <path d="M 78 224 C 74 234 76 242 80 250" />
      </g>
      <g fill="#DEC690" stroke="#9C7838" strokeWidth="1.4">
        <rect x="36" y="244" width="14" height="10" rx="2" transform="rotate(-14 43 249)" />
        <rect x="55" y="247" width="14" height="10" rx="2" transform="rotate(8 62 252)" />
        <rect x="74" y="249" width="14" height="10" rx="2" transform="rotate(-6 81 254)" />
      </g>

      {/* car body — classic silhouette */}
      <path
        d="M 84 226
           C 84 208 92 196 110 192
           L 148 184
           C 168 160 196 146 232 146
           L 306 146
           C 342 146 372 158 392 182
           L 436 190
           C 456 194 464 206 464 222
           C 464 234 456 240 444 240
           L 116 240
           C 96 240 84 236 84 226 Z"
        fill="#742F38"
      />
      {/* body highlight */}
      <path d="M 110 196 L 148 188 C 167 165 195 151 231 151 L 305 151 C 331 151 353 158 371 172" stroke="#A94D5F" strokeWidth="5" strokeLinecap="round" opacity="0.65" />

      {/* windows */}
      <path d="M 166 184 C 182 164 204 154 230 154 L 246 154 L 246 184 Z" fill="#FBF3F4" opacity="0.92" />
      <path d="M 258 154 L 302 154 C 326 154 346 162 362 178 L 366 184 L 258 184 Z" fill="#FBF3F4" opacity="0.92" />

      {/* chrome trim + bumpers */}
      <path d="M 88 232 H 460" stroke="#DEC690" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M 80 226 C 76 226 72 228 70 232 M 468 224 C 472 224 476 227 478 231" stroke="#BA9348" strokeWidth="5" strokeLinecap="round" />

      {/* headlight + taillight */}
      <circle cx="452" cy="212" r="6" fill="#F6EEDD" stroke="#BA9348" strokeWidth="2" />
      <rect x="88" y="206" width="8" height="10" rx="2" fill="#EBC3C9" stroke="#8E3B46" strokeWidth="1.5" />

      {/* wheels */}
      <g>
        <circle cx="164" cy="240" r="30" fill="#2D2925" />
        <circle cx="164" cy="240" r="14" fill="#FBF8F1" stroke="#BA9348" strokeWidth="3" />
        <circle cx="380" cy="240" r="30" fill="#2D2925" />
        <circle cx="380" cy="240" r="14" fill="#FBF8F1" stroke="#BA9348" strokeWidth="3" />
      </g>

      {/* ribbon across the hood to the bow */}
      <path d="M 400 172 C 420 182 436 196 446 214" stroke="#EBC3C9" strokeWidth="6" strokeLinecap="round" opacity="0.9" />

      {/* bow on the trunk */}
      <g>
        <path d="M 118 178 C 104 160 84 162 88 176 C 91 187 108 187 118 178 Z" fill="#EBC3C9" stroke="#8E3B46" strokeWidth="2.5" />
        <path d="M 118 178 C 132 160 152 162 148 176 C 145 187 128 187 118 178 Z" fill="#EBC3C9" stroke="#8E3B46" strokeWidth="2.5" />
        <circle cx="118" cy="178" r="5.5" fill="#8E3B46" />
        <path d="M 112 184 C 106 194 104 200 100 206 M 124 184 C 130 194 132 200 136 206" stroke="#8E3B46" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* flowers on the hood corner */}
      <g>
        <circle cx="416" cy="176" r="7" fill="#DA9AA4" />
        <circle cx="428" cy="168" r="5.5" fill="#EBC3C9" />
        <circle cx="424" cy="182" r="4.5" fill="#F6E3E6" />
        <circle cx="416" cy="176" r="2.4" fill="#742F38" />
        <circle cx="428" cy="168" r="2" fill="#742F38" />
      </g>

      {/* confetti */}
      <g fill="#DEC690">
        <circle cx="120" cy="96" r="4" />
        <circle cx="452" cy="120" r="3.5" />
        <circle cx="256" cy="84" r="3" />
      </g>
      <g fill="#DA9AA4">
        <circle cx="180" cy="72" r="3" />
        <circle cx="392" cy="88" r="4" />
        <circle cx="480" cy="168" r="3" />
      </g>
      <g fill="#ADBB95">
        <circle cx="320" cy="66" r="3" />
        <circle cx="88" cy="140" r="3.5" />
      </g>

      {/* "just married" plate hanging off the back */}
      <g transform="rotate(-4 116 216)">
        <rect x="86" y="204" width="62" height="22" rx="4" fill="#FFFEF9" stroke="#8E3B46" strokeWidth="2" />
        <text x="117" y="220" textAnchor="middle" fontSize="13" fill="#742F38" style={{ fontFamily: 'var(--font-greatvibes), cursive' }}>just married</text>
      </g>
    </svg>
  )
}

export default function HomeClient({ initialVehicles, config, reviews = [], ratingStats }: HomeClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, href: string) => {
    e.preventDefault()
    const element = document.querySelector(href)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <>
      {/* Skip Navigation - Hidden until focused for accessibility */}
      <main id="main-content" className="min-h-screen bg-white">
        {/* Header */}
        <header className="bg-cream-50/95 dark:bg-gray-900 backdrop-blur shadow-sm sticky top-0 z-40 border-b border-warm-100 dark:border-gray-800">
          <div className="px-3 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-2 sm:py-3">
              <Link href="/" className="flex items-center gap-2.5">
                <Image
                  src="/logo.svg"
                  alt="Eweeha — Wedding Cars Lebanon"
                  width={144}
                  height={144}
                  className="w-11 h-11 sm:w-12 sm:h-12 object-contain"
                  priority
                />
                <span className="leading-none">
                  <span className="script-accent block text-2xl sm:text-3xl text-primary-700 dark:text-primary-300">Eweeha</span>
                  <span className="block text-[9px] sm:text-[10px] tracking-[0.28em] text-charcoal-500 dark:text-gray-300 uppercase mt-0.5">Wedding Cars Lebanon</span>
                </span>
              </Link>
              <div className="hidden md:flex items-center gap-6">
                <nav className="flex space-x-8">
                  <a
                    href="#fleet"
                    onClick={(e) => handleSmoothScroll(e, '#fleet')}
                    className="text-gray-700 dark:text-gray-200 hover:text-primary-700 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-md px-2 py-1"
                  >
                    The Cars
                  </a>
                  <a
                    href="#services"
                    onClick={(e) => handleSmoothScroll(e, '#services')}
                    className="text-gray-700 dark:text-gray-200 hover:text-primary-700 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-md px-2 py-1"
                  >
                    Services
                  </a>
                  <Link
                    href="/booking"
                    className="text-gray-700 dark:text-gray-200 hover:text-primary-700 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-md px-2 py-1"
                  >
                    Book Now
                  </Link>
                  <a
                    href="#contact"
                    onClick={(e) => handleSmoothScroll(e, '#contact')}
                    className="text-gray-700 dark:text-gray-200 hover:text-primary-700 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-md px-2 py-1"
                  >
                    Contact
                  </a>
                  <Link
                    href="/booking/lookup"
                    className="text-gray-700 dark:text-gray-200 hover:text-primary-700 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-md px-3 py-1.5 border border-warm-300 dark:border-gray-600 hover:bg-cream-100 dark:hover:bg-gray-700 font-medium text-sm"
                  >
                    Track Booking
                  </Link>
                </nav>
              </div>
              <button
                className="md:hidden p-0.5 rounded-md text-gray-700 dark:text-gray-200 hover:bg-cream-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Bars3Icon className="h-5 w-5" />
              </button>
            </div>
          </div>
          <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        </header>

        {/* Hero Section — split editorial layout: invitation copy + illustrated wedding car */}
        <section className="relative overflow-hidden bg-cream-50 dark:bg-gray-900">
          {/* soft wine & blush washes */}
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-32 -right-32 w-[30rem] h-[30rem] rounded-full bg-primary-100/60 dark:bg-primary-900/20 blur-3xl" />
            <div className="absolute -bottom-40 -left-24 w-[26rem] h-[26rem] rounded-full bg-clay-100/70 dark:bg-clay-500/10 blur-3xl" />
          </div>

          <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-16 md:py-24 z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-6 items-center">
              {/* Invitation copy */}
              <div className="text-center lg:text-left animate-fade-in-up">
                <p className="text-[11px] md:text-xs tracking-[0.35em] uppercase text-primary-700 dark:text-primary-300 mb-5">
                  Chauffeured wedding cars · All of Lebanon
                </p>

                <h1 className="text-4xl sm:text-5xl md:text-6xl text-charcoal-600 dark:text-white leading-[1.08] mb-4">
                  The cars arrive.
                  <span className="script-accent block text-primary-600 dark:text-primary-300 text-5xl sm:text-6xl md:text-7xl mt-3 leading-none">
                    Eweeha!
                  </span>
                </h1>

                <RibbonDivider className="w-48 mx-auto lg:mx-0 mb-5" />

                <p className="text-base md:text-lg text-warm-700 dark:text-gray-300 max-w-xl mx-auto lg:mx-0 leading-relaxed mb-8 font-light">
                  Decorated bridal cars, classic convertibles, and full cortège convoys —
                  ribbons, fresh flowers, and suited chauffeurs, on time at every church
                  and venue from Beirut to the mountains.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start items-center animate-fade-in-up stagger-2">
                  <a
                    href="#booking"
                    onClick={(e) => handleSmoothScroll(e, '#booking')}
                    className="w-full sm:w-auto px-8 py-3 text-center text-white text-sm font-medium tracking-wider bg-gradient-to-br from-primary-600 to-primary-800 hover:from-primary-700 hover:to-primary-900 rounded-full shadow-sm hover:shadow transition-all"
                  >
                    Plan My Cortège
                  </a>
                  <Link
                    href={`https://wa.me/${config.contact.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-8 py-3 text-center text-primary-700 dark:text-primary-300 text-sm font-medium tracking-wider border border-primary-300 dark:border-primary-500 rounded-full hover:bg-primary-50 dark:hover:bg-gray-800 transition-all"
                  >
                    WhatsApp Us
                  </Link>
                </div>

                <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2 text-xs md:text-sm text-warm-600 dark:text-gray-400">
                  <span>Suited chauffeurs</span>
                  <span aria-hidden="true" className="text-clay-300">✿</span>
                  <span>Ribbon &amp; flower décor</span>
                  <span aria-hidden="true" className="text-clay-300">✿</span>
                  <span>On time at the church</span>
                </div>
              </div>

              {/* Illustrated wedding car */}
              <div className="animate-fade-in-up stagger-2">
                <WeddingCarIllustration className="w-full max-w-xl mx-auto" />
              </div>
            </div>
          </div>
        </section>

        {/* Fleet Section */}
        <section id="fleet" className="py-10 md:py-16 bg-white dark:bg-gray-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-6">
              <p className="script-accent text-2xl text-primary-600 dark:text-primary-300 mb-1">the cars</p>
              <h2 className="text-2xl md:text-3xl text-charcoal-500 dark:text-white mb-2">The Wedding Fleet</h2>
              <p className="text-xs md:text-sm text-warm-600 dark:text-gray-400">
                Bridal cars, classics, convertibles &amp; family cars — chauffeur included
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
              {initialVehicles.map((vehicle) => {
                const hasPricing = vehicle.price6h || vehicle.price10h || vehicle.price24h

                return (
                  <div
                    key={vehicle.id}
                    className="bg-cream-50 dark:bg-gray-700 border border-warm-200 dark:border-gray-600 rounded-lg overflow-hidden hover-lift flex flex-col h-full"
                  >
                    <Link href={`/fleet/${vehicle.id}`} className="block h-52 sm:h-48 overflow-hidden relative flex-shrink-0">
                      <ImageWithFallback
                        src={vehicle.images.main}
                        alt={`${vehicle.name} — wedding car with chauffeur in Lebanon`}
                        width={400}
                        height={300}
                        quality={60}
                        className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                        fallback={<div className="w-full h-full bg-warm-100"></div>}
                      />
                    </Link>
                    <div className="p-4 sm:p-5 flex flex-col h-full">
                      {/* Title and price */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-base sm:text-lg md:text-xl font-semibold text-charcoal-500 dark:text-white mb-1 leading-tight">{vehicle.name}</h3>
                          <p className="text-xs sm:text-sm text-warm-600 dark:text-gray-400">
                            {vehicle.maxPassengers ? `${vehicle.maxPassengers} passengers` : vehicle.capacity}
                          </p>
                        </div>
                        <div className="text-right ml-2 sm:ml-3 flex-shrink-0">
                          {hasPricing ? (
                            <div className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 space-y-0.5">
                              {vehicle.price6h && <div><span className="text-gray-400">6h:</span> <span className="font-semibold">${vehicle.price6h}</span></div>}
                              {vehicle.price10h && <div><span className="text-gray-400">10h:</span> <span className="font-semibold">${vehicle.price10h}</span></div>}
                              {vehicle.price24h && <div><span className="text-gray-400">24h:</span> <span className="font-semibold">${vehicle.price24h}</span></div>}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500 dark:text-gray-400">Contact us</div>
                          )}
                        </div>
                      </div>

                      {/* Spacer that grows */}
                      <div className="flex-1"></div>

                      {/* Badges section */}
                      <div className="space-y-1.5 sm:space-y-2 text-xs mb-3">
                        <span className="inline-flex px-2.5 sm:px-3 py-1 sm:py-1.5 bg-primary-50 text-primary-700 border border-primary-200 rounded text-[11px] sm:text-xs">
                          Chauffeur included
                        </span>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {vehicle.features.slice(0, 2).map((feature, i) => (
                            <span key={i} className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-cream-100 text-charcoal-500 border border-warm-200 rounded text-[11px] sm:text-xs">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Buttons at bottom */}
                      <div className="flex gap-2">
                        <Button href={`/fleet/${vehicle.id}`} variant="outline" size="sm" className="flex-1 font-medium">
                          Details
                        </Button>
                        <Button href={`/booking?vehicle=${vehicle.id}`} variant="warning" size="sm" className="flex-1 font-semibold" aria-label={`Book ${vehicle.name} wedding car with chauffeur included`}>
                          Book
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-8 text-center">
              <a
                href="#booking"
                onClick={(e) => handleSmoothScroll(e, '#booking')}
                className="inline-block bg-gradient-to-br from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-8 py-3 rounded-md font-light transition-all hover:shadow-sm tracking-wider border border-primary-700 cursor-pointer"
              >
                Request a Quote →
              </a>
            </div>
          </div>
        </section>

        {/* What Every Booking Includes */}
        <section className="py-10 md:py-16 bg-cream-50 dark:bg-gray-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl text-gray-900 dark:text-white mb-2">
                Your Big Day, Handled
              </h2>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                Choose a car above, or tell us your church and venue — we&apos;ll build the cortège around your timeline.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 border-2 border-primary-600 dark:border-primary-500 rounded-lg p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Every Wedding Booking Includes:</h3>
                  <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex items-start gap-2">
                      <span className="text-primary-600 dark:text-primary-300 font-bold">✓</span>
                      <span>Professional chauffeur in a suit, wedding-day experienced</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary-600 dark:text-primary-300 font-bold">✓</span>
                      <span>Fuel, tolls, and waiting time included in the price</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary-600 dark:text-primary-300 font-bold">✓</span>
                      <span>Ribbon &amp; fresh flower decoration on request</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary-600 dark:text-primary-300 font-bold">✓</span>
                      <span>Timing coordinated with your planner, zaffe &amp; photographer</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Wedding Packages:</h3>
                  <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                    <div>
                      <div className="font-semibold text-primary-600 dark:text-primary-300">Ceremony Package — 6 hours</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Bride&apos;s prep → church → photo session</div>
                    </div>
                    <div>
                      <div className="font-semibold text-primary-600 dark:text-primary-300">Celebration Package — 10 hours</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Prep → church → photoshoot → grand venue entrance</div>
                    </div>
                    <div>
                      <div className="font-semibold text-primary-600 dark:text-primary-300">Full Day — 24 hours</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">From the morning zaffe to the after-party exit</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Getting married outside the city? We cover every region — mountain churches, coastal venues, and vineyard weddings alike.
              </p>
            </div>
          </div>
        </section>

        {/* Booking Section */}
        <section id="booking" className="py-12 md:py-20 bg-white dark:bg-gray-900 relative overflow-x-hidden">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative">
            <div className="text-center animate-fade-in-up">
              <p className="script-accent text-3xl text-primary-600 dark:text-primary-300 mb-2">yalla…</p>
              <h2 className="text-3xl md:text-5xl text-gray-900 dark:text-white mb-3 md:mb-4">
                Plan Your Cortège
              </h2>
              <p className="text-base md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Tell us your date, church, and venue in your own words — we&apos;ll build your personalized quote instantly.
              </p>
            </div>

            <div className="mt-10 md:mt-16 max-w-2xl mx-auto">
              <AIBookingAssistant />
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-16 md:py-20 bg-cream-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl text-charcoal-500 dark:text-white mb-4">
                Our Services
              </h2>
              <p className="text-lg text-warm-600 dark:text-gray-400 max-w-2xl mx-auto">
                Everything on wheels for a Lebanese wedding — from the bride&apos;s car to the last guest shuttle
              </p>
            </div>

            <ServiceCardsGrid className="mb-8 lg:grid-cols-4">
              <ServiceCard
                icon={
                  <svg viewBox="0 0 40 40" className="w-10 h-10" fill="none" aria-hidden="true">
                    <circle cx="14" cy="18" r="9" stroke="#9C7838" strokeWidth="2.5" />
                    <circle cx="26" cy="18" r="9" stroke="#DBA396" strokeWidth="2.5" />
                    <path d="M 20 33 h 0" />
                  </svg>
                }
                title="The Wedding Cortège"
                excerpt="A full convoy for the big day — bridal car, family cars, and groomsmen vehicles moving together from door to church to venue, perfectly timed."
                link="/services/wedding-cortege"
              />
              <ServiceCard
                icon={
                  <svg viewBox="0 0 40 40" className="w-10 h-10" fill="none" aria-hidden="true">
                    <path d="M6 26 q2 -8 8 -9 l4 -1 q4 -5 9 -5 l3 0 q5 1 6 7 l0 6 q0 2 -2 2 l-26 0 q-2 0 -2 -2 Z" stroke="#9C7838" strokeWidth="2" />
                    <circle cx="13" cy="28" r="3.5" fill="#9C7838" />
                    <circle cx="29" cy="28" r="3.5" fill="#9C7838" />
                    <circle cx="31" cy="13" r="3" fill="#DBA396" />
                  </svg>
                }
                title="Bridal Car & Chauffeur"
                excerpt="An elegant decorated car with a suited chauffeur dedicated to the bride and groom — calm, punctual, and camera-ready all day."
                link="/services/bridal-car"
              />
              <ServiceCard
                icon={
                  <svg viewBox="0 0 40 40" className="w-10 h-10" fill="none" aria-hidden="true">
                    <rect x="6" y="12" width="28" height="20" rx="2.5" stroke="#9C7838" strokeWidth="2" />
                    <circle cx="20" cy="22" r="6" stroke="#9C7838" strokeWidth="2" />
                    <circle cx="20" cy="22" r="2.5" fill="#DBA396" />
                    <path d="M13 12 l3 -4 h8 l3 4" stroke="#9C7838" strokeWidth="2" />
                  </svg>
                }
                title="Classic & Convertible Cars"
                excerpt="Timeless classics and open-top cars for the church exit and the photo session — the shots that end up framed in the salon."
                link="/services/photoshoot-cars"
              />
              <ServiceCard
                icon={
                  <svg viewBox="0 0 40 40" className="w-10 h-10" fill="none" aria-hidden="true">
                    <rect x="5" y="10" width="30" height="18" rx="3" stroke="#9C7838" strokeWidth="2" />
                    <path d="M5 20 h30" stroke="#9C7838" strokeWidth="2" />
                    <circle cx="12" cy="31" r="3" fill="#9C7838" />
                    <circle cx="28" cy="31" r="3" fill="#9C7838" />
                    <path d="M11 15 h4 M18 15 h4 M25 15 h4" stroke="#DBA396" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                }
                title="Guest Shuttle Vans"
                excerpt="Comfortable vans and minibuses that move your guests between hotels, church, and venue — nobody gets lost on the mountain road."
                link="/services/guest-shuttle"
              />
            </ServiceCardsGrid>

            <div className="text-center mt-8">
              <Link
                href="/booking"
                className="inline-block bg-gradient-to-br from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-8 py-3 rounded-md font-light transition-all hover:shadow-sm tracking-wider border border-primary-700"
              >
                Book Your Wedding Car
              </Link>
            </div>
          </div>
        </section>

        {reviews.length > 0 && (
          <ReviewsSection
            reviews={reviews}
            averageRating={ratingStats?.averageRating ?? 0}
            totalReviews={ratingStats?.totalReviews ?? 0}
            variant="home"
          />
        )}

        {/* Why Choose Us Section */}
        <section className="py-8 md:py-12 bg-cream-50 dark:bg-gray-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-6">
              <h2 className="text-xl md:text-2xl text-charcoal-500 dark:text-white mb-1">
                Why Couples Choose Us
              </h2>
              <p className="text-xs md:text-sm text-warm-600 dark:text-gray-400">
                Weddings are all we do — everywhere in Lebanon
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Zero-Stress Timing",
                  description: "We scout the route, plan for traffic and the zaffe, and get you to the church on time — every time",
                },
                {
                  title: "The Right Car",
                  description: "Bridal sedans, classics, convertibles, and family cars — decorated, spotless, and photo-ready",
                },
                {
                  title: "White-Glove Service",
                  description: "Suited chauffeurs who know weddings: doors held, dress protected, aunties handled with a smile",
                }
              ].map((feature, index) => (
                <div key={index} className="border-l-2 border-clay-400 dark:border-primary-500 pl-4 py-2">
                  <h3 className="text-base font-semibold text-charcoal-500 dark:text-gray-200 mb-2">{feature.title}</h3>
                  <p className="text-sm text-warm-600 dark:text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-10 md:py-12 bg-white dark:bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl text-charcoal-500 dark:text-white mb-2">Get in Touch</h2>
              <p className="text-sm md:text-base text-warm-600 dark:text-gray-400">
                Checking a date? Want a quote? We answer fast.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
              <a href={`tel:${config.contact.phone}`} className="bg-cream-50 dark:bg-gray-700 border border-warm-200 dark:border-gray-600 rounded-lg p-6 hover-lift text-center cursor-pointer hover:border-primary-600 dark:hover:border-primary-400 transition-all group">
                <PhoneIcon className="h-12 w-12 text-charcoal-500 dark:text-primary-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-charcoal-500 dark:text-white mb-2">Call Us</h3>
                <p className="text-sm text-warm-500 dark:text-gray-400 mb-3">7 days a week</p>
                <span className="inline-block text-sm font-medium text-clay-400 dark:text-primary-400 group-hover:text-primary-700 dark:group-hover:text-primary-300 py-2 px-3 rounded transition-colors">
                  {config.contact.phone}
                </span>
              </a>

              <a href={`https://wa.me/${config.contact.whatsapp}`} target="_blank" rel="noopener noreferrer" className="bg-cream-50 dark:bg-gray-700 border border-warm-200 dark:border-gray-600 rounded-lg p-6 hover-lift text-center cursor-pointer hover:border-[#25D366] dark:hover:border-green-300 transition-all group">
                <ChatBubbleLeftRightIcon className="h-12 w-12 text-charcoal-500 dark:text-green-300 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-charcoal-500 dark:text-white mb-2">WhatsApp</h3>
                <p className="text-sm text-warm-500 dark:text-gray-400 mb-3">Quick Response</p>
                <span className="inline-block text-sm font-medium text-clay-400 dark:text-green-300 group-hover:text-[#25D366] dark:group-hover:text-green-300 py-2 px-3 rounded transition-colors">
                  Start Chat
                </span>
              </a>

              <div className="bg-cream-50 dark:bg-gray-700 border border-warm-200 dark:border-gray-600 rounded-lg p-6 text-center">
                <svg className="h-12 w-12 mx-auto mb-4" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                  <path d="M24 6 C 16 6 10 12 10 20 C 10 30 24 42 24 42 C 24 42 38 30 38 20 C 38 12 32 6 24 6 Z" stroke="#9C7838" strokeWidth="2.5" />
                  <circle cx="24" cy="20" r="5" fill="#DBA396" />
                </svg>
                <h3 className="text-lg font-semibold text-charcoal-500 dark:text-white mb-2">Location</h3>
                <p className="text-sm text-warm-500 dark:text-gray-400">Beirut, Lebanon — serving all regions</p>
              </div>
            </div>

            {/* Service Coverage */}
            <div className="mt-12 text-center">
              <div className="bg-cream-50 dark:bg-gray-700 border border-warm-200 dark:border-gray-600 rounded-md p-6 md:p-8">
                <h3 className="text-lg md:text-xl font-bold text-charcoal-500 dark:text-white mb-3">Wedding Coverage</h3>
                <p className="text-sm text-warm-600 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto">
                  Wedding cars across all Lebanon: Beirut, Jounieh &amp; Harissa, Byblos, Batroun, Broummana &amp; the Metn,
                  Faraya &amp; Faqra, the Chouf, Zahle &amp; the Bekaa, the South and the North. Bridal cars, cortège convoys,
                  photoshoot classics, and guest shuttles — one team for the whole day.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <Footer />
      </main>
    </>
  )
}
