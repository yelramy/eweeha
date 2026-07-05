'use client'

import { useRef, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import ImageWithFallback from '@/components/ImageWithFallback'
import { fleetCardImageUrl } from '@/lib/cloudinaryImages'

const MAX_SLIDES = 8

type CardImageCarouselProps = {
  /** main image first, then gallery — duplicates are removed */
  images: string[]
  alt: string
  /** Tailwind aspect class for the frame */
  aspectClass?: string
  sizes?: string
  quality?: number
}

/**
 * Swipeable photo carousel for fleet cards (picker, /fleet grid, booking form).
 * Scroll-snap swiping on touch, hover arrows on desktop, dot indicators.
 * Safe to place inside a clickable card: arrow clicks don't bubble.
 * (Not used inside the homepage rows — a swipeable photo inside a swipeable
 * row is a gesture conflict; those cards keep a single photo.)
 */
export default function CardImageCarousel({
  images,
  alt,
  aspectClass = 'aspect-[4/3]',
  sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px',
  quality = 70,
}: CardImageCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)

  const slides = [...new Set(images.filter(Boolean))].slice(0, MAX_SLIDES)

  const fallback = <div className="absolute inset-0 bg-warm-100 dark:bg-gray-800" />

  if (slides.length <= 1) {
    return (
      <div className={`relative overflow-hidden bg-cream-100 dark:bg-gray-900 ${aspectClass}`}>
        <ImageWithFallback
          src={fleetCardImageUrl(slides[0] || '')}
          alt={alt}
          fill
          sizes={sizes}
          quality={quality}
          objectFit="contain"
          className="p-1.5"
          fallback={fallback}
        />
      </div>
    )
  }

  const handleScroll = () => {
    const el = scrollerRef.current
    if (!el || el.clientWidth === 0) return
    const next = Math.round(el.scrollLeft / el.clientWidth)
    if (next !== index) setIndex(Math.min(slides.length - 1, Math.max(0, next)))
  }

  const go = (e: React.MouseEvent, delta: number) => {
    // Don't select/navigate the parent card when using the arrows
    e.stopPropagation()
    e.preventDefault()
    const el = scrollerRef.current
    if (!el) return
    const next = Math.min(slides.length - 1, Math.max(0, index + delta))
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <div className={`group/photos relative overflow-hidden bg-cream-100 dark:bg-gray-900 ${aspectClass}`}>
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
        aria-label={`${alt} — ${slides.length} photos, swipe to browse`}
      >
        {slides.map((src, i) => (
          <div key={i} className="relative w-full h-full flex-shrink-0 snap-center">
            <ImageWithFallback
              src={fleetCardImageUrl(src)}
              alt={i === 0 ? alt : `${alt} — photo ${i + 1}`}
              fill
              sizes={sizes}
              quality={quality}
              objectFit="contain"
              className="p-1.5"
              fallback={fallback}
            />
          </div>
        ))}
      </div>

      {/* Desktop arrows */}
      <button
        type="button"
        onClick={(e) => go(e, -1)}
        disabled={index === 0}
        aria-label="Previous photo"
        className="hidden sm:flex absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 items-center justify-center rounded-full bg-white/85 dark:bg-gray-900/85 text-charcoal-600 dark:text-white shadow opacity-0 group-hover/photos:opacity-100 transition-opacity disabled:opacity-0 z-10"
      >
        <ChevronLeftIcon className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={(e) => go(e, 1)}
        disabled={index >= slides.length - 1}
        aria-label="Next photo"
        className="hidden sm:flex absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 items-center justify-center rounded-full bg-white/85 dark:bg-gray-900/85 text-charcoal-600 dark:text-white shadow opacity-0 group-hover/photos:opacity-100 transition-opacity disabled:opacity-0 z-10"
      >
        <ChevronRightIcon className="w-4 h-4" />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-1.5 py-1 rounded-full bg-black/25 backdrop-blur-[2px] z-10 pointer-events-none">
        {slides.map((_, i) => (
          <span
            key={i}
            className={`rounded-full transition-all ${
              i === index ? 'w-2 h-2 bg-white' : 'w-1.5 h-1.5 bg-white/55'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
