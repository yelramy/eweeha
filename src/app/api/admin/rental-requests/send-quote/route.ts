import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isAdminRequestAuthorized } from '@/lib/auth'
import turso from '@/lib/turso'
import {
  buildQuoteUrl,
  computeAmountDueNow,
  generateQuoteToken,
  type QuoteDetails,
} from '@/lib/quotes'
import { sendQuoteEmail } from '@/lib/email'
import { sanitizeText, sanitizePhone } from '@/utils/sanitize'

const SendQuoteSchema = z.object({
  requestId: z.number().int().positive().optional(),
  customerName: z.string().trim().min(1).max(200),
  customerEmail: z.string().trim().email().optional().or(z.literal('')),
  customerPhone: z.string().trim().min(5).max(32),
  description: z.string().trim().min(1).max(2000),
  pickupDate: z.string().trim().min(1).max(32),
  returnDate: z.string().trim().max(32).optional(),
  pickupTime: z.string().trim().max(32).optional(),
  startingLocation: z.string().trim().max(200).optional(),
  passengers: z.coerce.number().int().min(1).max(100).optional(),
  totalPrice: z.coerce.number().positive(),
  paymentType: z.enum(['full', 'percent', 'fixed']),
  paymentValue: z.coerce.number().positive(),
  expiryDays: z.coerce.number().int().min(1).max(30).default(7),
  sendEmail: z.boolean().optional().default(true),
  schedule: z.string().trim().max(2000).optional(),
  notes: z.string().trim().max(2000).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const authorized = isAdminRequestAuthorized(
      request.cookies.get('admin-token')?.value
    )
    if (!authorized) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parsed = SendQuoteSchema.safeParse(body)
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

    const data = parsed.data
    const totalPrice = Math.round(data.totalPrice * 100) / 100
    const depositAmount = computeAmountDueNow(
      totalPrice,
      data.paymentType,
      data.paymentValue
    )

    if (depositAmount <= 0 || depositAmount > totalPrice) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount due now' },
        { status: 400 }
      )
    }

    const token = generateQuoteToken()
    const expiresAt = new Date(
      Date.now() + data.expiryDays * 24 * 60 * 60 * 1000
    ).toISOString()
    const now = new Date().toISOString()
    const quoteUrl = buildQuoteUrl(token)

    const quoteDetails: QuoteDetails = {
      description: sanitizeText(data.description),
      schedule: data.schedule ? sanitizeText(data.schedule) : undefined,
      pickupDate: data.pickupDate,
      returnDate: data.returnDate || data.pickupDate,
      startingLocation: data.startingLocation
        ? sanitizeText(data.startingLocation)
        : undefined,
      passengers: data.passengers,
      notes: data.notes ? sanitizeText(data.notes) : undefined,
    }

    const safePhone = sanitizePhone(data.customerPhone)
    const safeName = sanitizeText(data.customerName)
    const safeEmail = data.customerEmail?.trim() || null
    const returnDate = data.returnDate || data.pickupDate
    const pickupTime = data.pickupTime || 'Flexible'
    const startingLocation =
      data.startingLocation?.trim() || 'As agreed'
    const passengers = data.passengers ?? 1

    let requestId = data.requestId

    if (requestId) {
      const existing = await turso.execute({
        sql: `SELECT id, status, booking_id FROM rental_requests WHERE id = ?`,
        args: [requestId],
      })
      if (existing.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Request not found' },
          { status: 404 }
        )
      }
      const row = existing.rows[0]
      if (row.booking_id) {
        return NextResponse.json(
          { success: false, error: 'This request already has a booking' },
          { status: 400 }
        )
      }

      await turso.execute({
        sql: `UPDATE rental_requests SET
          customer_name = ?,
          customer_email = ?,
          phone = ?,
          service_type = ?,
          pickup_date = ?,
          pickup_time = ?,
          starting_location = ?,
          passengers = ?,
          notes = ?,
          status = 'quoted',
          quoted_price = ?,
          quoted_at = ?,
          quote_token = ?,
          quote_expires_at = ?,
          total_price = ?,
          deposit_amount = ?,
          quote_details = ?,
          updated_at = ?
        WHERE id = ?`,
        args: [
          safeName,
          safeEmail,
          safePhone,
          quoteDetails.description || data.description,
          data.pickupDate,
          pickupTime,
          startingLocation,
          passengers,
          data.notes ? sanitizeText(data.notes) : null,
          totalPrice,
          now,
          token,
          expiresAt,
          totalPrice,
          depositAmount,
          JSON.stringify(quoteDetails),
          now,
          requestId,
        ],
      })
    } else {
      const result = await turso.execute({
        sql: `INSERT INTO rental_requests (
          service_type, pickup_date, pickup_time, starting_location,
          passengers, phone, notes, status, quoted_price, quoted_at,
          requested_at, created_at, updated_at,
          customer_name, customer_email, quote_token, quote_expires_at,
          total_price, deposit_amount, quote_details
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'quoted', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          quoteDetails.description || data.description,
          data.pickupDate,
          pickupTime,
          startingLocation,
          passengers,
          safePhone,
          data.notes ? sanitizeText(data.notes) : null,
          totalPrice,
          now,
          now,
          now,
          now,
          safeName,
          safeEmail,
          token,
          expiresAt,
          totalPrice,
          depositAmount,
          JSON.stringify(quoteDetails),
        ],
      })
      requestId = Number(result.lastInsertRowid)
    }

    if (data.sendEmail && safeEmail) {
      try {
        await sendQuoteEmail({
          customerName: safeName,
          customerEmail: safeEmail,
          quoteUrl,
          totalPrice,
          depositAmount,
          description: quoteDetails.description || data.description,
          expiresAt,
        })
      } catch (emailError) {
        console.error('Failed to send quote email:', emailError)
      }
    }

    const isDepositOnly = depositAmount < totalPrice
    const whatsappMessage = `Hi ${safeName}! Your Eweeha quote is ready.\n\n${quoteDetails.description || data.description}\nTotal: $${totalPrice.toFixed(2)}\n${isDepositOnly ? `Non-refundable deposit due now: $${depositAmount.toFixed(2)}` : `Amount due now: $${depositAmount.toFixed(2)}`}\n\nPay online to confirm your booking:\n${quoteUrl}\n\nThis link expires ${new Date(expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.`

    return NextResponse.json({
      success: true,
      data: {
        requestId,
        quoteToken: token,
        quoteUrl,
        totalPrice,
        depositAmount,
        expiresAt,
        whatsappMessage,
      },
    })
  } catch (error) {
    console.error('Failed to send quote:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create quote' },
      { status: 500 }
    )
  }
}
