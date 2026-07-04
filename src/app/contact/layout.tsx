import { generateMetadata } from '@/lib/seoManager'
import { Metadata } from 'next'

export const metadata: Metadata = generateMetadata({
  title: 'Contact Us - Get in Touch',
  description: 'Contact Eweeha for wedding car rental inquiries in Lebanon. Reach us via phone, WhatsApp, email or visit our office in Beirut. Professional support for bookings across Beirut, Jounieh, Tripoli & all Lebanon. 24/7 customer service available.',
  path: '/contact',
})

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

