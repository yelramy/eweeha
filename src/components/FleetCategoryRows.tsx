'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import Button from '@/components/Button'
import FleetVehicleImage from '@/components/FleetVehicleImage'
import { Vehicle } from '@/types/vehicle'
import { groupFleetByCategory } from '@/lib/fleetCategories'
import { getFromPrice, getZonePricesTooltip } from '@/utils/vehiclePricing'

function RowCard({ vehicle }: { vehicle: Vehicle }) {
  const fromPrice = getFromPrice(vehicle)
  return (
    <div className="snap-start flex-shrink-0 w-[70vw] max-w-[270px] sm:w-60 md:w-64 bg-cream-50 dark:bg-gray-700 border border-warm-200 dark:border-gray-600 rounded-lg overflow-hidden flex flex-col hover-lift">
      <Link href={`/fleet/${vehicle.id}`} className="block">
        <FleetVehicleImage
          src={vehicle.images.main}
          alt={`${vehicle.name} — wedding car with chauffeur in Lebanon`}
        />
      </Link>
      <div className="p-3 flex flex-col flex-1">
        <h4 className="text-sm font-semibold text-charcoal-500 dark:text-white leading-tight line-clamp-2">
          {vehicle.name}
        </h4>
        <p className="text-xs text-warm-600 dark:text-gray-400 mt-0.5 mb-3">
          {vehicle.maxPassengers ? `${vehicle.maxPassengers} passengers · ` : ''}Chauffeur included
        </p>
        <div className="mt-auto">
          {fromPrice ? (
            <p className="mb-2" title={getZonePricesTooltip(vehicle)}>
              <span className="text-xs text-warm-600 dark:text-gray-400">From </span>
              <span className="text-base font-bold text-charcoal-500 dark:text-white">${fromPrice}</span>
              <span className="text-xs text-warm-600 dark:text-gray-400"> / wedding</span>
            </p>
          ) : (
            <p className="mb-2 text-xs text-warm-600 dark:text-gray-400">Ask for price</p>
          )}
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
        </div>
      </div>
    </div>
  )
}

function CategoryRow({
  title,
  blurb,
  vehicles,
}: {
  title: string
  blurb: string
  vehicles: Vehicle[]
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 8)
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8)
  }, [])

  useEffect(() => {
    updateArrows()
    const el = scrollerRef.current
    if (!el) return
    const observer = new ResizeObserver(updateArrows)
    observer.observe(el)
    return () => observer.disconnect()
  }, [updateArrows])

  const scrollByCards = (direction: 1 | -1) => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: direction * Math.round(el.clientWidth * 0.85), behavior: 'smooth' })
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-lg md:text-xl font-semibold text-charcoal-500 dark:text-white leading-tight">
            {title}{' '}
            <span className="text-sm font-normal text-warm-500 dark:text-gray-400">
              · {vehicles.length}
            </span>
          </h3>
          <p className="text-xs md:text-sm text-warm-600 dark:text-gray-400">{blurb}</p>
        </div>
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => scrollByCards(-1)}
            disabled={!canLeft}
            aria-label={`Scroll ${title} back`}
            className="w-9 h-9 rounded-full border border-warm-300 dark:border-gray-600 flex items-center justify-center text-charcoal-500 dark:text-gray-300 hover:bg-cream-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-default"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCards(1)}
            disabled={!canRight}
            aria-label={`Scroll ${title} forward`}
            className="w-9 h-9 rounded-full border border-warm-300 dark:border-gray-600 flex items-center justify-center text-charcoal-500 dark:text-gray-300 hover:bg-cream-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-default"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        onScroll={updateArrows}
        className="no-scrollbar flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 scroll-px-4 sm:-mx-6 sm:px-6 sm:scroll-px-6 pb-1"
      >
        {vehicles.map((vehicle) => (
          <RowCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>
    </div>
  )
}

/**
 * App-style fleet browser: one horizontally swipeable row per category
 * (scroll-snap on touch, arrow buttons on desktop).
 */
export default function FleetCategoryRows({ vehicles }: { vehicles: Vehicle[] }) {
  const groups = groupFleetByCategory(vehicles)

  if (groups.length === 0) {
    return (
      <p className="text-center text-sm text-warm-600 dark:text-gray-400 py-12">
        Fleet list coming soon — message us on WhatsApp and we&apos;ll share what&apos;s available.
      </p>
    )
  }

  return (
    <div className="space-y-8 md:space-y-10">
      {groups.map((group) => (
        <CategoryRow key={group.id} title={group.title} blurb={group.blurb} vehicles={group.vehicles} />
      ))}
    </div>
  )
}
