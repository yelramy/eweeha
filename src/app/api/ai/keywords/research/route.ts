import { NextRequest, NextResponse } from 'next/server'
import { generateKeywords, isAIConfigured } from '@/lib/ai'
import { verifyAdmin } from '@/lib/auth'

/**
 * AI-Powered Keyword Research Tool
 * POST /api/ai/keywords/research
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
    const { topic, industry, location, targetAudience } = body

    if (!topic) {
      return NextResponse.json(
        { error: 'Missing required field: topic' },
        { status: 400 }
      )
    }

    const keywords = await generateKeywords({
      topic,
      industry: industry || 'Wedding Car Rental',
      location: location || 'Lebanon',
      targetAudience,
    })

    // Categorize keywords by intent
    const categorized = {
      primary: keywords.slice(0, 5),
      secondary: keywords.slice(5, 15),
      longTail: keywords.slice(15),
      all: keywords,
    }

    return NextResponse.json({
      topic,
      keywords: categorized,
      count: keywords.length,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('AI keyword research error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to perform keyword research',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}


