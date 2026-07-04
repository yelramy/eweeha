import { NextRequest, NextResponse } from 'next/server'
import bookings from '@/lib/bookings'
import { isAdminRequestAuthorized } from '@/lib/auth' 

export async function GET(request: NextRequest) {
  try {
    const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await bookings.getStats()
    return NextResponse.json({ success: true, data: stats })
  } catch (error) {
    console.error('Failed to fetch booking stats:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch booking stats' }, { status: 500 })
  }
}

