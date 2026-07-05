import { Metadata } from 'next'
import { generateMetadata as generateSeoMetadata } from '@/lib/seoManager'
import BookingClient from './BookingClient'

export const revalidate = 300

export const metadata: Metadata = generateSeoMetadata({
  title: 'Book Your Wedding Cars in Lebanon',
  description: 'Request your wedding cars online: pick your wedding date, choose the cars and add-ons, and we confirm availability and the price on WhatsApp. All Lebanon covered.',
  path: '/booking',
})

export default function BookingPage() {
  return <BookingClient />
}
