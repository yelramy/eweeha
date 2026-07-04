import { NextRequest, NextResponse } from 'next/server'
import notifications from '@/lib/notifications'
import { isAdminRequestAuthorized } from '@/lib/auth'

interface RouteContext { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params
    const success = await notifications.markAsRead(id)
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Notification not found or already read' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read'
    })
  } catch (error) {
    console.error('Failed to mark notification as read:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to mark notification as read' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params
    const success = await notifications.delete(id)
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully'
    })
  } catch (error) {
    console.error('Failed to delete notification:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete notification' },
      { status: 500 }
    )
  }
}
