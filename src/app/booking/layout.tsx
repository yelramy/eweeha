import { generateMetadata } from '@/lib/seoManager'
import { Metadata } from 'next'

export const metadata: Metadata = generateMetadata({
  title: 'Book Your Wedding Car - Online Reservation',
  description: 'Book your wedding car rental online in Lebanon with instant confirmation. Multiple payment options: international cards, OMT, WhishMoney, and bank transfer. Professional drivers included for Beirut, Jounieh, Tripoli & nationwide service.',
  path: '/booking',
})

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}