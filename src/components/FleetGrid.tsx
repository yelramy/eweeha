'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Button from '@/components/Button'
import CardImageCarousel from '@/components/CardImageCarousel'
import { Vehicle } from '@/types/vehicle'
import { getZonePrices } from '@/utils/vehiclePricing'

const PAGE_SIZE = 12

type FleetGridProps = {
  vehicles: Vehicle[]
  /** Show Details + Book buttons (homepage / fleet page). Off for picker-style grids. */
  showActions?: boolean
  /** Initial page for controlled pagination from URL hash etc. */
  initialPage?: number
  /** Dark cards + gold/gray actions — for groom page on charcoal background. */
  tone?: 'default' | 'dark'
}

export default function FleetGrid({
  vehicles,
  showActions = true,
  initialPage = 1,
  tone = 'default',
}: FleetGridProps) {
  const [page, setPage] = useState(initialPage)
  const totalPages = Math.max(1, Math.ceil(vehicles.length / PAGE_SIZE))

  const pageVehicles = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return vehicles.slice(start, start + PAGE_SIZE)
  }, [vehicles, page])

  const go = (next: number) => {
    setPage(Math.min(totalPages, Math.max(1, next)))
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (vehicles.length === 0) {
    return (
      <p className={`text-center text-sm py-12 ${tone === 'dark' ? 'text-gray-400' : 'text-warm-600 dark:text-gray-400'}`}>
        Fleet list coming soon — message us on WhatsApp and we&apos;ll share what&apos;s available.
      </p>
    )
  }

  const isDark = tone === 'dark'
  const cardClass = isDark
    ? 'bg-gray-900/80 border border-gray-700'
    : 'bg-cream-50 dark:bg-gray-700 border border-warm-200 dark:border-gray-600'
  const titleClass = isDark ? 'text-cream-50' : 'text-charcoal-500 dark:text-white'
  const titleHover = isDark ? 'hover:text-gold-400' : 'hover:text-primary-700 dark:hover:text-primary-300'
  const metaClass = isDark ? 'text-gray-400' : 'text-warm-600 dark:text-gray-400'
  const chauffeurClass = isDark
    ? 'bg-gray-800/80 text-gold-300 border border-gray-600'
    : 'bg-primary-50 text-primary-700 border border-primary-200'
  const featureClass = isDark
    ? 'bg-gray-800 text-gray-300 border border-gray-600'
    : 'bg-cream-100 text-charcoal-500 border border-warm-200'
  const actionOutline =
    'flex-1 text-center px-3 py-1.5 rounded-md text-sm font-medium border border-gray-500 text-cream-100 hover:bg-gray-800 transition-colors'
  const actionGold =
    'flex-1 text-center px-3 py-1.5 rounded-md text-sm font-semibold bg-gold-600 hover:bg-gold-500 text-charcoal-500 transition-colors'

  return (
    <div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
        {pageVehicles.map((vehicle) => {
          const zonePrices = getZonePrices(vehicle)
          return (
            <div
              key={vehicle.id}
              className={`${cardClass} rounded-lg overflow-hidden hover-lift flex flex-col h-full`}
            >
              <div className="flex-shrink-0">
                <CardImageCarousel
                  images={[vehicle.images.main, ...(vehicle.images.gallery || [])]}
                  alt={`${vehicle.name} — wedding car with chauffeur in Lebanon`}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  quality={75}
                />
              </div>
              <div className="p-4 sm:p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-base sm:text-lg font-semibold ${titleClass} mb-1 leading-tight`}>
                      <Link href={`/fleet/${vehicle.id}`} className={`${titleHover} transition-colors`}>
                        {vehicle.name}
                      </Link>
                    </h3>
                    <p className={`text-xs sm:text-sm ${metaClass}`}>
                      {vehicle.maxPassengers ? `${vehicle.maxPassengers} passengers` : vehicle.capacity}
                    </p>
                  </div>
                  {zonePrices.length > 0 ? (
                    <div className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 space-y-0.5 flex-shrink-0 text-right">
                      {zonePrices.map((zone) => (
                        <div key={zone.id}>
                          <span className="text-gray-400">{zone.shortLabel}:</span>{' '}
                          <span className="font-semibold">${zone.price}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">Contact us</div>
                  )}
                </div>
                <div className="flex-1" />
                <div className="space-y-1.5 sm:space-y-2 text-xs mb-3">
                  <span className={`inline-flex px-2.5 py-1 rounded text-[11px] sm:text-xs ${chauffeurClass}`}>
                    Chauffeur included
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {vehicle.features.slice(0, 2).map((feature, i) => (
                      <span
                        key={i}
                        className={`px-2.5 py-1 rounded text-[11px] sm:text-xs ${featureClass}`}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
                {showActions ? (
                  <div className="flex gap-2">
                    {isDark ? (
                      <>
                        <Link href={`/fleet/${vehicle.id}`} className={actionOutline}>
                          Details
                        </Link>
                        <Link
                          href={`/booking?vehicle=${vehicle.id}`}
                          className={actionGold}
                          aria-label={`Book ${vehicle.name} wedding car with chauffeur included`}
                        >
                          Book
                        </Link>
                      </>
                    ) : (
                      <>
                        <Button href={`/fleet/${vehicle.id}`} variant="outline" size="sm" className="flex-1 font-medium">
                          Details
                        </Button>
                        <Button
                          href={`/booking?vehicle=${vehicle.id}`}
                          variant="warning"
                          size="sm"
                          className="flex-1 font-semibold"
                          aria-label={`Book ${vehicle.name} wedding car with chauffeur included`}
                        >
                          Book
                        </Button>
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      {totalPages > 1 ? (
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => go(page - 1)}
            disabled={page <= 1}
            className={`px-4 py-2 text-sm rounded-full border disabled:opacity-40 transition-colors ${
              isDark
                ? 'border-gray-600 text-gray-300 hover:bg-gray-800'
                : 'border-warm-300 dark:border-gray-600 hover:bg-cream-100 dark:hover:bg-gray-800'
            }`}
          >
            ← Previous
          </button>
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-warm-600 dark:text-gray-400'}`}>
            Page {page} of {totalPages}
            <span className="hidden sm:inline text-warm-500"> · {vehicles.length} cars</span>
          </span>
          <button
            type="button"
            onClick={() => go(page + 1)}
            disabled={page >= totalPages}
            className={`px-4 py-2 text-sm rounded-full border disabled:opacity-40 transition-colors ${
              isDark
                ? 'border-gray-600 text-gray-300 hover:bg-gray-800'
                : 'border-warm-300 dark:border-gray-600 hover:bg-cream-100 dark:hover:bg-gray-800'
            }`}
          >
            Next →
          </button>
        </div>
      ) : null}
    </div>
  )
}

export { PAGE_SIZE as FLEET_PAGE_SIZE }
