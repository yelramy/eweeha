import { NextRequest, NextResponse } from 'next/server'
import turso from '@/lib/turso'

/**
 * Get current availability status for all vehicles
 * Shows: total quantity, currently booked, available now
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get('vehicleId')

    if (vehicleId) {
      // Get availability for specific vehicle
      const vehicleResult = await turso.execute({
        sql: 'SELECT id, name, quantity FROM vehicles WHERE id = ?',
        args: [vehicleId]
      })

      if (vehicleResult.rows.length === 0) {
        return NextResponse.json({ success: false, error: 'Vehicle not found' }, { status: 404 })
      }

      const vehicle = vehicleResult.rows[0]
      const totalQuantity = (vehicle.quantity as number) || 1

      // Count current active bookings (today and future)
      const today = new Date().toISOString()
      const bookingsResult = await turso.execute({
        sql: `
          SELECT COUNT(*) as count
          FROM bookings
          WHERE van_type = ?
            AND payment_status IN ('pending', 'completed')
            AND datetime(return_date) >= datetime(?)
        `,
        args: [vehicleId, today]
      })

      const currentBookings = Number(bookingsResult.rows[0]?.count || 0)
      const availableNow = Math.max(0, totalQuantity - currentBookings)

      return NextResponse.json({
        success: true,
        vehicleId,
        vehicleName: vehicle.name,
        totalQuantity,
        currentBookings,
        availableNow
      })
    }

    // Get availability for all vehicles
    const vehiclesResult = await turso.execute('SELECT id, name, quantity FROM vehicles')
    const today = new Date().toISOString()

    const availability = await Promise.all(
      vehiclesResult.rows.map(async (vehicle) => {
        const vehicleId = vehicle.id as string
        const totalQuantity = (vehicle.quantity as number) || 1

        const bookingsResult = await turso.execute({
          sql: `
            SELECT COUNT(*) as count
            FROM bookings
            WHERE van_type = ?
              AND payment_status IN ('pending', 'completed')
              AND datetime(return_date) >= datetime(?)
          `,
          args: [vehicleId, today]
        })

        const currentBookings = Number(bookingsResult.rows[0]?.count || 0)
        const availableNow = Math.max(0, totalQuantity - currentBookings)

        return {
          vehicleId,
          vehicleName: vehicle.name,
          totalQuantity,
          currentBookings,
          availableNow
        }
      })
    )

    return NextResponse.json({
      success: true,
      availability
    })

  } catch (error) {
    console.error('Admin availability check error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get availability' },
      { status: 500 }
    )
  }
}

