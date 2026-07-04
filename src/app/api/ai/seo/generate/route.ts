import { NextRequest, NextResponse } from 'next/server'
import { generateMetaTitle, generateMetaDescription, generateKeywords, isAIConfigured } from '@/lib/ai'
import { verifyAdmin } from '@/lib/auth'

/**
 * AI-Powered SEO Meta Generator
 * POST /api/ai/seo/generate
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminVerification = await verifyAdmin(request)
    if (!adminVerification.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if AI is configured
    if (!isAIConfigured()) {
      return NextResponse.json(
        { error: 'AI provider not configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable.' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { type, data } = body

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: type, data' },
        { status: 400 }
      )
    }

    let result: Record<string, unknown> = {}

    switch (type) {
      case 'title':
        result.title = await generateMetaTitle({
          pageName: data.pageName,
          businessName: data.businessName || 'Eweeha',
          keywords: data.keywords,
          targetAudience: data.targetAudience,
        })
        break

      case 'description':
        result.description = await generateMetaDescription({
          pageName: data.pageName,
          pageContent: data.pageContent,
          keywords: data.keywords,
          callToAction: data.callToAction,
        })
        break

      case 'keywords':
        result.keywords = await generateKeywords({
          topic: data.topic,
          industry: data.industry || 'Wedding Car Rental',
          location: data.location || 'Lebanon',
          targetAudience: data.targetAudience,
        })
        break

      case 'all':
        // Generate all SEO elements
        const [title, description, keywords] = await Promise.all([
          generateMetaTitle({
            pageName: data.pageName,
            businessName: data.businessName || 'Eweeha',
            keywords: data.keywords,
            targetAudience: data.targetAudience,
          }),
          generateMetaDescription({
            pageName: data.pageName,
            pageContent: data.pageContent,
            keywords: data.keywords,
            callToAction: data.callToAction,
          }),
          generateKeywords({
            topic: data.topic || data.pageName,
            industry: data.industry || 'Wedding Car Rental',
            location: data.location || 'Lebanon',
            targetAudience: data.targetAudience,
          })
        ])

        result = { title, description, keywords }
        break

      default:
        return NextResponse.json(
          { error: `Unknown generation type: ${type}` },
          { status: 400 }
        )
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('AI SEO generation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate SEO content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Check AI configuration status
 * GET /api/ai/seo/generate
 */
export async function GET(request: NextRequest) {
  try {
    const adminVerification = await verifyAdmin(request)
    if (!adminVerification.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      configured: isAIConfigured(),
      message: isAIConfigured() 
        ? 'AI provider is configured and ready' 
        : 'No AI provider configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY'
    })

  } catch (error) {
    console.error('AI status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check AI status' },
      { status: 500 }
    )
  }
}

