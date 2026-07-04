import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getAllPageSeo, updatePageSeo, deletePageSeo } from '@/lib/seoManager'

/**
 * GET /api/admin/seo/pages
 * Get all page SEO overrides
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pages = await getAllPageSeo()
    
    return NextResponse.json({ success: true, data: pages })
  } catch (error) {
    console.error('Error fetching page SEO:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch page SEO' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/seo/pages
 * Create or update page SEO override
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    if (!body.pagePath) {
      return NextResponse.json(
        { success: false, error: 'Page path is required' },
        { status: 400 }
      )
    }

    await updatePageSeo({
      pagePath: body.pagePath,
      title: body.title || undefined,
      description: body.description || undefined,
      keywords: body.keywords || undefined,
      ogImage: body.ogImage || undefined,
      ogType: body.ogType || 'website',
      noIndex: body.noIndex || false,
      noFollow: body.noFollow || false,
      canonicalUrl: body.canonicalUrl || undefined,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating page SEO:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update page SEO' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/seo/pages
 * Delete page SEO override
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const pagePath = searchParams.get('path')
    
    if (!pagePath) {
      return NextResponse.json(
        { success: false, error: 'Page path is required' },
        { status: 400 }
      )
    }

    await deletePageSeo(pagePath)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting page SEO:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete page SEO' },
      { status: 500 }
    )
  }
}

