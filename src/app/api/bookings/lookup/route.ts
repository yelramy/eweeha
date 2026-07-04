import { NextRequest, NextResponse } from 'next/server'
import bookings, { createBookingAccessToken } from '@/lib/bookings'
import { rateLimiters, checkRateLimit } from '@/lib/ratelimit'
import { logger } from '@/utils/logger'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - prevent lookup spam
    const rateLimitResult = await checkRateLimit(request, rateLimiters.api)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many requests. Please wait before trying again.',
        },
        { status: 429 }
      )
    }

    const { bookingId, email } = await request.json()

    // Validate input
    if (!bookingId || !email) {
      return NextResponse.json(
        { success: false, error: 'Booking ID and email are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Lookup + email check. We return the same generic response for
    // "booking does not exist" and "email does not match" so attackers can't
    // use response-code differences to enumerate valid booking IDs. Log the
    // actual reason server-side for debugging.
    const booking = await bookings.getByBookingId(bookingId)
    const emailMatches =
      !!booking &&
      booking.customer_email?.toLowerCase() === email.toLowerCase()

    if (!booking || !emailMatches) {
      if (!booking) {
        logger.warn('booking_lookup_not_found', { bookingId })
      } else {
        logger.warn('booking_lookup_email_mismatch', { bookingId, email })
      }
      return NextResponse.json(
        {
          success: false,
          error:
            'We could not find a booking matching that ID and email. Check both and try again.',
        },
        { status: 404 }
      )
    }

    // Generate new access token (30 days)
    const token = await createBookingAccessToken(bookingId, 30 * 24 * 60)

    logger.info('booking_lookup_success', { bookingId, email })

    return NextResponse.json({
      success: true,
      token,
      message: 'Booking found successfully',
    })

  } catch (error) {
    logger.error('booking_lookup_error', { error: (error as Error).message })
    return NextResponse.json(
      { success: false, error: 'Failed to lookup booking' },
      { status: 500 }
    )
  }
}

