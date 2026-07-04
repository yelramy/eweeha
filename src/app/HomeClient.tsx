'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { PhoneIcon, ChatBubbleLeftRightIcon, Bars3Icon } from '@heroicons/react/24/outline'
import ImageWithFallback from '@/components/ImageWithFallback'
import AIBookingAssistant from '@/components/AIBookingAssistant'
import Button from '@/components/Button'
import MobileMenu from '@/components/MobileMenu'
import ConvoyPicker from '@/components/ConvoyPicker'
import LebanonFlag from '@/components/LebanonFlag'
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

export default function HomeClient({ initialVehicles, config, reviews = [], ratingStats }: HomeClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isConvoyPickerOpen, setIsConvoyPickerOpen] = useState(false)

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

        {/* Hero Section — soft photo backdrop + invitation copy */}
        <section className="relative overflow-hidden bg-cream-50 dark:bg-gray-900">
          {/* Background photo, kept airy with cream washes so it never overwhelms the text */}
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
            <Image
              src="/images/hero-bg.jpg"
              alt=""
              fill
              priority
              quality={75}
              sizes="100vw"
              className="object-cover object-[72%_center] dark:opacity-85 sm:dark:opacity-60"
            />
            {/* Mobile: top-heavy wash — strong behind the title, fading so the car stays rich below; Desktop: left gradient so the car side stays vivid */}
            <div className="absolute inset-0 sm:hidden bg-gradient-to-b from-cream-50/85 via-cream-50/45 to-cream-50/15 dark:from-gray-950/85 dark:via-gray-950/45 dark:to-gray-950/15" />
            <div className="hidden sm:block absolute inset-0 bg-gradient-to-r from-cream-50/95 via-cream-50/50 to-transparent dark:from-gray-950/95 dark:via-gray-950/55 dark:to-gray-950/10" />
            <div className="hidden sm:block absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-cream-50/15 dark:to-gray-950/30" />
          </div>

          <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20 md:py-32 z-10">
            <div className="max-w-2xl text-center lg:text-left animate-fade-in-up">
              <p className="text-[11px] md:text-xs tracking-[0.35em] uppercase text-primary-700 dark:text-primary-300 mb-5">
                Chauffeured wedding cars ·{' '}
                <span className="whitespace-nowrap">
                  All of Lebanon
                  <LebanonFlag className="inline-block w-[19px] h-[13px] md:w-[21px] md:h-[14px] rounded-[2px] ml-2 align-[-2px] shadow-sm" />
                </span>
              </p>

              <h1 className="mb-4">
                <span className="sr-only">Eweeha — wedding cars in Lebanon: </span>
                <span className="script-accent block text-primary-600 dark:text-primary-300 text-6xl sm:text-7xl md:text-8xl leading-none">
                  Eweeha!
                </span>
                <span className="font-serif italic font-semibold block text-gold-700 dark:text-gold-300 text-3xl sm:text-4xl md:text-5xl tracking-wide mt-3">
                  Smalla 3layke
                </span>
              </h1>

              <RibbonDivider className="w-48 mx-auto lg:mx-0 mb-5" />

              <p className="text-base md:text-lg text-charcoal-600 dark:text-gray-200 max-w-xl mx-auto lg:mx-0 leading-relaxed mb-8 font-light">
                Decorated bridal cars, classic convertibles, and full wedding convoys —
                ribbons, fresh flowers, and suited chauffeurs, on time wherever you
                celebrate, from Beirut to the mountains.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start items-center animate-fade-in-up stagger-2">
                <button
                  type="button"
                  onClick={() => setIsConvoyPickerOpen(true)}
                  className="w-full sm:w-auto px-8 py-3 text-center text-white text-sm font-medium tracking-wider bg-gradient-to-br from-primary-600 to-primary-800 hover:from-primary-700 hover:to-primary-900 rounded-full shadow-sm hover:shadow transition-all"
                >
                  Pick My Cars
                </button>
                <Link
                  href={`https://wa.me/${config.contact.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-8 py-3 text-center text-primary-700 dark:text-primary-200 text-sm font-medium tracking-wider border border-primary-300 dark:border-primary-400 rounded-full hover:bg-primary-50/90 dark:hover:bg-gray-800 bg-cream-50/85 dark:bg-gray-950/60 backdrop-blur-[3px] transition-all"
                >
                  WhatsApp Us
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2 text-xs md:text-sm font-medium text-charcoal-500 dark:text-gray-200">
                <span>Suited chauffeurs</span>
                <span aria-hidden="true" className="text-clay-300">✿</span>
                <span>Ribbon &amp; flower décor</span>
                <span aria-hidden="true" className="text-clay-300">✿</span>
                <span>On time, every time</span>
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
                Choose a car above, or tell us your ceremony and venue — we&apos;ll build the convoy around your timeline.
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
                      <div className="text-xs text-gray-600 dark:text-gray-400">Bride&apos;s prep → ceremony → photo session</div>
                    </div>
                    <div>
                      <div className="font-semibold text-primary-600 dark:text-primary-300">Celebration Package — 10 hours</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Prep → ceremony → photoshoot → grand venue entrance</div>
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
                Getting married outside the city? We cover every region — mountain ceremonies, coastal venues, and vineyard weddings alike.
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
                Plan Your Convoy
              </h2>
              <p className="text-base md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Tell us your date, ceremony, and venue in your own words — we&apos;ll build your personalized quote instantly.
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
                title="The Wedding Convoy"
                excerpt="A full convoy for the big day — bridal car, family cars, and groomsmen vehicles moving together from door to ceremony to venue, perfectly timed."
                link="/services/wedding-convoy"
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
                excerpt="Timeless classics and open-top cars for the ceremony exit and the photo session — the shots that end up framed in the salon."
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
                excerpt="Comfortable vans and minibuses that move your guests between hotels, ceremony, and venue — nobody gets lost on the mountain road."
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
                  description: "We scout the route, plan for traffic and the zaffe, and get you to your ceremony on time — every time",
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

        {/* What does "Eweeha" mean? — a little cultural interlude */}
        <section id="eweeha" className="relative overflow-hidden bg-primary-800 dark:bg-gray-950 py-12 md:py-16">
          {/* Oversized script watermark */}
          <span
            aria-hidden="true"
            className="script-accent absolute -top-6 -right-4 text-[10rem] md:text-[16rem] leading-none text-primary-700/40 dark:text-gray-800 select-none pointer-events-none"
          >
            Eweeha!
          </span>

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-8">
              <p className="script-accent text-2xl text-gold-300 mb-1">yalla, a quick Lebanese lesson</p>
              <h2 className="text-2xl md:text-3xl text-white">
                What Does &ldquo;Eweeha!&rdquo; Mean?
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-5 items-start">
              {/* Dictionary-entry card */}
              <div className="md:col-span-2 bg-cream-50 dark:bg-gray-900 rounded-xl p-6 shadow-lg border border-gold-400/40">
                <p className="flex items-baseline gap-2 flex-wrap">
                  <span className="script-accent text-4xl text-primary-700 dark:text-primary-300">Eweeha!</span>
                  <span className="text-sm text-warm-500 dark:text-gray-400 italic">/ew-wee-ha/</span>
                </p>
                <p className="text-[11px] tracking-[0.2em] uppercase text-gold-700 dark:text-gold-300 mt-1 mb-4">
                  exclamation · Lebanese
                </p>
                <ol className="space-y-3 text-sm text-charcoal-500 dark:text-gray-300 leading-relaxed list-decimal list-inside">
                  <li>The opening cry of the radde — the chant that officially starts a Lebanese wedding.</li>
                  <li>The call that rings down the street when the bridal car pulls up, ribbons flying and horns singing.</li>
                  <li><span className="italic">(this company)</span> The moment we deliver — decorated, on time, every weekend.</li>
                </ol>
              </div>

              {/* The story */}
              <div className="md:col-span-3 text-primary-50 space-y-4 text-sm md:text-base leading-relaxed font-light">
                <p>
                  In Lebanon, a wedding doesn&apos;t begin with a schedule — it begins with a sound.
                  The convoy turns into the street, the horns start their song, and whoever is
                  leading the radde lets it fly:
                  <span className="font-serif italic text-gold-200"> &ldquo;Eweeeeha! Smalla 3laykiii…&rdquo;</span> —
                  verse after verse, each one louder than the last. And the whole street answers
                  with the zalghouta: <span className="italic">lililililiiii!</span> Joy, pride,
                  and just the right amount of showing off.
                </p>
                <p>
                  That little blessing woven into the call — <span className="font-serif italic text-gold-200">&ldquo;Smalla 3layke,&rdquo;</span> God&apos;s
                  name upon you — is there because anything this beautiful needs protecting from the
                  evil eye. You&apos;ll hear it a hundred times on your big day. Count them, it&apos;s good luck.
                </p>
                <p>
                  We loved that exact moment — the arrival, the noise, the goosebumps — so much that
                  we named the whole company after it. Making that moment happen, on time and
                  camera-ready, is literally our job.
                </p>
                <Link
                  href="/about"
                  className="inline-block mt-1 text-sm text-gold-300 hover:text-gold-200 underline underline-offset-4 decoration-gold-400/50"
                >
                  Read our story →
                </Link>
              </div>
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

              <a href={`https://wa.me/${config.contact.whatsapp}`} target="_blank" rel="noopener noreferrer" className="bg-cream-50 dark:bg-gray-700 border border-warm-200 dark:border-gray-600 rounded-lg p-6 hover-lift text-center cursor-pointer hover:border-[#25D366] dark:hover:border-[#25D366] transition-all group">
                <ChatBubbleLeftRightIcon className="h-12 w-12 text-charcoal-500 dark:text-[#25D366] mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-charcoal-500 dark:text-white mb-2">WhatsApp</h3>
                <p className="text-sm text-warm-500 dark:text-gray-400 mb-3">Quick Response</p>
                <span className="inline-block text-sm font-medium text-clay-400 dark:text-[#25D366] group-hover:text-[#25D366] dark:group-hover:text-[#25D366] py-2 px-3 rounded transition-colors">
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
                  Aley &amp; Bhamdoun, Faraya &amp; Faqra, the Chouf, Zahle &amp; the whole Bekaa, the South down to Tyre,
                  and the North up to Akkar. Bridal cars, wedding convoys, photoshoot classics, and guest shuttles —
                  one team for the whole day.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <Footer />
      </main>

      <ConvoyPicker
        isOpen={isConvoyPickerOpen}
        onClose={() => setIsConvoyPickerOpen(false)}
        vehicles={initialVehicles}
      />
    </>
  )
}
