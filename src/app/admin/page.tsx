import { Metadata } from 'next'
import { generateMetadata as generateSeoMetadata } from '@/lib/seoManager'
import AdminRedirectClient from './AdminRedirectClient'

export const metadata: Metadata = generateSeoMetadata({
  title: 'Eweeha Admin Portal',
  description: 'Secure administrator access for managing Eweeha bookings, fleet availability, and payments.',
  path: '/admin',
  noIndex: true,
})

export default function AdminPage() {
  return <AdminRedirectClient />
}
