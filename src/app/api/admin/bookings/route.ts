import { NextRequest, NextResponse } from 'next/server'
import bookings from '@/lib/bookings'
import { isAdminRequestAuthorized } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page') || 1))
    const pageSize = Math.max(1, Math.min(200, Number(searchParams.get('pageSize') || 50)))
    const offset = (page - 1) * pageSize

    const [items, total] = await Promise.all([
      bookings.getAll({ limit: pageSize, offset }),
      bookings.count()
    ])

    return NextResponse.json({
      success: true,
      data: items,
      pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
    })
  } catch (error) {
    console.error('Failed to fetch bookings:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch bookings' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { bookingId, totalAmount, paymentStatus } = body

    if (!bookingId) {
      return NextResponse.json({ success: false, error: 'Booking ID required' }, { status: 400 })
    }

    // Get the booking first to get the internal ID
    const booking = await bookings.getByBookingId(bookingId)
    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    // Build updates object
    const updates: Partial<typeof booking> = {}
    if (totalAmount !== undefined) {
      updates.total_amount = Number(totalAmount)
    }
    if (paymentStatus !== undefined) {
      updates.payment_status = paymentStatus
    }

    // Update the booking
    const updated = await bookings.update(booking.id, updates)
    
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Failed to update booking' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Booking updated successfully'
    })
  } catch (error) {
    console.error('Failed to update booking:', error)
    return NextResponse.json({ success: false, error: 'Failed to update booking' }, { status: 500 })
  }
}

