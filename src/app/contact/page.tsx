import { Metadata } from 'next'
import { generateMetadata as generateSeoMetadata } from '@/lib/seoManager'
import ContactClient from './ContactClient'

export const revalidate = 3600

export const metadata: Metadata = generateSeoMetadata({
  title: 'Contact Eweeha | 24/7 Wedding Car Support in Lebanon',
  description: 'Get in touch with Eweeha for wedding car rental inquiries, bookings, and support. Call, WhatsApp, or send a message to our team for fast assistance anywhere in Lebanon.',
  path: '/contact',
})

export default function ContactPage() {
  return <ContactClient />
}
