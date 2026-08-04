'use client'

import { useMemo, useState, useEffect } from 'react'
import { Vehicle } from '@/types/vehicle'
import ImageWithFallback from '@/components/ImageWithFallback'
import Footer from '@/components/Footer'
import Breadcrumbs from '@/components/Breadcrumbs'
import BackToTop from '@/components/BackToTop'
import ReviewsSection from '@/components/ReviewsSection'
import ReviewStars from '@/components/ReviewStars'
import type { Review, VehicleRatingStats } from '@/lib/reviews'
import { getFromPrice, getZonePrices } from '@/utils/vehiclePricing'
import {
  FleetCategory,
  FLEET_CATEGORIES,
  sortFleetForDisplay,
} from '@/lib/fleetCategories'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { events } from '@/lib/posthog'

// Section headings sit one step above the body text — clearly a heading,
// without the weight of the page title.
const SECTION_HEADING = 'text-[17px] md:text-lg font-semibold text-gray-900 tracking-tight mb-2'
const SECTION_BODY = 'text-[15px] md:text-base text-gray-600 leading-relaxed whitespace-pre-line max-w-3xl'

interface VehicleDetailClientProps {
  vehicle: Vehicle
  config: {
    contact: { phone: string; whatsapp: string; email: string }
    currency: { usdToLbp: number; primaryCurrency: string }
    business: { name: string; address: string; workingHours: string }
    payment: { testMode: boolean; minimumAmount: number }
  }
  reviews?: Review[]
  ratingStats?: VehicleRatingStats
  allVehicles?: Vehicle[]
  categories?: FleetCategory[]
}

