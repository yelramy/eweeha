import { Metadata } from 'next'
import { cached } from '@/lib/cache'
import { getFleetCategoriesFromDb } from '@/lib/fleetCategoriesDb'
import { siteConfig } from '@/lib/seoManager'
import FleetIndexClient from '../fleet/FleetIndexClient'

export const revalidate = 300

const title = 'Wedding Car Rental in Lebanon — All Cars with Chauffeur | Eweeha'
const description =
  'Wedding car rental in Lebanon with chauffeur: Rolls-Royce, Mercedes-Maybach, vintage limousines, convertibles, and bridal sedans for your wedding day.'
const url = 'https://eweeha.com/wedding-car-rental-lebanon'

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, type: 'website', images: [siteConfig.ogImage] },
  twitter: { card: 'summary_large_image', title, description, images: [siteConfig.ogImage] },
}

export default async function FleetIndexPage() {
  const [vehicles, categories] = await Promise.all([
    cached.vehicles.getAvailable(),
    getFleetCategoriesFromDb(),
  ])
  return <FleetIndexClient vehicles={vehicles} categories={categories} />
}
