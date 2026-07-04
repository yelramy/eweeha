import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequestAuthorized } from '@/lib/auth'
import turso from '@/lib/turso'
import { format, startOfMonth, subMonths } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
    if (!authorized) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all bookings
    const bookingsResult = await turso.execute({
      sql: `SELECT 
              van_type,
              total_amount,
              payment_status,
              payment_method,
              created_at,
              pickup_date
            FROM bookings 
            ORDER BY created_at DESC`,
      args: []
    })

    const bookings = bookingsResult.rows

    // Calculate total stats
    const totalBookings = bookings.length
    const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.total_amount || 0), 0)
    const paidRevenue = bookings
      .filter(b => b.payment_status === 'completed' || b.payment_status === 'paid')
      .reduce((sum, b) => sum + Number(b.total_amount || 0), 0)
    const pendingRevenue = bookings
      .filter(b => b.payment_status === 'pending')
      .reduce((sum, b) => sum + Number(b.total_amount || 0), 0)

    // Group by month (last 6 months)
    const monthlyStats: Array<{
      period: string
      bookings: number
      revenue: number
      paid: number
      pending: number
    }> = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i))
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)
      
      const monthBookings = bookings.filter(b => {
        const bookingDate = new Date(b.created_at as string)
        return bookingDate >= monthStart && bookingDate <= monthEnd
      })

      monthlyStats.push({
        period: format(monthStart, 'MMM yyyy'),
        bookings: monthBookings.length,
        revenue: monthBookings.reduce((sum, b) => sum + Number(b.total_amount || 0), 0),
        paid: monthBookings
          .filter(b => b.payment_status === 'completed' || b.payment_status === 'paid')
          .reduce((sum, b) => sum + Number(b.total_amount || 0), 0),
        pending: monthBookings
          .filter(b => b.payment_status === 'pending')
          .reduce((sum, b) => sum + Number(b.total_amount || 0), 0)
      })
    }

    // Group by vehicle
    const vehicleMap = new Map<string, { bookings: number; revenue: number }>()
    bookings.forEach(b => {
      const vanType = b.van_type as string || 'Unknown'
      const existing = vehicleMap.get(vanType) || { bookings: 0, revenue: 0 }
      vehicleMap.set(vanType, {
        bookings: existing.bookings + 1,
        revenue: existing.revenue + Number(b.total_amount || 0)
      })
    })

    const vehicleStats = Array.from(vehicleMap.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Group by payment method
    const paymentMap = new Map<string, { count: number; revenue: number }>()
    bookings.forEach(b => {
      const method = b.payment_method as string || 'Unknown'
      const existing = paymentMap.get(method) || { count: 0, revenue: 0 }
      paymentMap.set(method, {
        count: existing.count + 1,
        revenue: existing.revenue + Number(b.total_amount || 0)
      })
    })

    const paymentStats = Array.from(paymentMap.entries())
      .map(([method, stats]) => ({ method, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)

    return NextResponse.json({
      success: true,
      data: {
        totalBookings,
        totalRevenue,
        paidRevenue,
        pendingRevenue,
        monthlyStats,
        vehicleStats,
        paymentStats
      }
    })

  } catch (error) {
    console.error('Failed to fetch analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

