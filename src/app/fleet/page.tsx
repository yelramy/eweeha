import { Metadata } from 'next'
import { cached } from '@/lib/cache'
import FleetIndexClient from './FleetIndexClient'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Wedding Car Fleet — All Cars with Chauffeur | Eweeha',
  description:
    'Browse the full Eweeha wedding car fleet in Lebanon: Rolls-Royce, Mercedes-Maybach, vintage limousines, convertibles, and bridal sedans — all with chauffeur.',
  alternates: { canonical: 'https://eweeha.com/fleet' },
}

export default async function FleetPage() {
  const vehicles = await cached.vehicles.getAvailable()
  return <FleetIndexClient vehicles={vehicles} />
}
