'use client'

import { useState, useEffect } from 'react'
import { Vehicle } from '@/types/vehicle'
import ImageWithFallback from '@/components/ImageWithFallback'
import Footer from '@/components/Footer'
import Breadcrumbs from '@/components/Breadcrumbs'
import BackToTop from '@/components/BackToTop'
import ReviewsSection from '@/components/ReviewsSection'
import ReviewStars from '@/components/ReviewStars'
import type { Review, VehicleRatingStats } from '@/lib/reviews'
import { getZonePrices } from '@/utils/vehiclePricing'
import Link from 'next/link'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { events } from '@/lib/posthog'

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
}

export default function VehicleDetailClient({ vehicle, config, reviews = [], ratingStats }: VehicleDetailClientProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [thumbnailPage, setThumbnailPage] = useState(0)
  
  const THUMBNAILS_PER_PAGE = 12

  // Track vehicle view on mount
  useEffect(() => {
    events.vehicleViewed(vehicle.id, vehicle.name, 'detail_page')
  }, [vehicle.id, vehicle.name])

  // Combine main image with gallery images
  const allImages = [vehicle.images.main, ...vehicle.images.gallery]
  const zonePrices = getZonePrices(vehicle)
  
  // Pagination logic for thumbnails
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="text-slate-700 hover:text-slate-900 flex items-center text-sm md:text-base font-medium min-h-[48px] px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronLeftIcon className="h-5 w-5 md:h-6 md:w-6 mr-1" />
              <span className="hidden sm:inline">Back to Fleet</span>
              <span className="sm:hidden">Back</span>
            </Link>
            <Link href={`/booking?vehicle=${vehicle.id}`} className="bg-slate-800 text-white px-5 md:px-6 py-3 rounded-lg hover:bg-slate-900 text-sm md:text-base font-semibold min-h-[48px] flex items-center transition-colors">
              <span className="hidden sm:inline">Book This Vehicle</span>
              <span className="sm:hidden">Book Now</span>
            </Link>
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
            {/* Main Image */}
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
                
                {/* Image Navigation */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 text-white p-3 md:p-2 rounded-full hover:bg-opacity-80 transition-all min-h-[48px] min-w-[48px] md:min-h-0 md:min-w-0 flex items-center justify-center"
                      aria-label="Previous image"
                    >
                      <ChevronLeftIcon className="h-6 w-6 md:h-6 md:w-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 text-white p-3 md:p-2 rounded-full hover:bg-opacity-80 transition-all min-h-[48px] min-w-[48px] md:min-h-0 md:min-w-0 flex items-center justify-center"
                      aria-label="Next image"
                    >
                      <ChevronRightIcon className="h-6 w-6 md:h-6 md:w-6" />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                <div className="absolute bottom-3 right-3 bg-black bg-opacity-60 text-white px-3 py-2 rounded-lg text-sm md:text-base font-medium">
                  {selectedImageIndex + 1} / {allImages.length}
                </div>
              </div>
            </div>

            {/* Thumbnail Gallery */}
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
                        <ChevronLeftIcon className="h-5 w-5" />
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
                        <ChevronRightIcon className="h-5 w-5" />
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

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">{vehicle.name}</h1>

            {ratingStats && ratingStats.totalReviews > 0 && (
              <a href="#reviews" className="inline-flex items-center gap-2 mb-4 text-sm text-gray-700 hover:text-gray-900">
                <ReviewStars rating={ratingStats.averageRating} size="sm" />
                <span className="font-medium">{ratingStats.averageRating.toFixed(1)}</span>
                <span className="text-gray-500">({ratingStats.totalReviews} {ratingStats.totalReviews === 1 ? 'review' : 'reviews'})</span>
              </a>
            )}

            {/* Pricing */}
            <div className="mb-6 bg-slate-50 rounded-xl p-5">
              {zonePrices.length > 0 ? (
                <>
                  <div className="flex flex-wrap gap-4 md:gap-6">
                    {zonePrices.map((zone) => (
                      <div key={zone.id}>
                        <span className="text-2xl md:text-3xl font-bold text-slate-800">${zone.price}</span>
                        <span className="block text-sm text-gray-500 mt-0.5">{zone.label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">Per wedding, depending on your venue location — chauffeur &amp; fuel included</p>
                </>
              ) : (
                <span className="text-2xl md:text-3xl font-bold text-slate-800">Contact for pricing</span>
              )}
            </div>

            <p className="text-base md:text-lg text-gray-700 mb-8 leading-relaxed">{vehicle.description}</p>

            {/* Specifications */}
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
                  <p className="text-gray-600 text-sm md:text-base">{vehicle.seatingLayout}</p>
                </div>
              )}
            </div>

            {/* Features */}
            {vehicle.features && vehicle.features.length > 0 && (
              <div className="mb-8">
                <h3 className="font-bold text-gray-900 mb-4 text-lg md:text-xl">Features</h3>
                <div className="flex flex-wrap gap-3">
                  {vehicle.features.map((feature, index) => (
                    <span key={index} className="px-4 py-2 bg-slate-100 text-slate-700 text-sm md:text-base rounded-lg font-medium border border-slate-200">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Buttons */}
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

