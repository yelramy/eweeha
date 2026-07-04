import { NextRequest, NextResponse } from 'next/server'
import { getRecentReviews, getOverallRating } from '@/lib/reviews'
import { rateLimiters, checkRateLimit } from '@/lib/ratelimit'

export const revalidate = 60

export async function GET(request: NextRequest) {
  try {
    const limit = await checkRateLimit(request, rateLimiters.reads)
    if (!limit.success) {
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 })
    }

    const { searchParams } = new URL(request.url)
    const max = Math.max(1, Math.min(50, Number(searchParams.get('limit') || 20)))

    const [reviews, stats] = await Promise.all([
      getRecentReviews(max),
      getOverallRating(),
    ])

    return NextResponse.json({ success: true, data: { reviews, stats } })
  } catch (error) {
    console.error('Error fetching public reviews:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
