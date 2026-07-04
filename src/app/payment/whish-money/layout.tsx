import { Metadata } from 'next'
import { generateMetadata as generateSeoMetadata } from '@/lib/seoManager'

export const metadata: Metadata = generateSeoMetadata({
  title: 'Whish Money Payment - Eweeha',
  description: 'Complete your wedding car rental payment using Whish Money, Lebanon\'s leading digital wallet.',
  path: '/payment/whish-money',
  noIndex: true,
})

export default function WhishMoneyPaymentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
