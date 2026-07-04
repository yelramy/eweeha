import { NextRequest, NextResponse } from 'next/server'
import bookings from '@/lib/bookings'
import { isAdminRequestAuthorized } from '@/lib/auth'
import { verifyBookingAccessToken } from '@/lib/bookings'
import { BookingUpdateSchema } from '@/utils/validation'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
    const token = request.headers.get('x-booking-token') || new URL(request.url).searchParams.get('token') || ''
    const bookingId = (await params).id
    
    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'Booking ID is required' },
        { status: 400 }
      )
    }

    // Get booking details
    const booking = await bookings.getByBookingId(bookingId)

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      )
    }

    if (authorized || (token && (await verifyBookingAccessToken(token)) === booking.booking_id)) {
      return NextResponse.json({
        success: true,
        data: booking
      })
    }

    // Public minimal response without PII
    const minimal = {
      booking_id: booking.booking_id,
      van_type: booking.van_type,
      pickup_date: booking.pickup_date,
      return_date: booking.return_date,
      total_amount: booking.total_amount,
      payment_method: booking.payment_method,
      payment_status: booking.payment_status,
      created_at: booking.created_at
    }

    return NextResponse.json({ success: true, data: minimal })

  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch booking' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const bookingId = (await params).id
    const body = await request.json()
    const parsed = BookingUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
    }
    const updates = parsed.data
    
    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'Booking ID is required' },
        { status: 400 }
      )
    }

    // First get the booking to find the database ID
    const booking = await bookings.getByBookingId(bookingId)
    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Update booking using database ID
    const updatedBooking = await bookings.update(booking.id, updates)

    if (!updatedBooking) {
      return NextResponse.json(
        { success: false, error: 'Booking update failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedBooking
    })

  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update booking' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const bookingId = (await params).id
    
    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'Booking ID is required' },
        { status: 400 }
      )
    }

    // First get the booking to find the database ID
    const booking = await bookings.getByBookingId(bookingId)
    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Delete booking using database ID
    const success = await bookings.delete(booking.id)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Delete failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Booking deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting booking:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete booking' },
      { status: 500 }
    )
  }
}
