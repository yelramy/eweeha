import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSeoSettings, updateSeoSettings } from '@/lib/seoManager'

/**
 * GET /api/admin/seo
 * Get global SEO settings
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await getSeoSettings()
    
    return NextResponse.json({
      success: true,
      data: settings || {
        siteTitle: 'Eweeha - Wedding Car Rental in Lebanon',
        siteDescription: 'Professional wedding car services in Lebanon',
        keywords: '',
        ogImage: '',
        twitterHandle: '',
        googleSiteVerification: '',
        googleAnalyticsId: '',
        facebookPixelId: '',
      }
    })
  } catch (error) {
    console.error('Error fetching SEO settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch SEO settings' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/seo
 * Update global SEO settings
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    await updateSeoSettings({
      siteTitle: body.siteTitle,
      siteDescription: body.siteDescription,
      keywords: body.keywords || undefined,
      ogImage: body.ogImage || undefined,
      twitterHandle: body.twitterHandle || undefined,
      googleSiteVerification: body.googleSiteVerification || undefined,
      googleAnalyticsId: body.googleAnalyticsId || undefined,
      facebookPixelId: body.facebookPixelId || undefined,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating SEO settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update SEO settings' },
      { status: 500 }
    )
  }
}

