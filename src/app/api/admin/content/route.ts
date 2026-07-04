import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequestAuthorized } from '@/lib/auth'
import { ContentSection } from '@/constants/contentDefaults'
import { invalidateCache } from '@/lib/cache'
import { getAllContent } from '@/lib/content'

export async function GET(request: NextRequest) {
  try {
    const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const content = await getAllContent()
    
    // Convert to array format for the UI
    const sections = Object.values(content) as ContentSection[]
    
    return NextResponse.json({
      success: true,
      sections
    })
  } catch (error) {
    console.error('Error reading content:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load content' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const { sections } = await request.json()
    const { updateMultipleContent } = await import('@/lib/content')
    
    // Update all sections in database
    const success = await updateMultipleContent(sections)
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to update content' },
        { status: 500 }
      )
    }
    
    // Invalidate cache so frontend sees changes immediately
    await invalidateCache('content')
    
    return NextResponse.json({
      success: true,
      message: 'Content updated successfully'
    })
  } catch (error) {
    console.error('Error updating content:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update content' },
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
    const { section } = await request.json()
    const { updateContent } = await import('@/lib/content')
    
    // Update single section in database
    const success = await updateContent(section)
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to update content section' },
        { status: 500 }
      )
    }
    
    // Invalidate cache so frontend sees changes immediately
    await invalidateCache('content')
    
    return NextResponse.json({
      success: true,
      message: 'Content section updated successfully'
    })
  } catch (error) {
    console.error('Error updating content section:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update content section' },
      { status: 500 }
    )
  }
}
