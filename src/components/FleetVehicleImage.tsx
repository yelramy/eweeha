'use client'

import ImageWithFallback from '@/components/ImageWithFallback'
import { fleetCardImageUrl } from '@/lib/cloudinaryImages'

type FleetVehicleImageProps = {
  src: string
  alt: string
  /** compact = picker thumbnails; card = homepage / fleet grid */
  variant?: 'compact' | 'card'
  className?: string
}

export default function FleetVehicleImage({
  src,
  alt,
  variant = 'card',
  className = '',
}: FleetVehicleImageProps) {
  const isCompact = variant === 'compact'

  return (
    <div
      className={`relative overflow-hidden bg-cream-100 dark:bg-gray-900 ${
        isCompact ? 'aspect-[5/3]' : 'aspect-[4/3]'
      } ${className}`}
    >
      <ImageWithFallback
        src={fleetCardImageUrl(src)}
        alt={alt}
        fill
        sizes={isCompact ? '160px' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
        quality={isCompact ? 65 : 75}
        objectFit="contain"
        className={isCompact ? 'p-1.5' : 'p-2 sm:p-3'}
        fallback={<div className="absolute inset-0 bg-warm-100 dark:bg-gray-800" />}
      />
    </div>
  )
}
