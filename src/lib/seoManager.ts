/**
 * SEO Manager - Complete SEO System
 * Handles all SEO operations: config, database, metadata, structured data
 */

import turso from './turso'
import { Metadata } from 'next'
import { getConfig } from '@/utils/config'
import { createDefaultConfig } from '@/constants/configDefaults'

// Base site configuration with sensible fallbacks
const DEFAULT_PRODUCTION_BASE_URL = 'https://eweeha.com'

const envBaseUrl =
  process.env.NEXT_PUBLIC_BASE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
  (process.env.NODE_ENV === 'production'
    ? DEFAULT_PRODUCTION_BASE_URL
    : 'http://localhost:3000')

export const siteConfig = {
  name: 'Eweeha',
  description:
    'Wedding car rental in Lebanon with chauffeur — bridal cars, classic & convertible cars, and full wedding convoys. Serving every ceremony across Beirut, Jounieh, Byblos & all Lebanon. Book online or WhatsApp.',
  url: envBaseUrl,
  ogImage: `${envBaseUrl}/og-image.jpg`,
  keywords: [
    'wedding car rental lebanon',
    'wedding cars beirut',
    'wedding convoy lebanon',
    'convoi mariage liban',
    'bridal car with chauffeur lebanon',
    'classic car wedding lebanon',
    'convertible wedding car beirut',
    'wedding car decoration lebanon',
    'zaffe wedding cars',
    'wedding guest shuttle lebanon'
  ]
}

/** Avoid "Title | Eweeha | Eweeha" when callers already include a brand suffix. */
export function formatPageTitle(title: string, brand = siteConfig.name): string {
  if (!title.trim()) return brand
  if (title.includes('|')) return title.trim()
  return `${title.trim()} | ${brand}`
}

/** Segment-only title for Next.js `title.template` in the root layout. */
export function pageTitleSegment(title: string, brand = siteConfig.name): string {
  const trimmed = title.trim()
  if (!trimmed) return ''
  if (!trimmed.includes('|')) return trimmed
  const [segment] = trimmed.split('|')
  const normalized = segment.trim()
  return normalized.toLowerCase() === brand.toLowerCase() ? '' : normalized
}

// Get dynamic site config from database settings
export async function getDynamicSiteConfig() {
  try {
    const config = await getConfig()
    return {
      ...siteConfig,
      name: config.business.name || siteConfig.name,
      phone: config.contact.phone,
      email: config.contact.email,
      whatsapp: config.contact.whatsapp,
      address: config.business.address,
      workingHours: config.business.workingHours,
      currency: config.currency.primaryCurrency,
      exchangeRate: config.currency.usdToLbp
    }
  } catch (error) {
    console.error('Error getting dynamic site config:', error)
    const defaults = createDefaultConfig()
    return {
      ...siteConfig,
      phone: defaults.contact.phone,
      email: defaults.contact.email,
      whatsapp: defaults.contact.whatsapp,
      address: defaults.business.address,
      workingHours: defaults.business.workingHours,
      currency: defaults.currency.primaryCurrency,
      exchangeRate: defaults.currency.usdToLbp
    }
  }
}

export interface SeoSettings {
  id: string
  siteTitle: string
  siteDescription: string
  keywords?: string
  ogImage?: string
  twitterHandle?: string
  googleSiteVerification?: string
  googleAnalyticsId?: string
  facebookPixelId?: string
}

export interface PageSeo {
  id: string
  pagePath: string
  title?: string
  description?: string
  keywords?: string
  ogImage?: string
  ogType?: string
  noIndex?: boolean
  noFollow?: boolean
  canonicalUrl?: string
}

/**
 * Get global SEO settings
 */
