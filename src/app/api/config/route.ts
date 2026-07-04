import { NextResponse } from 'next/server'
import { getConfig, getDefaultConfig } from '@/utils/config'

export async function GET() {
  try {
    const config = await getConfig()
    
    return NextResponse.json({
      success: true,
      data: config
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200'
      }
    })
  } catch (error) {
    console.error('Error fetching config:', error)
    
    // Return fallback config
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch configuration',
      data: getDefaultConfig()
    }, { status: 500 })
  }
}
