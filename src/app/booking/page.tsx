import { Metadata } from 'next'
import { generateMetadata as generateSeoMetadata } from '@/lib/seoManager'
import BookingClient from './BookingClient'

export const revalidate = 300

export const metadata: Metadata = generateSeoMetadata({
  title: 'Book Your Wedding Car Rental in Lebanon',
  description: 'Reserve your Eweeha ride online. Choose your car, set your travel dates, and confirm secure payment for premium transportation anywhere in Lebanon.',
  path: '/booking',
})

export default function BookingPage() {
  return <BookingClient />
}
