import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequestAuthorized } from '@/lib/auth'
import { getAllReviewsForAdmin } from '@/lib/reviews'
import { getAllInvitations } from '@/lib/reviewInvitations'

export async function GET(request: NextRequest) {
  try {
    const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const [reviews, invitations] = await Promise.all([
      getAllReviewsForAdmin(),
      getAllInvitations(100, 0),
    ])

    return NextResponse.json({ success: true, data: { reviews, invitations } })
  } catch (error) {
    console.error('Failed to fetch admin reviews:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch reviews' }, { status: 500 })
  }
}
