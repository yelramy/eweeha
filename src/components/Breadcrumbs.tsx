'use client'

import Link from 'next/link'
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/solid'
import { usePathname } from 'next/navigation'

export interface BreadcrumbItem {
  label: string
  href: string
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
  className?: string
}

/**
 * Breadcrumbs component with automatic generation and JSON-LD schema markup
 * for improved SEO
 */
export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  const pathname = usePathname()
  
  // Auto-generate breadcrumbs from pathname if not provided
  const breadcrumbItems = items || generateBreadcrumbs(pathname)
  
  // Always include home
  const fullBreadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    ...breadcrumbItems.filter(item => item.href !== '/')
  ]

  // Get base URL with proper fallbacks
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL 
    || (typeof window !== 'undefined' && window.location.origin)
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || ''

  // Generate JSON-LD structured data
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': fullBreadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.label,
      'item': `${baseUrl}${item.href}`
    }))
  }

  if (fullBreadcrumbs.length <= 1) {
    return null // Don't show breadcrumbs on home page
  }

  return (
    <>
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Visual Breadcrumbs */}
      <nav 
        aria-label="Breadcrumb" 
        className={`bg-warm-50 dark:bg-gray-800 py-3 px-4 sm:px-6 lg:px-8 ${className}`}
      >
        <ol className="flex items-center space-x-2 text-sm max-w-7xl mx-auto">
          {fullBreadcrumbs.map((item, index) => {
            const isLast = index === fullBreadcrumbs.length - 1
            const isHome = index === 0

            return (
              <li key={item.href} className="flex items-center">
                {index > 0 && (
                  <ChevronRightIcon className="w-4 h-4 text-warm-400 dark:text-gray-500 mx-2" aria-hidden="true" />
                )}
                
                {isLast ? (
                  <span
                    className="text-charcoal-500 dark:text-white font-medium"
                    aria-current="page"
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="flex items-center text-warm-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    {isHome && <HomeIcon className="w-4 h-4 mr-1" aria-hidden="true" />}
                    {item.label}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}

/**
 * Auto-generate breadcrumbs from pathname
 */
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  if (!pathname || pathname === '/') return []

  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = []

  // Build breadcrumbs progressively
  segments.forEach((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join('/')}`
    const label = formatSegmentLabel(segment)
    
    breadcrumbs.push({ label, href })
  })

  return breadcrumbs
}

/**
 * Format segment into readable label
 */
function formatSegmentLabel(segment: string): string {
  // Handle special cases
  const specialCases: Record<string, string> = {
    'fleet': 'Our Fleet',
    'booking': 'Book Now',
    'contact': 'Contact Us',
    'faq': 'FAQ',
    'privacy': 'Privacy Policy',
    'terms': 'Terms of Service',
    'profile': 'My Profile',
    'admin': 'Admin',
    'dashboard': 'Dashboard',
    'settings': 'Settings',
    'analytics': 'Analytics',
    'gallery': 'Gallery',
    'lookup': 'Track Booking',
    'confirmation': 'Confirmation',
    'payment': 'Payment',
    'success': 'Payment Successful',
    'cancelled': 'Payment Cancelled',
    'stripe': 'Stripe Payment',
    'omt': 'OMT Payment',
    'whish-money': 'WhishMoney Payment',
    'bank-transfer': 'Bank Transfer',
  }

  if (specialCases[segment]) {
    return specialCases[segment]
  }

  // For vehicle IDs or other dynamic segments, capitalize and format
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Hook to use breadcrumbs in page components
 */
export function useBreadcrumbs(customItems?: BreadcrumbItem[]) {
  const pathname = usePathname()
  return customItems || generateBreadcrumbs(pathname)
}
