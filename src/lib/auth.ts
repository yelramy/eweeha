import { createHmac, timingSafeEqual } from 'crypto'
import bcrypt from 'bcryptjs'
import turso from './turso'

// Minimal JWT (HS256) utilities for admin auth
// Note: This is a focused implementation to avoid an extra dependency.

function base64url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input)
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function fromBase64url(input: string): Buffer {
  const pad = 4 - (input.length % 4)
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/') + (pad < 4 ? '='.repeat(pad) : '')
  return Buffer.from(normalized, 'base64')
}

export interface AdminJwtPayload {
  sub: string
  iat: number
  exp: number
}

export function signAdminJwt(payload: Omit<AdminJwtPayload, 'iat'>, secretParam?: string): string {
  const isProd = process.env.NODE_ENV === 'production'
  const secretEnv = process.env.ADMIN_JWT_SECRET
  const secret = secretParam ?? (isProd ? (secretEnv || '') : (secretEnv || 'dev-secret'))
  
  // Validate secret strength in production
  if (!secret) {
    throw new Error('ADMIN_JWT_SECRET must be set in production')
  }
  if (isProd) {
    if (secret.length < 32) {
      throw new Error('ADMIN_JWT_SECRET must be at least 32 characters in production')
    }
    if (secret === 'dev-secret' || secret === 'your_secret_min_32_chars') {
      throw new Error('ADMIN_JWT_SECRET must not use default/example values in production')
    }
  }
  const header = { alg: 'HS256', typ: 'JWT' }
  const iat = Math.floor(Date.now() / 1000)
  const fullPayload: AdminJwtPayload = { ...payload, iat }

  const headerB64 = base64url(JSON.stringify(header))
  const payloadB64 = base64url(JSON.stringify(fullPayload))
  const signingInput = `${headerB64}.${payloadB64}`
  const signature = createHmac('sha256', secret).update(signingInput).digest()
  const sigB64 = base64url(signature)
  return `${signingInput}.${sigB64}`
}

export function verifyAdminJwt(token: string, secretParam?: string): AdminJwtPayload | null {
  try {
    const isProd = process.env.NODE_ENV === 'production'
    const secretEnv = process.env.ADMIN_JWT_SECRET
    const secret = secretParam ?? (isProd ? (secretEnv || '') : (secretEnv || 'dev-secret'))
    if (!secret) return null
    
    // Validate secret strength in production
    if (isProd && secret.length < 32) {
      console.error('ADMIN_JWT_SECRET is too weak in production')
      return null
    }
    const [headerB64, payloadB64, sigB64] = token.split('.')
    if (!headerB64 || !payloadB64 || !sigB64) return null

    const signingInput = `${headerB64}.${payloadB64}`
    const expected = createHmac('sha256', secret).update(signingInput).digest()
    const given = fromBase64url(sigB64)
    if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null

    const payload = JSON.parse(fromBase64url(payloadB64).toString()) as AdminJwtPayload
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null
    return payload
  } catch {
    return null
  }
}

export function createAdminToken(username: string, daysValid = 7): string {
  const now = Math.floor(Date.now() / 1000)
  const exp = now + daysValid * 24 * 60 * 60
  return signAdminJwt({ sub: username, exp })
}

export function isAdminRequestAuthorized(cookieValue?: string | null): boolean {
  if (!cookieValue) return false
  const payload = verifyAdminJwt(cookieValue)
  return Boolean(payload)
}

/**
 * Verify admin authentication from NextRequest
 * Used by API routes
 */
export async function verifyAdmin(request: { cookies: { get: (name: string) => { value: string } | undefined } }): Promise<{ authenticated: boolean; username?: string }> {
  const token = request.cookies.get('admin-token')
  if (!token) {
    return { authenticated: false }
  }
  
  const payload = verifyAdminJwt(token.value)
  if (!payload) {
    return { authenticated: false }
  }
  
  return {
    authenticated: true,
    username: payload.sub
  }
}

export async function authUser(username: string, password: string) {
  const result = await turso.execute({
    sql: 'SELECT * FROM users WHERE username = ?',
    args: [username]
  })
  if (result.rows.length === 0) return null
  
  const user = result.rows[0]
  const hash = (user.password_hash ?? '') as string
  if (!hash) return null
  if (await bcrypt.compare(password, hash)) {
    return { id: user.id, username: user.username, email: user.email ?? undefined }
  }
  return null
}

