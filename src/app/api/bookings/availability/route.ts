import { NextRequest, NextResponse } from 'next/server'
import turso from '@/lib/turso'
import { rateLimiters, checkRateLimit } from '@/lib/ratelimit'

/**
 * Check availability for a vehicle during a specific time period
 * Prevents double-booking by checking existing reservations
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(request, rateLimiters.api)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get('vehicleId')
    const pickupDate = searchParams.get('pickupDate')
    const returnDate = searchParams.get('returnDate')

    // Validate required params
    if (!vehicleId || !pickupDate || !returnDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: vehicleId, pickupDate, returnDate' },
        { status: 400 }
      )
    }

    // Get vehicle quantity
    const vehicleResult = await turso.execute({
      sql: 'SELECT quantity FROM vehicles WHERE id = ?',
      args: [vehicleId]
    })

    if (vehicleResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Vehicle not found' },
        { status: 404 }
      )
    }

    const totalQuantity = (vehicleResult.rows[0].quantity as number) || 1

    // Count existing bookings for this vehicle during the requested period
    const result = await turso.execute({
      sql: `
        SELECT COUNT(*) as booking_count
        FROM bookings
        WHERE van_type = ?
          AND payment_status != 'failed'
          AND (
            -- Check if dates overlap
            (datetime(pickup_date) <= datetime(?) AND datetime(return_date) >= datetime(?))
            OR
            (datetime(pickup_date) <= datetime(?) AND datetime(return_date) >= datetime(?))
            OR
            (datetime(pickup_date) >= datetime(?) AND datetime(return_date) <= datetime(?))
          )
      `,
      args: [
        vehicleId,
        returnDate, pickupDate, // First overlap check
        returnDate, returnDate, // Second overlap check  
        pickupDate, returnDate  // Third overlap check
      ]
    })

    const bookingCount = Number(result.rows[0]?.booking_count || 0)
    const availableUnits = totalQuantity - bookingCount
    const isAvailable = availableUnits > 0

    return NextResponse.json({
      success: true,
      available: isAvailable,
      totalQuantity,
      bookedUnits: bookingCount,
      availableUnits,
      message: isAvailable 
        ? `${availableUnits} of ${totalQuantity} units available`
        : `All ${totalQuantity} units are booked for these dates`
    })

  } catch (error) {
    console.error('Availability check error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check availability' },
      { status: 500 }
    )
  }
}

