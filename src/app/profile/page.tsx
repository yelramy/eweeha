import { Metadata } from 'next'
import { generateMetadata as generateSeoMetadata } from '@/lib/seoManager'
import ProfileClient from './ProfileClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = generateSeoMetadata({
  title: 'Your Eweeha Bookings',
  description: 'Secure customer dashboard for reviewing Eweeha reservations, payments, and trip details.',
  path: '/profile',
  noIndex: true,
})

export default function ProfilePage() {
  return <ProfileClient />
}
