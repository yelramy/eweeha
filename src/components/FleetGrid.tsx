'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Button from '@/components/Button'
import FleetVehicleImage from '@/components/FleetVehicleImage'
import { Vehicle } from '@/types/vehicle'

const PAGE_SIZE = 12

type FleetGridProps = {
  vehicles: Vehicle[]
  /** Show Details + Book buttons (homepage / fleet page). Off for picker-style grids. */
  showActions?: boolean
  /** Initial page for controlled pagination from URL hash etc. */
  initialPage?: number
}

export default function FleetGrid({
  vehicles,
  showActions = true,
  initialPage = 1,
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
      <p className="text-center text-sm text-warm-600 dark:text-gray-400 py-12">
        Fleet list coming soon — message us on WhatsApp and we&apos;ll share what&apos;s available.
      </p>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
        {pageVehicles.map((vehicle) => {
          const hasPricing = vehicle.price6h || vehicle.price10h || vehicle.price24h
          return (
            <div
              key={vehicle.id}
              className="bg-cream-50 dark:bg-gray-700 border border-warm-200 dark:border-gray-600 rounded-lg overflow-hidden hover-lift flex flex-col h-full"
            >
              <Link href={`/fleet/${vehicle.id}`} className="block flex-shrink-0">
                <FleetVehicleImage
                  src={vehicle.images.main}
                  alt={`${vehicle.name} — wedding car with chauffeur in Lebanon`}
                />
              </Link>
              <div className="p-4 sm:p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-charcoal-500 dark:text-white mb-1 leading-tight">
                      {vehicle.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-warm-600 dark:text-gray-400">
                      {vehicle.maxPassengers ? `${vehicle.maxPassengers} passengers` : vehicle.capacity}
                    </p>
                  </div>
                  {hasPricing ? (
                    <div className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 space-y-0.5 flex-shrink-0 text-right">
                      {vehicle.price6h ? (
                        <div>
                          <span className="text-gray-400">6h:</span>{' '}
                          <span className="font-semibold">${vehicle.price6h}</span>
                        </div>
                      ) : null}
                      {vehicle.price10h ? (
                        <div>
                          <span className="text-gray-400">10h:</span>{' '}
                          <span className="font-semibold">${vehicle.price10h}</span>
                        </div>
                      ) : null}
                      {vehicle.price24h ? (
                        <div>
                          <span className="text-gray-400">24h:</span>{' '}
                          <span className="font-semibold">${vehicle.price24h}</span>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">Contact us</div>
                  )}
                </div>
                <div className="flex-1" />
                <div className="space-y-1.5 sm:space-y-2 text-xs mb-3">
                  <span className="inline-flex px-2.5 py-1 bg-primary-50 text-primary-700 border border-primary-200 rounded text-[11px] sm:text-xs">
                    Chauffeur included
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {vehicle.features.slice(0, 2).map((feature, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-cream-100 text-charcoal-500 border border-warm-200 rounded text-[11px] sm:text-xs"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
                {showActions ? (
                  <div className="flex gap-2">
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
            className="px-4 py-2 text-sm rounded-full border border-warm-300 dark:border-gray-600 disabled:opacity-40 hover:bg-cream-100 dark:hover:bg-gray-800 transition-colors"
          >
            ← Previous
          </button>
          <span className="text-sm text-warm-600 dark:text-gray-400">
            Page {page} of {totalPages}
            <span className="hidden sm:inline text-warm-500"> · {vehicles.length} cars</span>
          </span>
          <button
            type="button"
            onClick={() => go(page + 1)}
            disabled={page >= totalPages}
            className="px-4 py-2 text-sm rounded-full border border-warm-300 dark:border-gray-600 disabled:opacity-40 hover:bg-cream-100 dark:hover:bg-gray-800 transition-colors"
          >
            Next →
          </button>
        </div>
      ) : null}
    </div>
  )
}

export { PAGE_SIZE as FLEET_PAGE_SIZE }
