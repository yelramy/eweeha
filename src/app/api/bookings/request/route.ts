import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import turso from '@/lib/turso'
import { sendRentalRequestNotification } from '@/lib/email'
import { rateLimiters, checkRateLimit } from '@/lib/ratelimit'
import { sanitizeText, sanitizePhone } from '@/utils/sanitize'
import { logger } from '@/utils/logger'

// Length caps applied to any free-text field. Keeps the DB from ballooning and
// blocks submission of arbitrary blobs in notification emails.
const SHORT_STR = z.string().trim().min(1).max(200)
const LONG_STR = z.string().trim().max(2000)
const DATE_STR = z.string().trim().min(1).max(32)
const TIME_STR = z.string().trim().max(32)

const DayServiceSchema = z.object({
  date: DATE_STR,
  service: z.string().trim().max(100).optional(),
  label: z.string().trim().max(200).optional(),
})

const RentalRequestSchema = z
  .object({
    // New format
    dayServices: z.array(DayServiceSchema).min(1).max(30).optional(),
    schedule: z.string().trim().max(2000).optional(),
    // Legacy format
    serviceType: z.string().trim().max(100).optional(),
    pickupDate: DATE_STR.optional(),
    pickupTime: TIME_STR.optional(),
    // Common
    customerName: z.string().trim().max(200).optional(),
    customerEmail: z.string().trim().email().optional().or(z.literal('')),
    startingLocation: SHORT_STR,
    passengers: z.coerce.number().int().min(0).max(100).optional(),
    phone: z.string().trim().min(5).max(32),
    notes: LONG_STR.optional(),
    requestedAt: z.string().trim().max(64).optional(),
  })
  .refine(
    (v) =>
      (Array.isArray(v.dayServices) && v.dayServices.length > 0) ||
      !!v.pickupDate,
    { message: 'Either dayServices or pickupDate is required' }
  )

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await checkRateLimit(request, rateLimiters.bookings)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please wait before trying again.',
        },
        { status: 429 }
      )
    }

    const rawBody = await request.json().catch(() => null)
    const parsed = RentalRequestSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid payload',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      )
    }

    const body = parsed.data
    const isNewFormat =
      Array.isArray(body.dayServices) && body.dayServices.length > 0

    const finalPickupDate = isNewFormat
      ? body.dayServices![0]?.date
      : body.pickupDate
    const finalPickupTime = isNewFormat
      ? 'Flexible (see schedule)'
      : body.pickupTime
    const finalServiceType = isNewFormat ? body.schedule : body.serviceType

    if (!finalPickupDate) {
      return NextResponse.json(
        { success: false, error: 'Pickup date is required' },
        { status: 400 }
      )
    }

    // Sanitize free-text fields before they hit the DB or notification email.
    const safeLocation = sanitizeText(body.startingLocation)
    const safePhone = sanitizePhone(body.phone)
    const safeNotes = body.notes ? sanitizeText(body.notes) : ''
    const safeServiceType = finalServiceType
      ? sanitizeText(finalServiceType)
      : 'Multi-day rental'

    const result = await turso.execute({
      sql: `INSERT INTO rental_requests (
        service_type,
        pickup_date,
        pickup_time,
        starting_location,
        passengers,
        phone,
        notes,
        status,
        requested_at,
        created_at,
        customer_name,
        customer_email
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        safeServiceType,
        finalPickupDate,
        finalPickupTime || 'TBD',
        safeLocation,
        body.passengers ?? 0,
        safePhone,
        safeNotes,
        'pending',
        body.requestedAt || new Date().toISOString(),
        new Date().toISOString(),
        body.customerName ? sanitizeText(body.customerName) : null,
        body.customerEmail?.trim() || null,
      ],
    })

    const requestId = Number(result.lastInsertRowid)

    try {
      await sendRentalRequestNotification({
        requestId,
        serviceType: safeServiceType,
        pickupDate: finalPickupDate,
        pickupTime: finalPickupTime || 'Flexible',
        startingLocation: safeLocation,
        passengers: body.passengers ?? 0,
        phone: safePhone,
        notes: safeNotes,
        requestedAt: body.requestedAt || new Date().toISOString(),
      })
    } catch (emailError) {
      logger.error('rental_request_email_error', {
        error: (emailError as Error).message,
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        requestId,
        message: 'Request received successfully',
      },
    })
  } catch (error) {
    logger.error('rental_request_error', {
      error: (error as Error).message,
    })
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
