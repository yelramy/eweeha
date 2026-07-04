import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getValidInvitation } from '@/lib/reviewInvitations'
import turso from '@/lib/turso'
import ReviewSubmitClient from './ReviewSubmitClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Leave a Review | Eweeha',
  description: 'Share your feedback about your trip with Eweeha.',
  robots: { index: false, follow: false },
}

export default async function ReviewSubmitPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const invitation = await getValidInvitation(token)
  if (!invitation) {
    notFound()
  }

  let vehicleName: string | null = null
  if (invitation.vehicleId) {
    try {
      const v = await turso.execute({
        sql: 'SELECT name FROM vehicles WHERE id = ? LIMIT 1',
        args: [invitation.vehicleId],
      })
      if (v.rows.length > 0) vehicleName = (v.rows[0].name as string) || null
    } catch {
      vehicleName = null
    }
  }

  return (
    <ReviewSubmitClient
      token={token}
      customerName={invitation.customerName}
      vehicleName={vehicleName}
    />
  )
}
