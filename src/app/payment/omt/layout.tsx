import { Metadata } from 'next'
import { generateMetadata as generateSeoMetadata } from '@/lib/seoManager'

export const metadata: Metadata = generateSeoMetadata({
  title: 'OMT Payment - Eweeha',
  description: 'Pay for your Eweeha reservation through OMT and confirm your transfer online.',
  path: '/payment/omt',
  noIndex: true,
})

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
