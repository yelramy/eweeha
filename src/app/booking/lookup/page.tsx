import { Metadata } from 'next'
import { generateMetadata as generateSeoMetadata } from '@/lib/seoManager'
import BookingLookupClient from './BookingLookupClient'

export const metadata: Metadata = generateSeoMetadata({
  title: 'Find Your Eweeha Booking',
  description: 'Secure booking lookup portal for Eweeha customers. Retrieve your reservation details using your booking reference and email.',
  path: '/booking/lookup',
  noIndex: true,
})

export default function BookingLookupPage() {
  return <BookingLookupClient />
}

