import { Metadata } from 'next'
import { generateMetadata as generateSeoMetadata } from '@/lib/seoManager'

export const metadata: Metadata = generateSeoMetadata({
  title: 'Payment Cancelled - Eweeha',
  description: 'Your payment was cancelled. Return to Eweeha to choose another payment option.',
  path: '/payment/cancelled',
  noIndex: true,
})

export default function PaymentCancelledLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