export async function getSeoSettings(): Promise<SeoSettings | null> {
  try {
    const result = await turso.execute('SELECT * FROM seo_settings LIMIT 1')
    if (result.rows.length === 0) return null

    const row = result.rows[0]
    return {
      id: row.id as string,
      siteTitle: row.site_title as string,
      siteDescription: row.site_description as string,
      keywords: row.keywords as string | undefined,
      ogImage: row.og_image as string | undefined,
      twitterHandle: row.twitter_handle as string | undefined,
      googleSiteVerification: row.google_site_verification as string | undefined,
      googleAnalyticsId: row.google_analytics_id as string | undefined,
      facebookPixelId: row.facebook_pixel_id as string | undefined,
    }
  } catch (error) {
    console.error('Error fetching SEO settings:', error)
    return null
  }
}

/**
 * Update or create global SEO settings
 */
export async function updateSeoSettings(settings: Omit<SeoSettings, 'id'>): Promise<void> {
  try {
    const existing = await getSeoSettings()
    const id = existing?.id || crypto.randomUUID()

    await turso.execute({
      sql: `
        INSERT INTO seo_settings (
          id, site_title, site_description, keywords, og_image, 
          twitter_handle, google_site_verification, google_analytics_id, 
          facebook_pixel_id, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          site_title = excluded.site_title,
          site_description = excluded.site_description,
          keywords = excluded.keywords,
          og_image = excluded.og_image,
          twitter_handle = excluded.twitter_handle,
          google_site_verification = excluded.google_site_verification,
          google_analytics_id = excluded.google_analytics_id,
          facebook_pixel_id = excluded.facebook_pixel_id,
          updated_at = CURRENT_TIMESTAMP
      `,
      args: [
        id,
        settings.siteTitle,
        settings.siteDescription,
        settings.keywords || null,
        settings.ogImage || null,
        settings.twitterHandle || null,
        settings.googleSiteVerification || null,
        settings.googleAnalyticsId || null,
        settings.facebookPixelId || null,
      ],
    })
  } catch (error) {
    console.error('Error updating SEO settings:', error)
    throw error
  }
}

/**
 * Get SEO settings for a specific page
 */
export async function getPageSeo(pagePath: string): Promise<PageSeo | null> {
  try {
    const result = await turso.execute({
      sql: 'SELECT * FROM page_seo WHERE page_path = ?',
      args: [pagePath],
    })

    if (result.rows.length === 0) return null

    const row = result.rows[0]
    return {
      id: row.id as string,
      pagePath: row.page_path as string,
      title: row.title as string | undefined,
      description: row.description as string | undefined,
      keywords: row.keywords as string | undefined,
      ogImage: row.og_image as string | undefined,
      ogType: row.og_type as string | undefined,
      noIndex: Boolean(row.no_index),
      noFollow: Boolean(row.no_follow),
      canonicalUrl: row.canonical_url as string | undefined,
    }
  } catch (error) {
    console.error('Error fetching page SEO:', error)
    return null
  }
}

/**
 * Update or create page-specific SEO
 */
export async function updatePageSeo(pageSeo: Omit<PageSeo, 'id'>): Promise<void> {
  try {
    const existing = await getPageSeo(pageSeo.pagePath)
    const id = existing?.id || crypto.randomUUID()

    await turso.execute({
      sql: `
        INSERT INTO page_seo (
          id, page_path, title, description, keywords, og_image, 
          og_type, no_index, no_follow, canonical_url, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(page_path) DO UPDATE SET
          title = excluded.title,
          description = excluded.description,
          keywords = excluded.keywords,
          og_image = excluded.og_image,
          og_type = excluded.og_type,
          no_index = excluded.no_index,
          no_follow = excluded.no_follow,
          canonical_url = excluded.canonical_url,
          updated_at = CURRENT_TIMESTAMP
      `,
      args: [
        id,
        pageSeo.pagePath,
        pageSeo.title || null,
        pageSeo.description || null,
        pageSeo.keywords || null,
        pageSeo.ogImage || null,
        pageSeo.ogType || 'website',
        pageSeo.noIndex ? 1 : 0,
        pageSeo.noFollow ? 1 : 0,
        pageSeo.canonicalUrl || null,
      ],
    })
  } catch (error) {
    console.error('Error updating page SEO:', error)
    throw error
  }
}

