import { NextRequest, NextResponse } from 'next/server'

const FALLBACK_HOST = 'eweeha.com'

function resolveCanonicalHost(): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `https://${FALLBACK_HOST}`)

  try {
    return new URL(baseUrl).host
  } catch {
    return FALLBACK_HOST
  }
}

const CANONICAL_HOST = resolveCanonicalHost()
const WWW_HOST = CANONICAL_HOST.startsWith('www.') ? CANONICAL_HOST : `www.${CANONICAL_HOST}`

// Minimal HS256 JWT verification using Web Crypto (Edge-compatible)
async function verifyJwtHS256(token: string): Promise<boolean> {
  try {
    const [headerB64, payloadB64, sigB64] = token.split('.')
    if (!headerB64 || !payloadB64 || !sigB64) return false

    const isProd = process.env.NODE_ENV === 'production'
    const secret = process.env.ADMIN_JWT_SECRET || (isProd ? undefined : 'dev-secret')
    if (!secret) return false

    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signingInput = `${headerB64}.${payloadB64}`
    const signature = new Uint8Array(
      await crypto.subtle.sign('HMAC', key, encoder.encode(signingInput))
    )

    // Convert ArrayBuffer signature to base64url
    const expectedSigB64 = base64UrlEncode(signature)
    if (expectedSigB64 !== sigB64) return false

    // Verify expiration
    const payloadJson = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64))) as { exp?: number }
    if (payloadJson.exp && Math.floor(Date.now() / 1000) > payloadJson.exp) return false

    return true
  } catch {
    return false
  }
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function base64UrlDecode(b64url: string): Uint8Array {
  const pad = 4 - (b64url.length % 4)
  const base64 = b64url.replace(/-/g, '+').replace(/_/g, '/') + (pad < 4 ? '='.repeat(pad) : '')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function buildContentSecurityPolicy(isDev: boolean): string {
  const scriptSources = [
    "'self'",
    "'unsafe-inline'",
    // Local dev / HMR (React Refresh) needs eval; never enabled in production.
    ...(isDev ? ["'unsafe-eval'"] : []),
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    'https://connect.facebook.net',
    'https://www.facebook.com',
    'https://us-assets.i.posthog.com',
  ].join(' ')

  const connectSources = [
    "'self'",
    'https://www.google-analytics.com',
    'https://www.googletagmanager.com',
    'https://vitals.vercel-insights.com',
    'https://connect.facebook.net',
    'https://www.facebook.com',
    'https://res.cloudinary.com',
    'https://us.i.posthog.com',
    'https://us-assets.i.posthog.com',
  ].join(' ')

  const imageSources = [
    "'self'",
    'data:',
    'blob:',
    'https://www.google-analytics.com',
    'https://www.googletagmanager.com',
    'https://www.facebook.com',
    'https://connect.facebook.net',
    'https://images.unsplash.com',
    'https://res.cloudinary.com',
    'https://purecatamphetamine.github.io',
  ].join(' ')

  return [
    "default-src 'self'",
    `script-src ${scriptSources}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    `img-src ${imageSources}`,
    "font-src 'self' https://fonts.gstatic.com data:",
    `connect-src ${connectSources}`,
    "frame-src 'self' https://www.facebook.com https://www.google.com https://maps.google.com",
    "frame-ancestors 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "media-src 'self'",
    'upgrade-insecure-requests',
  ]
    .filter(Boolean)
    .join('; ')
}

function applySecurityHeaders(response: NextResponse, isProd: boolean, isDev: boolean) {
  const headers = response.headers

  headers.set('X-DNS-Prefetch-Control', 'on')

  if (isProd) {
    headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  }

  headers.set('X-Frame-Options', 'SAMEORIGIN')
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-XSS-Protection', '1; mode=block')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  headers.set(
    'Permissions-Policy',
    [
      'accelerometer=()',
      'ambient-light-sensor=()',
      'autoplay=()',
      'camera=()',
      'encrypted-media=()',
      'fullscreen=(self)',
      'geolocation=(self)',
      'gyroscope=()',
      'magnetometer=()',
      'microphone=()',
      'payment=()',
      'picture-in-picture=(self)',
      'publickey-credentials-get=(self)',
      'screen-wake-lock=()',
      'usb=()',
      'web-share=(self)',
      'interest-cohort=()',
    ].join(', ')
  )

  const enableCrossOriginIsolation = process.env.ENABLE_CROSS_ORIGIN_ISOLATION === 'true'

  if (enableCrossOriginIsolation) {
    headers.set('Cross-Origin-Embedder-Policy', 'credentialless')
  } else {
    headers.delete('Cross-Origin-Embedder-Policy')
  }

  headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  headers.set('Cross-Origin-Resource-Policy', 'same-origin')
  headers.set('Content-Security-Policy', buildContentSecurityPolicy(isDev))
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isProd = process.env.NODE_ENV === 'production'
  const isDev = !isProd
  const requestHost = request.headers.get('host')?.toLowerCase() || ''

  let response = NextResponse.next()

  if (requestHost === WWW_HOST && WWW_HOST !== CANONICAL_HOST) {
    const redirectUrl = new URL(request.url)
    redirectUrl.host = CANONICAL_HOST
    redirectUrl.protocol = 'https:'
    response = NextResponse.redirect(redirectUrl, 308)
    applySecurityHeaders(response, isProd, isDev)
    return response
  }

  const isAdminPage = path.startsWith('/admin')
  const isAdminApi = path.startsWith('/api/admin')
  const isAdminAuthRoute = path === '/admin/login' || path === '/api/admin/auth'

  if ((isAdminPage || isAdminApi) && !isAdminAuthRoute) {
    const adminToken = request.cookies.get('admin-token')

    if (!adminToken) {
      if (path.startsWith('/api/')) {
        response = new NextResponse(
          JSON.stringify({ success: false, error: 'Unauthorized' }),
          { status: 401, headers: { 'content-type': 'application/json' } }
        )
      } else {
        response = NextResponse.redirect(new URL('/admin/login', request.url))
      }
    } else {
      const valid = await verifyJwtHS256(adminToken.value)
      if (!valid) {
        if (path.startsWith('/api/')) {
          response = new NextResponse(
            JSON.stringify({ success: false, error: 'Unauthorized' }),
            { status: 401, headers: { 'content-type': 'application/json' } }
          )
        } else {
          response = NextResponse.redirect(new URL('/admin/login', request.url))
        }
      }
    }
  }

  // CSRF protection via Origin/Referer check.
  // Browsers always send Origin on cross-origin POST/PUT/PATCH/DELETE — attackers
  // cannot forge it from JS. We only accept mutating requests whose source
  // origin matches our own host. Webhooks are exempt (they authenticate via
  // provider-signed payloads, e.g. Stripe `constructEvent`).
  const isApiRoute = path.startsWith('/api/')
  const isMutation =
    request.method !== 'GET' &&
    request.method !== 'HEAD' &&
    request.method !== 'OPTIONS'
  const isWebhook =
    path.startsWith('/api/stripe/webhook') || path.startsWith('/api/webhooks')

  if (isApiRoute && isMutation && !isWebhook) {
    const origin = request.headers.get('origin')
    const referer = request.headers.get('referer')
    const host = request.headers.get('host')

    const allowedOrigins = new Set<string>()
    if (host) {
      allowedOrigins.add(`https://${host}`)
      if (!isProd) allowedOrigins.add(`http://${host}`)
    }
    if (process.env.NEXT_PUBLIC_BASE_URL) {
      allowedOrigins.add(process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, ''))
    }
    if (process.env.VERCEL_URL) {
      allowedOrigins.add(`https://${process.env.VERCEL_URL}`)
    }

    let sourceOrigin: string | null = origin
    if (!sourceOrigin && referer) {
      try {
        sourceOrigin = new URL(referer).origin
      } catch {
        sourceOrigin = null
      }
    }

    if (!sourceOrigin || !allowedOrigins.has(sourceOrigin)) {
      response = new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Cross-origin request blocked',
        }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      )
      applySecurityHeaders(response, isProd, isDev)
      return response
    }
  }

  applySecurityHeaders(response, isProd, isDev)
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|_next/data|favicon.ico|site.webmanifest|robots.txt|sitemap.xml|image-sitemap.xml).*)',
  ],
}
