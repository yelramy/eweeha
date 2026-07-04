import { NextRequest, NextResponse } from 'next/server'
import { analyzePageSEO, isAIConfigured } from '@/lib/ai'
import { verifyAdmin } from '@/lib/auth'

/**
 * AI-Powered SEO Audit Tool
 * POST /api/ai/seo/audit
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
    const { url, title, description, content, keywords } = body

    if (!url || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: url, content' },
        { status: 400 }
      )
    }

    const analysis = await analyzePageSEO({
      url,
      title,
      description,
      content,
      keywords,
    })

    return NextResponse.json({
      url,
      analysis,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('AI SEO audit error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to perform SEO audit',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}


