import { Metadata } from 'next'
import { generateMetadata as generateSeoMetadata } from '@/lib/seoManager'

export const metadata: Metadata = generateSeoMetadata({
  title: 'Card Payment - Eweeha',
  description: 'Secure Stripe checkout for Eweeha reservations.',
  path: '/payment/stripe',
  noIndex: true,
})

export default function StripePaymentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}


