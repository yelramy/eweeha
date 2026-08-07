import { Metadata } from 'next'
import { cached } from '@/lib/cache'
import FleetIndexClient from '../fleet/FleetIndexClient'

export const revalidate = 300

export const metadata: Metadata = {
  title: { absolute: 'Wedding Car Rental in Lebanon — All Cars with Chauffeur | Eweeha' },
  description:
    'Wedding car rental in Lebanon with chauffeur: Rolls-Royce, Mercedes-Maybach, vintage limousines, convertibles, and bridal sedans for your wedding day.',
  alternates: { canonical: 'https://eweeha.com/wedding-car-rental-lebanon' },
}

export default async function FleetPage() {
  const vehicles = await cached.vehicles.getAvailable()
  return <FleetIndexClient vehicles={vehicles} />
}
