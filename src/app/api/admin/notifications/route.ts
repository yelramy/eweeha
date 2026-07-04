import { NextRequest, NextResponse } from 'next/server'
import notifications from '@/lib/notifications'
import { isAdminRequestAuthorized } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'
    
    const data = unreadOnly 
      ? await notifications.getUnread()
      : await notifications.getAll()
    
    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const notificationData = await request.json()
    
    // Validate required fields
    if (!notificationData.type || !notificationData.title || !notificationData.message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type, title, message' },
        { status: 400 }
      )
    }

    const newNotification = await notifications.create(notificationData)
    
    if (!newNotification) {
      return NextResponse.json(
        { success: false, error: 'Failed to create notification' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: newNotification,
      message: 'Notification created successfully'
    })
  } catch (error) {
    console.error('Failed to create notification:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'mark-all-read') {
      const success = await notifications.markAllAsRead()
      
      if (!success) {
        return NextResponse.json(
          { success: false, error: 'Failed to mark all notifications as read' },
          { status: 500 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read'
      })
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Failed to update notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update notifications' },
      { status: 500 }
    )
  }
}
