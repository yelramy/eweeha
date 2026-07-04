import { NextRequest, NextResponse } from 'next/server'
import bookings from '@/lib/bookings'
import { isAdminRequestAuthorized } from '@/lib/auth'
import { sendPaymentConfirmation } from '@/lib/email'
import { logger } from '@/utils/logger'
import { getCommitmentAmount } from '@/lib/quotes'
import turso from '@/lib/turso'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authorization
    const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
    if (!authorized) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const { status, reference, sendEmail, amountPaid } = await request.json()

    const validStatuses = ['pending', 'completed', 'failed', 'confirmed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment status' },
        { status: 400 }
      )
    }

    const booking = await bookings.getByBookingId(id)
    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      )
    }

    let success = false
    if (amountPaid != null && (status === 'completed' || status === 'confirmed')) {
      const paid = Number(amountPaid)
      const commitment = getCommitmentAmount(booking)
      const paymentStatus = paid >= commitment ? status : 'pending'
      success = await bookings.setAmountPaid(id, paid, paymentStatus, reference)

      if (booking.request_id && paid >= commitment) {
        await turso.execute({
          sql: `UPDATE rental_requests SET status = 'confirmed', confirmed_at = COALESCE(confirmed_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          args: [booking.request_id],
        })
      }
    } else {
      success = await bookings.updatePaymentStatus(id, status, reference)
    }
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to update payment status' },
        { status: 500 }
      )
    }

    logger.info('admin_payment_status_updated', {
      bookingId: id,
      status,
      reference,
      updatedBy: 'admin'
    })

    // Send payment confirmation email if paid and sendEmail is true
    if ((status === 'confirmed' || status === 'completed') && sendEmail !== false) {
      try {
        const booking = await bookings.getByBookingId(id)
        if (booking && booking.customer_email) {
          await sendPaymentConfirmation(booking)
          logger.info('payment_confirmation_sent', {
            bookingId: id,
            customerEmail: booking.customer_email
          })
        }
      } catch (emailError) {
        logger.error('payment_confirmation_failed', {
          bookingId: id,
          error: (emailError as Error).message
        })
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment status updated successfully'
    })

  } catch (error) {
    logger.error('admin_payment_update_error', {
      error: (error as Error).message
    })
    return NextResponse.json(
      { success: false, error: 'Failed to update payment status' },
      { status: 500 }
    )
  }
}

