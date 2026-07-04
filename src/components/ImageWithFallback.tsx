'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ImageWithFallbackProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  fallback?: React.ReactNode
  priority?: boolean
  loading?: 'lazy' | 'eager'
  sizes?: string
  fill?: boolean
  quality?: number
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  // SEO enhancements
  title?: string
  fetchPriority?: 'high' | 'low' | 'auto'
}

/**
 * Optimized Image Component with SEO enhancements
 * 
 * Features:
 * - Automatic lazy loading (unless priority is set)
 * - Blur placeholder for better perceived performance
 * - Fallback for broken images
 * - Proper alt text for accessibility and SEO
 * - Responsive sizing with srcset
 * - Title attribute for additional context
 */
export default function ImageWithFallback({
  src,
  alt,
  width,
  height,
  className = '',
  fallback,
  priority = false,
  loading,
  sizes,
  fill = false,
  quality = 75,
  objectFit = 'cover',
  title,
  fetchPriority
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Ensure alt text is meaningful (basic validation)
  const optimizedAlt = alt || 'Wedding car service image'
  const imageTitle = title || optimizedAlt

  if (hasError) {
    return fallback || (
      <div
        className={`bg-gradient-to-br from-warm-100 to-warm-200 flex items-center justify-center ${className}`}
        style={!fill ? { width: width || 'auto', height: height || 'auto' } : undefined}
        role="img"
        aria-label={optimizedAlt}
      >
        <div className="text-4xl opacity-50">🚐</div>
      </div>
    )
  }

  // Optimized blur placeholder (tiny base64 image)
  const blurDataURL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Cfilter id='b' color-interpolation-filters='sRGB'%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3CfeColorMatrix values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 100 -1' result='s'/%3E%3CfeFlood x='0' y='0' width='100%25' height='100%25'/%3E%3CfeComposite operator='out' in='s'/%3E%3CfeComposite in2='SourceGraphic'/%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3C/filter%3E%3Cimage width='100%25' height='100%25' x='0' y='0' preserveAspectRatio='none' style='filter: url(%23b);' href='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/wAALCAAIAAoBAREA/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/aAAgBAQAAPwBgyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//Z'/%3E%3C/svg%3E"

  const resolvedSizes = sizes || (fill ? '100vw' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw')

  const commonProps = {
    alt: optimizedAlt,
    title: imageTitle,
    className: `${className} ${isLoading ? 'blur-sm' : 'blur-0'} transition-all duration-300`,
    onError: () => setHasError(true),
    onLoad: () => setIsLoading(false),
    priority,
    loading: priority ? undefined : (loading || 'lazy'),
    quality,
    placeholder: 'blur' as const,
    blurDataURL,
    fetchPriority,
  }

  if (fill) {
    return (
      <Image
        {...commonProps}
        src={src}
        alt={optimizedAlt}
        fill
        sizes={resolvedSizes}
        style={{ objectFit }}
      />
    )
  }

  return (
    <Image
      {...commonProps}
      src={src}
      alt={optimizedAlt}
      width={width || 800}
      height={height || 600}
      sizes={resolvedSizes}
    />
  )
}

/**
 * Helper function to generate optimized image alt text
 */
export function generateImageAlt(
  context: 'vehicle' | 'service' | 'gallery' | 'hero' | 'general',
  name?: string,
  details?: string
): string {
  const templates = {
    vehicle: `${name || 'Car'} rental - ${details || 'Professional wedding car service in Lebanon'}`,
    service: `${name || 'Service'} - ${details || 'Eweeha transportation service'}`,
    gallery: `${name || 'Car'} - ${details || 'Our fleet of wedding cars'}`,
    hero: `${name || 'Eweeha'} - ${details || 'Premium wedding car service in Lebanon'}`,
    general: `${name || 'Eweeha'} - ${details || 'Wedding cars Lebanon'}`,
  }

  return templates[context]
}

