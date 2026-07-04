import { NextResponse } from 'next/server'
import { getContent, getAllContent } from '@/lib/content'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sectionId = searchParams.get('section')
    
    if (sectionId) {
      // Get specific content section
      const content = await getContent(sectionId)
      
      if (!content) {
        return NextResponse.json(
          { success: false, error: 'Section not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        content
      })
    } else {
      // Get all content
      const content = await getAllContent()
      
      return NextResponse.json({
        success: true,
        content
      })
    }
  } catch (error) {
    console.error('Error fetching content:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch content' },
      { status: 500 }
    )
  }
}