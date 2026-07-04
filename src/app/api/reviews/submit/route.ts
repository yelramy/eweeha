import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getValidInvitation, markInvitationUsed } from '@/lib/reviewInvitations'
import { createReview, hasReviewForBooking } from '@/lib/reviews'
import { rateLimiters, checkRateLimit } from '@/lib/ratelimit'

const SubmitSchema = z.object({
  token: z.string().min(8).max(128),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(2).max(120),
  comment: z.string().trim().min(5).max(2000),
  customerName: z.string().trim().min(1).max(120).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const limit = await checkRateLimit(request, rateLimiters.contact)
    if (!limit.success) {
      return NextResponse.json(
        { success: false, error: 'Too many submissions. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const parsed = SubmitSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid submission',
          details: parsed.error.issues.map(i => i.message),
        },
        { status: 400 }
      )
    }

    const { token, rating, title, comment, customerName } = parsed.data

    const invitation = await getValidInvitation(token)
    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'This review link is invalid, expired, or already used.' },
        { status: 410 }
      )
    }

    // Block double-submit on a booking-tied invitation
    if (invitation.bookingId && (await hasReviewForBooking(invitation.bookingId))) {
      await markInvitationUsed(token)
      return NextResponse.json(
        { success: false, error: 'A review has already been submitted for this booking.' },
        { status: 409 }
      )
    }

    // Atomic-ish: mark used FIRST. If another request already marked it, bail.
    const claimed = await markInvitationUsed(token)
    if (!claimed) {
      return NextResponse.json(
        { success: false, error: 'This review link was just used. Please request a fresh one.' },
        { status: 409 }
      )
    }

    const id = await createReview({
      vehicleId: invitation.vehicleId || undefined,
      bookingId: invitation.bookingId || undefined,
      customerName: customerName || invitation.customerName,
      customerEmail: invitation.customerEmail || undefined,
      rating,
      title,
      comment,
      verified: true,
    })

    return NextResponse.json({ success: true, data: { id } })
  } catch (error) {
    console.error('Error submitting review:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
