import { NextRequest, NextResponse } from 'next/server'
import { generateVehicleDescription, generateBlogPost, isAIConfigured } from '@/lib/ai'
import { verifyAdmin } from '@/lib/auth'

/**
 * AI-Powered Content Generator
 * POST /api/ai/content/generate
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

    const result: Record<string, unknown> = {}

    switch (type) {
      case 'vehicle':
        if (!data.name || !data.type || !data.capacity) {
          return NextResponse.json(
            { error: 'Missing required fields for vehicle description: name, type, capacity' },
            { status: 400 }
          )
        }

        result.description = await generateVehicleDescription({
          name: data.name,
          type: data.type,
          capacity: data.capacity,
          features: data.features || [],
          priceRange: data.priceRange,
        })
        break

      case 'blog':
        if (!data.title) {
          return NextResponse.json(
            { error: 'Missing required field: title' },
            { status: 400 }
          )
        }

        result.content = await generateBlogPost({
          title: data.title,
          outline: data.outline,
          keywords: data.keywords,
          wordCount: data.wordCount,
          tone: data.tone || 'informative',
        })
        break

      default:
        return NextResponse.json(
          { error: `Unknown content type: ${type}` },
          { status: 400 }
        )
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('AI content generation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

