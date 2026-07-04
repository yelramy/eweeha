import { NextRequest, NextResponse } from 'next/server'
import { createAdminToken, authUser } from '@/lib/auth'
import { rateLimiters, checkRateLimit } from '@/lib/ratelimit'
import { sanitizeText } from '@/utils/sanitize'

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting - prevent brute force attacks
    const rateLimitResult = await checkRateLimit(request, rateLimiters.login)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many login attempts. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.reset - Date.now()) / 1000))
          }
        }
      )
    }

    // 2. Parse and sanitize input
    const body = await request.json()
    const username = sanitizeText(body.username || '')
    const password = body.password || '' // Don't sanitize passwords - they may contain special chars

    // Database authentication ONLY - no fallbacks for security
    const dbUser = await authUser(username, password)
    
    if (!dbUser) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid credentials' 
      }, { status: 401 })
    }

    const token = createAdminToken(username, 7)

    const response = NextResponse.json({ 
      success: true, 
      message: 'Login successful' 
    })

    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    })
    
    return response
  } catch {
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Logged out' })
  response.cookies.set('admin-token', '', {
    path: '/',
    expires: new Date(0),
    maxAge: 0
  })
  return response
}
