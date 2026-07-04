/**
 * Rate Limiting Utility
 *
 * In-memory implementation for now. Can be upgraded to Redis (Vercel KV) later for:
 * - Distributed rate limiting across multiple serverless instances
 * - Persistent rate limit state
 *
 * To upgrade to Redis:
 * 1. npm install @upstash/ratelimit @upstash/redis
 * 2. Uncomment the Redis implementation below
 * 3. Add UPSTASH_REDIS_URL and UPSTASH_REDIS_TOKEN to env vars
 */
import { createHash } from 'crypto'

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store (per serverless instance)
const rateLimitStore = new Map<string, RateLimitEntry>()

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000
let lastCleanup = 0

function cleanupExpiredEntries(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) {
    return
  }

  lastCleanup = now
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

export class RateLimiter {
  private limit: number
  private windowMs: number

  constructor(limit: number, windowMs: number) {
    this.limit = limit
    this.windowMs = windowMs
  }

  async check(identifier: string): Promise<RateLimitResult> {
    const now = Date.now()
    cleanupExpiredEntries(now)
    const key = `${identifier}`
    
    let entry = rateLimitStore.get(key)

    // Create new entry or reset if window expired
    if (!entry || entry.resetAt < now) {
      entry = {
        count: 0,
        resetAt: now + this.windowMs
      }
    }

    entry.count++
    rateLimitStore.set(key, entry)

    const success = entry.count <= this.limit
    const remaining = Math.max(0, this.limit - entry.count)

    return {
      success,
      limit: this.limit,
      remaining,
      reset: entry.resetAt
    }
  }

  async reset(identifier: string): Promise<void> {
    rateLimitStore.delete(identifier)
  }
}

// Pre-configured rate limiters
export const rateLimiters = {
  // 10 requests per 10 seconds for booking creation
  bookings: new RateLimiter(10, 10 * 1000),

  // 5 attempts per 15 minutes for login
  login: new RateLimiter(5, 15 * 60 * 1000),

  // 100 requests per minute for general API
  api: new RateLimiter(100, 60 * 1000),

  // 20 requests per hour for image uploads
  uploads: new RateLimiter(20, 60 * 60 * 1000),

  // 200 requests per minute for reads (vehicles, content)
  reads: new RateLimiter(200, 60 * 1000),

  // 100 webhook calls per minute (protect against webhook flooding)
  webhooks: new RateLimiter(100, 60 * 1000),

  // 5 contact form submissions per hour (prevent spam)
  contact: new RateLimiter(5, 60 * 60 * 1000),
}

/**
 * Helper function to get client identifier
 * Uses IP address as primary identifier
 */
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from headers (for proxies/CDNs)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const vercelIp = request.headers.get('x-vercel-ip')
  const cfIp = request.headers.get('cf-connecting-ip')
  const clientIp = request.headers.get('x-client-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const secondaryIps = [realIp, vercelIp, cfIp, clientIp]
  for (const ip of secondaryIps) {
    if (ip) {
      return ip
    }
  }

  const requestWithIp = request as Request & { ip?: string | null | undefined }
  if (requestWithIp.ip) {
    return requestWithIp.ip
  }

  const fingerprintKeys = [
    'user-agent',
    'accept-language',
    'cookie',
    'authorization',
    'referer',
    'origin',
  ] as const

  const fingerprintValues = fingerprintKeys
    .map(key => request.headers.get(key)?.trim())
    .filter((value): value is string => Boolean(value))

  if (fingerprintValues.length > 0) {
    const fingerprintSource = fingerprintValues.join('|')
    const digest = createHash('sha256').update(fingerprintSource).digest('hex')
    return `fp:${digest}`
  }

  return 'anonymous'
}

/**
 * Middleware helper for rate limiting
 */
export async function checkRateLimit(
  request: Request,
  limiter: RateLimiter
): Promise<RateLimitResult> {
  const identifier = getClientIdentifier(request)
  return limiter.check(identifier)
}

/* 
 * REDIS/UPSTASH IMPLEMENTATION (Upgrade when ready)
 * 
 * Uncomment this when you want distributed rate limiting:
 * 
 * import { Ratelimit } from '@upstash/ratelimit'
 * import { Redis } from '@upstash/redis'
 * 
 * const redis = new Redis({
 *   url: process.env.UPSTASH_REDIS_URL!,
 *   token: process.env.UPSTASH_REDIS_TOKEN!,
 * })
 * 
 * export const rateLimiters = {
 *   bookings: new Ratelimit({
 *     redis,
 *     limiter: Ratelimit.slidingWindow(10, '10 s'),
 *     analytics: true,
 *   }),
 *   
 *   login: new Ratelimit({
 *     redis,
 *     limiter: Ratelimit.slidingWindow(5, '15 m'),
 *   }),
 *   
 *   api: new Ratelimit({
 *     redis,
 *     limiter: Ratelimit.slidingWindow(100, '1 m'),
 *   }),
 * }
 * 
 * export async function checkRateLimit(request: Request, limiter: Ratelimit) {
 *   const identifier = getClientIdentifier(request)
 *   return limiter.limit(identifier)
 * }
 */

