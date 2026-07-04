import { NextRequest, NextResponse } from 'next/server'
import { invalidateCache } from '@/lib/cache'
import { isAdminRequestAuthorized } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Double-check admin auth in addition to middleware
    const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    
    // Clear all caches
    await invalidateCache(['vehicles', 'config', 'content'])
    
    return NextResponse.json({
      success: true,
      message: 'All caches cleared successfully'
    })
  } catch (error) {
    console.error('Error clearing cache:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' },
      { status: 500 }
    )
  }
}
