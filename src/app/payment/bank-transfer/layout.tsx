import { Metadata } from 'next'
import { generateMetadata as generateSeoMetadata } from '@/lib/seoManager'

export const metadata: Metadata = generateSeoMetadata({
  title: 'Bank Transfer Payment - Eweeha',
  description: 'Submit your Eweeha booking payment via secure bank transfer instructions.',
  path: '/payment/bank-transfer',
  noIndex: true,
})

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
