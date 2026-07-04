import { Metadata } from 'next'
import { generateMetadata as generateSeoMetadata } from '@/lib/seoManager'

export const metadata: Metadata = generateSeoMetadata({
  title: 'Payment Successful - Eweeha',
  description: 'Confirmation page for Eweeha bookings after a successful payment.',
  path: '/payment/success',
  noIndex: true,
})

export default function PaymentSuccessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