export default function VehicleDetailClient({
  vehicle,
  config,
  reviews = [],
  ratingStats,
  allVehicles = [],
  categories: categoriesProp,
}: VehicleDetailClientProps) {
  const router = useRouter()
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [thumbnailPage, setThumbnailPage] = useState(0)

  const THUMBNAILS_PER_PAGE = 12

  useEffect(() => {
    events.vehicleViewed(vehicle.id, vehicle.name, 'detail_page')
  }, [vehicle.id, vehicle.name])

  const resolvedCategories: FleetCategory[] = categoriesProp?.length ? categoriesProp : FLEET_CATEGORIES

  // Prev/Next walk the fleet in the same order as the fleet & homepage rows,
  // which keeps cars of the same category next to each other.
  const siblings = useMemo(
    () => sortFleetForDisplay(allVehicles.length ? allVehicles : [vehicle], resolvedCategories),
    [allVehicles, vehicle, resolvedCategories]
  )

  const bundleVehicles = useMemo(() => {
    const ids = vehicle.bundleVehicleIds ?? []
    if (ids.length === 0 || allVehicles.length === 0) return []
    const byId = new Map(allVehicles.map((v) => [v.id, v]))
    return ids
      .map((id) => byId.get(id))
      .filter((v): v is Vehicle => Boolean(v) && v!.id !== vehicle.id)
  }, [vehicle.bundleVehicleIds, vehicle.id, allVehicles])

  const detailSections = (vehicle.detailSections ?? []).filter(
    (s) => s.title.trim() || s.body.trim()
  )

  const currentIndex = siblings.findIndex((v) => v.id === vehicle.id)
  const prevVehicle =
    siblings.length > 0
      ? siblings[currentIndex > 0 ? currentIndex - 1 : siblings.length - 1]
      : null
  const nextVehicle =
    siblings.length > 0
      ? siblings[currentIndex >= 0 && currentIndex < siblings.length - 1 ? currentIndex + 1 : 0]
      : null

  const goPrev = () => {
    if (!prevVehicle || prevVehicle.id === vehicle.id) return
    router.push(`/fleet/${prevVehicle.id}`)
  }

  const goNext = () => {
    if (!nextVehicle || nextVehicle.id === vehicle.id) return
    router.push(`/fleet/${nextVehicle.id}`)
  }

  const allImages = [vehicle.images.main, ...vehicle.images.gallery]
  const zonePrices = getZonePrices(vehicle)

  const totalThumbnailPages = Math.ceil(allImages.length / THUMBNAILS_PER_PAGE)
  const thumbnailStartIndex = thumbnailPage * THUMBNAILS_PER_PAGE
  const thumbnailEndIndex = thumbnailStartIndex + THUMBNAILS_PER_PAGE
  const currentThumbnails = allImages.slice(thumbnailStartIndex, thumbnailEndIndex)

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % allImages.length)
  }

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length)
  }

  const goToThumbnailPage = (page: number) => {
    setThumbnailPage(page)
  }

  const selectImage = (index: number) => {
    const actualIndex = thumbnailStartIndex + index
    setSelectedImageIndex(actualIndex)
  }

  const navDisabled = siblings.length <= 1

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
          <div className="flex items-center justify-between gap-3">
            <Link href="/fleet" className="text-slate-700 hover:text-slate-900 flex items-center text-sm md:text-base font-medium min-h-[48px] px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronLeftIcon className="h-5 w-5 md:h-6 md:w-6 mr-1 rtl:mr-0 rtl:ml-1 rtl:rotate-180" />
              <span className="hidden sm:inline">Back to Fleet</span>
              <span className="sm:hidden">Back</span>
            </Link>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={goPrev}
                disabled={navDisabled || !prevVehicle}
                className="border border-slate-300 text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900 text-sm font-medium min-h-[40px] flex items-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-default"
                aria-label="Previous vehicle"
              >
                <ChevronLeftIcon className="h-4 w-4 rtl:rotate-180" />
                <span>Prev</span>
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={navDisabled || !nextVehicle}
                className="border border-slate-300 text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900 text-sm font-medium min-h-[40px] flex items-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-default"
                aria-label="Next vehicle"
              >
                <span>Next</span>
                <ChevronRightIcon className="h-4 w-4 rtl:rotate-180" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <Breadcrumbs items={[
          { label: 'Fleet', href: '/fleet' },
          { label: vehicle.name, href: `/fleet/${vehicle.id}` }
        ]} className="mb-6 hidden sm:block" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div>
            <div className="mb-4">
              <div className="aspect-w-16 aspect-h-12 bg-gray-200 rounded-xl overflow-hidden relative">
                <ImageWithFallback
                  src={allImages[selectedImageIndex]}
                  alt={`${vehicle.name} - Image ${selectedImageIndex + 1}`}
                  width={600}
                  height={400}
                  className="w-full h-72 md:h-96 object-cover cursor-pointer"
                  priority
                  fallback={<div className="w-full h-72 md:h-96 bg-slate-100 flex items-center justify-center"><div className="text-8xl">🚐</div></div>}
                />

                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 text-white p-3 md:p-2 rounded-full hover:bg-opacity-80 transition-all min-h-[48px] min-w-[48px] md:min-h-0 md:min-w-0 flex items-center justify-center"
                      aria-label="Previous image"
                    >
                      <ChevronLeftIcon className="h-6 w-6 md:h-6 md:w-6 rtl:rotate-180" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 text-white p-3 md:p-2 rounded-full hover:bg-opacity-80 transition-all min-h-[48px] min-w-[48px] md:min-h-0 md:min-w-0 flex items-center justify-center"
                      aria-label="Next image"
                    >
                      <ChevronRightIcon className="h-6 w-6 md:h-6 md:w-6 rtl:rotate-180" />
                    </button>
                  </>
                )}

                <div className="absolute bottom-3 right-3 bg-black bg-opacity-60 text-white px-3 py-2 rounded-lg text-sm md:text-base font-medium">
                  {selectedImageIndex + 1} / {allImages.length}
                </div>
              </div>
            </div>

            {allImages.length > 1 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs md:text-sm text-gray-600 font-medium">
                    Photos {thumbnailStartIndex + 1}-{Math.min(thumbnailEndIndex, allImages.length)} of {allImages.length}
                  </p>
                  {totalThumbnailPages > 1 && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => goToThumbnailPage(Math.max(0, thumbnailPage - 1))}
                        disabled={thumbnailPage === 0}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-gray-100 transition-colors"
                        aria-label="Previous thumbnail page"
                      >
                        <ChevronLeftIcon className="h-5 w-5 rtl:rotate-180" />
                      </button>
                      <span className="text-xs md:text-sm text-gray-600 font-medium">
                        {thumbnailPage + 1} / {totalThumbnailPages}
                      </span>
                      <button
                        onClick={() => goToThumbnailPage(Math.min(totalThumbnailPages - 1, thumbnailPage + 1))}
                        disabled={thumbnailPage === totalThumbnailPages - 1}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-gray-100 transition-colors"
                        aria-label="Next thumbnail page"
                      >
                        <ChevronRightIcon className="h-5 w-5 rtl:rotate-180" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {currentThumbnails.map((image, index) => {
                    const actualIndex = thumbnailStartIndex + index
                    return (
                      <button
                        key={actualIndex}
                        onClick={() => selectImage(index)}
                        className={`aspect-square rounded overflow-hidden border-2 ${
                          selectedImageIndex === actualIndex ? 'border-slate-500' : 'border-transparent'
                        }`}
                        aria-label={`View image ${actualIndex + 1}`}
                      >
                        <ImageWithFallback
                          src={image}
                          alt={`${vehicle.name} thumbnail ${actualIndex + 1}`}
                          width={100}
                          height={100}
                          className="w-full h-full object-cover"
                          fallback={<div className="w-full h-full bg-gray-200"></div>}
                        />
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Vehicle Details */}
          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <h1
                className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 leading-snug tracking-tight text-balance break-words min-w-0"
                dir="auto"
              >
                {vehicle.name}
              </h1>
              <div className="text-[11px] sm:text-xs text-right flex-shrink-0">
                {zonePrices.length > 0 ? (
                  <>
                    <div className="space-y-0.5 text-gray-600">
                      {zonePrices.map((zone) => (
                        <div key={zone.id} className="whitespace-nowrap">
                          <span className="text-gray-400">{zone.shortLabel}:</span>{' '}
                          <span className="font-semibold text-gray-900 tabular-nums">${zone.price}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-gray-500 mt-1">Per wedding — fuel included</p>
                  </>
                ) : (
                  <span className="text-gray-500">Contact for pricing</span>
                )}
              </div>
            </div>

            {ratingStats && ratingStats.totalReviews > 0 && (
              <a href="#reviews" className="inline-flex items-center gap-2 mb-6 text-sm text-gray-700 hover:text-gray-900">
                <ReviewStars rating={ratingStats.averageRating} size="sm" />
                <span className="font-medium">{ratingStats.averageRating.toFixed(1)}</span>
                <span className="text-gray-500">({ratingStats.totalReviews} {ratingStats.totalReviews === 1 ? 'review' : 'reviews'})</span>
              </a>
            )}

            <div className="grid grid-cols-2 gap-5 mb-8 bg-white rounded-xl p-5 border-2 border-gray-200">
              <div>
                <h3 className="font-bold text-gray-900 text-base md:text-lg mb-1">Passengers</h3>
                <p className="text-gray-600 text-sm md:text-base">
                  {vehicle.maxPassengers ? `${vehicle.maxPassengers} passengers` : vehicle.capacity || 'Contact us'}
                </p>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base md:text-lg mb-1">Luggage</h3>
                <p className="text-gray-600 text-sm md:text-base">
                  {vehicle.maxLuggage ? `${vehicle.maxLuggage} bags` : 'Contact us'}
                </p>
              </div>
              {vehicle.seatingLayout && (
                <div className="col-span-2">
                  <h3 className="font-bold text-gray-900 text-base md:text-lg mb-1">Seat Layout</h3>
                  <p className="text-gray-600 text-sm md:text-base" dir="auto">{vehicle.seatingLayout}</p>
                </div>
              )}
            </div>

            {vehicle.features && vehicle.features.length > 0 && (
              <div className="mb-8">
                <h3 className="font-bold text-gray-900 mb-4 text-lg md:text-xl">Features</h3>
                <div className="flex flex-wrap gap-3">
                  {vehicle.features.map((feature, index) => (
                    <span key={index} className="px-4 py-2 bg-slate-100 text-slate-700 text-sm md:text-base rounded-lg font-medium border border-slate-200" dir="auto">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={`/booking?vehicle=${vehicle.id}`}
                className="bg-slate-800 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-slate-900 text-center text-sm md:text-base min-h-[44px] flex items-center justify-center transition-all"
              >
                Book This Vehicle
              </Link>
              <a
                href={`tel:${config.contact.phone}`}
                className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-50 text-center text-sm md:text-base min-h-[44px] flex items-center justify-center transition-all"
              >
                Call to Inquire
              </a>
            </div>
          </div>
        </div>

        {/* Content sections — description, custom sections, then the bundle, in order */}
        {(vehicle.description?.trim() || detailSections.length > 0 || bundleVehicles.length > 0) && (
          <div className="mt-10 pt-8 border-t border-gray-200 divide-y divide-gray-200">
            {vehicle.description?.trim() && (
              <section className="pb-7">
                <h2 className={SECTION_HEADING} dir="auto">
                  {vehicle.descriptionTitle?.trim() || 'Description'}
                </h2>
                <p className={SECTION_BODY} dir="auto">{vehicle.description}</p>
              </section>
            )}

            {detailSections.map((section) => (
              <section key={section.id} className="py-7 first:pt-0">
                {section.title.trim() && (
                  <h2 className={SECTION_HEADING} dir="auto">{section.title}</h2>
                )}
                {section.body.trim() && (
                  <p className={SECTION_BODY} dir="auto">{section.body}</p>
                )}
              </section>
            ))}

            {bundleVehicles.length > 0 && (
              <section className="py-7 first:pt-0 last:pb-0">
                <h2 className={SECTION_HEADING} dir="auto">
                  {vehicle.bundleTitle?.trim() || `Pairs well with the ${vehicle.name}`}
                </h2>
                {vehicle.bundleBody?.trim() && (
                  <p className={`${SECTION_BODY} mb-5`} dir="auto">{vehicle.bundleBody}</p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {bundleVehicles.map((bundled) => (
                    <Link
                      key={bundled.id}
                      href={`/fleet/${bundled.id}`}
                      className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-slate-400 hover:shadow-md transition-all"
                    >
                      <ImageWithFallback
                        src={bundled.images.main}
                        alt={bundled.name}
                        width={320}
                        height={220}
                        className="w-full h-32 sm:h-40 object-cover"
                        fallback={<div className="w-full h-32 sm:h-40 bg-slate-100" />}
                      />
                      <div className="p-3">
                        <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2" dir="auto">
                          {bundled.name}
                        </p>
                        <div className="flex items-baseline justify-between gap-2 mt-1">
                          {bundled.maxPassengers ? (
                            <span className="text-[11px] text-gray-500 whitespace-nowrap">{bundled.maxPassengers} pax</span>
                          ) : <span />}
                          {getFromPrice(bundled) ? (
                            <span className="text-xs text-gray-600 whitespace-nowrap">
                              from <span className="font-semibold text-sm text-gray-900">${getFromPrice(bundled)}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 whitespace-nowrap">ask price</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
      {reviews.length > 0 && ratingStats && (
        <div id="reviews" className="bg-slate-50 border-t border-slate-200 scroll-mt-20">
          <ReviewsSection
            reviews={reviews}
            averageRating={ratingStats.averageRating}
            totalReviews={ratingStats.totalReviews}
            variant="vehicle"
          />
        </div>
      )}

      <Footer />
      <BackToTop />
    </div>
  )
}
