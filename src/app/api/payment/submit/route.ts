import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bookings from '@/lib/bookings'
import { sendPaymentInfoReceived } from '@/lib/email'
import { rateLimiters, checkRateLimit } from '@/lib/ratelimit'
import { logger } from '@/utils/logger'

// Validation schema for payment submission
const PaymentSubmissionSchema = z.object({
  bookingId: z.string(),
  paymentMethod: z.enum(['omt', 'whish-money', 'bank-transfer']),
  senderName: z.string().min(2, 'Sender name is required'),
  senderPhone: z.string().min(7, 'Phone number is required'),
  reference: z.string().min(3, 'Reference number is required'),
  amount: z.string().or(z.number()),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(request, rateLimiters.bookings)
    if (!rateLimitResult.success) {
      logger.warn('payment_submission_rate_limited', { 
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      })
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many requests. Please wait before trying again.',
        },
        { status: 429 }
      )
    }

    // Parse and validate input
    const rawData = await request.json()
    const parsed = PaymentSubmissionSchema.safeParse(rawData)
    
    if (!parsed.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid input', 
          details: parsed.error.flatten() 
        },
        { status: 400 }
      )
    }

    const { bookingId, paymentMethod, senderName, senderPhone, reference, amount } = parsed.data

    // Verify booking exists
    const booking = await bookings.getByBookingId(bookingId)
    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Update booking with payment reference (keep status as pending until admin verifies)
    const updated = await bookings.updatePaymentStatus(
      bookingId, 
      'pending',
      `${reference} (submitted by customer)`
    )

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Failed to update booking' },
        { status: 500 }
      )
    }

    logger.info('payment_info_submitted', {
      bookingId,
      paymentMethod,
      reference,
    })

    // Send acknowledgment email to customer
    try {
      await sendPaymentInfoReceived(booking, {
        paymentMethod,
        senderName,
        senderPhone,
        reference,
        amount: typeof amount === 'string' ? parseFloat(amount) : amount,
      })
    } catch (emailError) {
      logger.error('payment_acknowledgment_email_failed', {
        bookingId,
        error: emailError instanceof Error ? emailError.message : 'Unknown error',
      })
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Payment information received. We will verify and confirm your payment shortly.',
      bookingId,
    })
  } catch (error) {
    logger.error('payment_submission_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    
    return NextResponse.json(
      { success: false, error: 'Failed to process payment information' },
      { status: 500 }
    )
  }
}