/**
 * Delete page SEO override
 */
export async function deletePageSeo(pagePath: string): Promise<void> {
  try {
    await turso.execute({
      sql: 'DELETE FROM page_seo WHERE page_path = ?',
      args: [pagePath],
    })
  } catch (error) {
    console.error('Error deleting page SEO:', error)
    throw error
  }
}

/**
 * Get all page SEO overrides
 */
export async function getAllPageSeo(): Promise<PageSeo[]> {
  try {
    const result = await turso.execute('SELECT * FROM page_seo ORDER BY page_path')
    
    return result.rows.map(row => ({
      id: row.id as string,
      pagePath: row.page_path as string,
      title: row.title as string | undefined,
      description: row.description as string | undefined,
      keywords: row.keywords as string | undefined,
      ogImage: row.og_image as string | undefined,
      ogType: row.og_type as string | undefined,
      noIndex: Boolean(row.no_index),
      noFollow: Boolean(row.no_follow),
      canonicalUrl: row.canonical_url as string | undefined,
    }))
  } catch (error) {
    console.error('Error fetching all page SEO:', error)
    return []
  }
}

/**
 * Generate metadata with SEO overrides
 */
export async function generateSeoMetadata({
  path = '',
  defaultTitle,
  defaultDescription,
  defaultImages = [],
  defaultType = 'website',
}: {
  path?: string
  defaultTitle?: string
  defaultDescription?: string
  defaultImages?: string[]
  defaultType?: string
}): Promise<Metadata> {
  // Get global and page-specific SEO settings
  const [globalSeo, pageSeo] = await Promise.all([
    getSeoSettings(),
    path ? getPageSeo(path) : null,
  ])

  // Build title
  const title = pageSeo?.title || defaultTitle || globalSeo?.siteTitle || siteConfig.name
  const pageTitle = formatPageTitle(title, globalSeo?.siteTitle || siteConfig.name)
  const titleSegment = pageTitleSegment(title, globalSeo?.siteTitle || siteConfig.name)

  // Build description
  const description = pageSeo?.description || defaultDescription || globalSeo?.siteDescription || siteConfig.description

  // Build images
  const ogImage = pageSeo?.ogImage || (defaultImages.length > 0 ? defaultImages[0] : globalSeo?.ogImage || siteConfig.ogImage)
  const images = [ogImage]

  // Build URL
  const pageUrl = pageSeo?.canonicalUrl || `${siteConfig.url}${path}`

  // Robots
  const noIndex = pageSeo?.noIndex || false
  const noFollow = pageSeo?.noFollow || false

  return {
    title: titleSegment || undefined,
    description,
    authors: [{ name: globalSeo?.siteTitle || siteConfig.name }],
    creator: globalSeo?.siteTitle || siteConfig.name,
    publisher: globalSeo?.siteTitle || siteConfig.name,
    keywords: pageSeo?.keywords || globalSeo?.keywords || siteConfig.keywords.join(', '),
    alternates: {
      canonical: pageUrl,
      languages: {
        'en': pageUrl,
        'x-default': pageUrl
      }
    },
    openGraph: {
      title: pageTitle,
      description,
      url: pageUrl,
      siteName: globalSeo?.siteTitle || siteConfig.name,
      images: images.map(img => ({
        url: img,
        width: 1200,
        height: 630,
        alt: pageTitle
      })),
      locale: 'en_US',
      type: (pageSeo?.ogType || defaultType) as 'website' | 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description,
      images,
      site: globalSeo?.twitterHandle,
      creator: globalSeo?.twitterHandle,
    },
    robots: {
      index: !noIndex,
      follow: !noFollow,
      googleBot: {
        index: !noIndex,
        follow: !noFollow,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: globalSeo?.googleSiteVerification ? {
      google: globalSeo.googleSiteVerification,
    } : undefined,
  }
}

/**
 * Seed initial SEO settings
 */
export async function seedInitialSeoSettings(): Promise<void> {
  try {
    const existing = await getSeoSettings()
    if (existing) {
      console.log('✅ SEO settings already exist')
      return
    }

    await updateSeoSettings({
      siteTitle: 'Eweeha - Wedding Car Rental in Lebanon',
      siteDescription: 'Wedding cars in Lebanon with chauffeur: bridal cars, classic and convertible cars, and full wedding convoys. Serving every ceremony and venue across all Lebanon. Book online.',
      keywords: siteConfig.keywords.join(', '),
      ogImage: siteConfig.ogImage,
    })

    console.log('✅ Seeded initial SEO settings')
  } catch (error) {
    console.error('❌ Failed to seed SEO settings:', error)
  }
}

/**
 * Simple metadata generation (for layouts without database dependency)
 * For pages that need database-driven metadata, use generateSeoMetadata() above
 */
export function generateMetadata({
  title,
  description,
  path = '/',
  images = [],
  noIndex = false,
  omitTitle = false,
}: {
  title?: string
  description?: string
  path?: string
  images?: string[]
  noIndex?: boolean
  omitTitle?: boolean
}): Metadata {
  const pageTitle = title ? formatPageTitle(title) : siteConfig.name
  const titleSegment = title ? pageTitleSegment(title) : ''
  const pageDescription = description || siteConfig.description

  const normalizedPath = path
    ? path.startsWith('/')
      ? path
      : `/${path}`
    : '/'

  const pageUrl = new URL(normalizedPath, siteConfig.url).toString()
  const pageImages = images.length > 0 ? images : [siteConfig.ogImage]
  const absoluteImages = pageImages
    .filter(img => img)
    .map((img) => {
      if (img.startsWith('data:')) return img
      if (/^https?:\/\//.test(img)) return img
      if (img.startsWith('//')) return `https:${img}`
      try {
        return new URL(img, siteConfig.url).toString()
      } catch {
        return img
      }
    })

  const canonicalUrl = pageUrl

  return {
    ...(omitTitle || !titleSegment ? {} : { title: titleSegment }),
    description: pageDescription,
    authors: [{ name: siteConfig.name }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    keywords: siteConfig.keywords.join(', '),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': canonicalUrl,
        'x-default': canonicalUrl
      }
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: canonicalUrl,
      siteName: siteConfig.name,
      images: absoluteImages.map(img => ({
        url: img,
        width: 1200,
        height: 630,
        alt: pageTitle
      })),
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
      images: absoluteImages,
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

/**
 * Generate organization structured data (for root layout)
 * For page-specific schemas, use components from StructuredDataEnhanced.tsx
 */
export async function generateStructuredData({
  type = 'Organization',
  name,
  description,
  url = siteConfig.url,
  additionalData = {}
}: {
  type?: string
  name?: string
  description?: string
  url?: string
  additionalData?: Record<string, unknown>
} = {}) {
  const dynamicConfig = await getDynamicSiteConfig()
  
  const baseData = {
    '@context': 'https://schema.org',
    '@type': type,
    name: name || dynamicConfig.name,
    description: description || siteConfig.description,
    url,
    ...additionalData
  }

  if (type === 'Organization') {
    return {
      ...baseData,
      '@type': ['AutoRental', 'LocalBusiness'],
      '@id': `${siteConfig.url}/#organization`,
      name: dynamicConfig.name,
      alternateName: ['Eweeha', 'Eweeha Lebanon', 'Wedding Cars Lebanon'],
      slogan: 'Eweeha! Smalla 3layke — wedding cars for the big Lebanese moment',
      description: 'Wedding car rental in Lebanon with chauffeur — bridal cars, classics, convertibles, and full wedding convoys, serving every ceremony and venue across all Lebanon.',
      url: siteConfig.url,
      logo: {
        '@type': 'ImageObject',
        '@id': `${siteConfig.url}/#logo`,
        url: `${siteConfig.url}/logo.png`,
        contentUrl: `${siteConfig.url}/logo.png`,
        width: 512,
        height: 512,
        caption: 'Eweeha — Wedding Cars in Lebanon',
      },
      image: [
        {
          '@type': 'ImageObject',
          url: `${siteConfig.url}/og-image.jpg`,
          width: 1200,
          height: 630,
          caption: 'Eweeha wedding cars in Lebanon — chauffeur included',
        },
        `${siteConfig.url}/logo.png`,
      ],
      telephone: dynamicConfig.phone,
      email: dynamicConfig.email,
      address: {
        '@type': 'PostalAddress',
        streetAddress: dynamicConfig.address,
        addressCountry: 'LB',
        addressLocality: 'Beirut',
        addressRegion: 'Beirut'
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 33.8938,
        longitude: 35.5018
      },
      areaServed: [
        { '@type': 'Country', name: 'Lebanon' },
        { '@type': 'City', name: 'Beirut' },
        { '@type': 'City', name: 'Jounieh' },
        { '@type': 'City', name: 'Byblos' },
        { '@type': 'City', name: 'Batroun' },
        { '@type': 'City', name: 'Broummana' },
        { '@type': 'City', name: 'Aley' },
        { '@type': 'City', name: 'Bhamdoun' },
        { '@type': 'City', name: 'Faraya' },
        { '@type': 'City', name: 'Deir el Qamar' },
        { '@type': 'City', name: 'Zahle' },
        { '@type': 'City', name: 'Baalbek' },
        { '@type': 'City', name: 'Tripoli' },
        { '@type': 'City', name: 'Saida' },
        { '@type': 'City', name: 'Tyre' }
      ],
      serviceType: ['Wedding Car Rental', 'Wedding Convoy', 'Bridal Car with Chauffeur', 'Classic Car Wedding Photoshoot', 'Wedding Guest Shuttle'],
      knowsAbout: [
        'wedding car rental',
        'wedding convoy',
        'bridal car with chauffeur',
        'classic car rental for weddings',
        'convertible wedding cars',
        'zaffe arrival coordination',
        'wedding guest shuttle'
      ],
      makesOffer: [
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Wedding convoy' }, url: `${siteConfig.url}/services/wedding-convoy` },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Bridal car with chauffeur' }, url: `${siteConfig.url}/services/bridal-car` },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Classic & convertible photoshoot cars' }, url: `${siteConfig.url}/services/photoshoot-cars` },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Wedding guest shuttle vans' }, url: `${siteConfig.url}/services/guest-shuttle` }
      ],
      priceRange: '$250-$1500',
      paymentAccepted: ['Cash', 'Credit Card', 'Bank Transfer', 'OMT', 'Whish Money'],
      currenciesAccepted: 'USD',
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: dynamicConfig.phone,
        contactType: 'customer service',
        availableLanguage: ['English', 'Arabic', 'French']
      },
      sameAs: [
        `https://wa.me/${dynamicConfig.whatsapp}`,
      ],
      openingHoursSpecification: [{
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '00:00',
        closes: '23:59'
      }]
    }
  }

  return baseData
}

/**
 * WebSite node for the root @graph — links the site to the organization entity.
 */
export function generateWebSiteStructuredData() {
  return {
    '@type': 'WebSite',
    '@id': `${siteConfig.url}/#website`,
    url: siteConfig.url,
    name: 'Eweeha',
    alternateName: ['Eweeha Wedding Cars Lebanon', 'eweeha.com'],
    description: siteConfig.description,
    inLanguage: 'en',
    publisher: { '@id': `${siteConfig.url}/#organization` },
    image: `${siteConfig.url}/og-image.jpg`,
  }
}

