/**
 * Input Sanitization Utilities
 * 
 * Protects against XSS (Cross-Site Scripting) attacks by sanitizing user input
 */

import { filterXSS, type IWhiteList } from 'xss'

const CONTROL_CHAR_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g
const TAG_STRIP_REGEX = /<[^>]*>/g
const DEFAULT_ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'a', 'p', 'br']
const DEFAULT_ALLOWED_ATTRIBUTES = ['href', 'target', 'rel']

const BASE_XSS_OPTIONS = {
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style'],
  allowCommentTag: false,
  css: false,
}

function buildWhiteList(tags: string[], attributes: string[]): IWhiteList {
  return tags.reduce<IWhiteList>((list, tag) => {
    list[tag] = attributes.length > 0 ? [...attributes] : []
    return list
  }, {})
}

/**
 * Sanitize HTML content - allows safe HTML tags
 * Use this for rich text content (e.g., descriptions, comments)
 */
export function sanitizeHtml(dirty: string, options?: {
  allowedTags?: string[]
  allowedAttributes?: string[]
}): string {
  const allowedTags = options?.allowedTags || DEFAULT_ALLOWED_TAGS
  const allowedAttributes = options?.allowedAttributes || DEFAULT_ALLOWED_ATTRIBUTES
  const whiteList = buildWhiteList(allowedTags, allowedAttributes)

  return filterXSS(dirty, {
    ...BASE_XSS_OPTIONS,
    whiteList,
  })
}

/**
 * Sanitize plain text - strips markup and control characters
 * Use this for user names, phone numbers, etc.
 */
export function sanitizeText(text: string): string {
  const stripped = stripHtml(text)
  const withoutTags = stripped || text.replace(TAG_STRIP_REGEX, '')
  const withoutControl = withoutTags.replace(CONTROL_CHAR_PATTERN, '')
  return withoutControl.replace(/\s+/g, ' ').trim()
}

/**
 * Sanitize email - basic validation and sanitization
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Sanitize phone number - remove non-numeric characters except + and -
 */
export function sanitizePhone(phone: string): string {
  return phone.replace(/[^0-9+\-\s]/g, '').trim()
}

/**
 * Sanitize URL - ensure it's a valid HTTP(S) URL
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    // Only allow http and https protocols
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString()
    }
    return ''
  } catch {
    return ''
  }
}

/**
 * Sanitize filename - remove dangerous characters
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.+/g, '.')
    .substring(0, 255) // Limit length
}

/**
 * Sanitize SQL input - basic protection (still use parameterized queries!)
 * This is a defense-in-depth measure
 */
export function sanitizeSqlInput(input: string): string {
  return input
    .replace(/['";]/g, '') // Remove SQL special characters
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove SQL block comments
    .trim()
}

/**
 * Sanitize object - recursively sanitize all string values
 * Use this for complex objects before storing in database
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options?: { excludeKeys?: string[] }
): T {
  const sanitized: Record<string, unknown> = { ...obj }
  
  for (const [key, value] of Object.entries(sanitized)) {
    // Skip excluded keys
    if (options?.excludeKeys?.includes(key)) {
      continue
    }

    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value)
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>, options)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeText(item) : item
      )
    }
  }
  
  return sanitized as T
}

/**
 * Validate and sanitize booking data
 */
export interface BookingInput {
  customerName: string
  customerPhone: string
  customerEmail?: string
  vanType: string
  pickupDate: string
  returnDate: string
  totalAmount: number
  paymentMethod: string
  specialRequests?: string
  // New rental fields (optional)
  rentalDays?: number
  hoursPerDay?: 6 | 10 | 24
  passengerCount?: number
  luggageCount?: number
  selectedExtras?: string[]
  selectedVariant?: Record<string, unknown>
  pricingBreakdown?: Record<string, unknown>
}

function normalizeSingleLineText(value: string): string {
  const stripped = stripHtml(value)
  const withoutTags = stripped || value.replace(TAG_STRIP_REGEX, '')
  const withoutControl = withoutTags.replace(CONTROL_CHAR_PATTERN, '')
  return withoutControl.replace(/\s+/g, ' ').trim()
}

function normalizeMultilineText(value: string): string {
  const stripped = stripHtml(value)
  const withoutTags = stripped || value.replace(TAG_STRIP_REGEX, '')
  const withoutControl = withoutTags.replace(CONTROL_CHAR_PATTERN, '')
  return withoutControl.replace(/\r\n?/g, '\n').trim()
}

export function sanitizeBookingInput(input: BookingInput): BookingInput {
  const totalAmount = Number(input.totalAmount)

  return {
    customerName: normalizeSingleLineText(input.customerName),
    customerPhone: sanitizePhone(input.customerPhone),
    customerEmail: input.customerEmail ? sanitizeEmail(input.customerEmail) : undefined,
    vanType: normalizeSingleLineText(input.vanType),
    pickupDate: normalizeSingleLineText(input.pickupDate),
    returnDate: normalizeSingleLineText(input.returnDate),
    totalAmount: Number.isFinite(totalAmount) ? totalAmount : 0,
    paymentMethod: normalizeSingleLineText(input.paymentMethod),
    specialRequests: input.specialRequests
      ? normalizeMultilineText(input.specialRequests)
      : undefined,
    // New rental fields (pass through with basic validation)
    rentalDays: input.rentalDays,
    hoursPerDay: input.hoursPerDay,
    passengerCount: input.passengerCount,
    luggageCount: input.luggageCount,
    selectedExtras: input.selectedExtras,
    selectedVariant: input.selectedVariant,
    pricingBreakdown: input.pricingBreakdown,
  }
}

/**
 * Strip HTML tags completely (more aggressive than sanitizeText)
 */
export function stripHtml(html: string): string {
  return html.replace(TAG_STRIP_REGEX, '')
}

/**
 * Truncate text to a maximum length (useful for preventing storage abuse)
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  return text.substring(0, maxLength - 3) + '...'
}

/**
 * Sanitize and validate JSON input
 */
export function sanitizeJsonInput(input: string): string | null {
  try {
    // Parse and re-stringify to validate
    const parsed = JSON.parse(input)
    return JSON.stringify(parsed)
  } catch {
    return null
  }
}

