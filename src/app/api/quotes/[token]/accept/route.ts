import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import turso from '@/lib/turso'
import bookings, { createBookingAccessToken } from '@/lib/bookings'
import { generateBookingId } from '@/lib/bookingId'
import {
  isQuoteExpired,
  parseQuoteDetails,
  type RentalRequestQuote,
} from '@/lib/quotes'
import { rateLimiters, checkRateLimit } from '@/lib/ratelimit'
import { sanitizePhone, sanitizeText } from '@/utils/sanitize'
import { sendBookingConfirmation, sendAdminNotification } from '@/lib/email'
import Stripe from 'stripe'

const AcceptQuoteSchema = z
  .object({
    paymentMethod: z.enum(['stripe', 'omt', 'whish-money', 'bank-transfer']),
    termsAccepted: z.boolean(),
    customerName: z.string().trim().min(1).max(200).optional(),
    customerEmail: z.string().trim().email().optional().or(z.literal('')),
    customerPhone: z.string().trim().min(5).max(32).optional(),
  })
  .refine((v) => v.termsAccepted === true, {
    message: 'You must accept the terms',
    path: ['termsAccepted'],
  })

function rowToQuote(row: Record<string, unknown>): RentalRequestQuote {
  return {
    id: Number(row.id),
    service_type: String(row.service_type),
    pickup_date: String(row.pickup_date),
    pickup_time: String(row.pickup_time),
    starting_location: String(row.starting_location),
    passengers: Number(row.passengers ?? 1),
    phone: String(row.phone),
    notes: row.notes != null ? String(row.notes) : null,
    status: String(row.status),
    quoted_price: row.quoted_price != null ? Number(row.quoted_price) : null,
    quoted_at: row.quoted_at != null ? String(row.quoted_at) : null,
    confirmed_at: row.confirmed_at != null ? String(row.confirmed_at) : null,
    requested_at: String(row.requested_at),
    customer_name: row.customer_name != null ? String(row.customer_name) : null,
    customer_email:
      row.customer_email != null ? String(row.customer_email) : null,
    quote_token: row.quote_token != null ? String(row.quote_token) : null,
    quote_expires_at:
      row.quote_expires_at != null ? String(row.quote_expires_at) : null,
    total_price: row.total_price != null ? Number(row.total_price) : null,
    deposit_amount:
      row.deposit_amount != null ? Number(row.deposit_amount) : null,
    quote_details:
      row.quote_details != null ? String(row.quote_details) : null,
    booking_id: row.booking_id != null ? String(row.booking_id) : null,
  }
}

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-10-29.clover',
  })
}

function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    'http://localhost:3000'
  )
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
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

    const { token } = await params
    const parsed = AcceptQuoteSchema.safeParse(await request.json())
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

    const result = await turso.execute({
      sql: `SELECT * FROM rental_requests WHERE quote_token = ?`,
      args: [token],
    })

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 }
      )
    }

    const quote = rowToQuote(result.rows[0] as Record<string, unknown>)

    if (quote.booking_id) {
      const accessToken = await createBookingAccessToken(quote.booking_id, 30 * 24 * 60)
      return NextResponse.json({
        success: true,
        data: {
          alreadyAccepted: true,
          bookingId: quote.booking_id,
          accessToken,
          redirectUrl: `/booking/confirmation?booking=${quote.booking_id}&token=${accessToken}`,
        },
      })
    }

    if (isQuoteExpired(quote.quote_expires_at)) {
      return NextResponse.json(
        { success: false, error: 'This quote has expired' },
        { status: 410 }
      )
    }

    if (quote.status !== 'quoted') {
      return NextResponse.json(
        { success: false, error: 'This quote is no longer available' },
        { status: 400 }
      )
    }

    const details = parseQuoteDetails(quote.quote_details)
    const totalPrice = quote.total_price ?? quote.quoted_price ?? 0
    const depositAmount = quote.deposit_amount ?? totalPrice
    const { paymentMethod } = parsed.data

    const customerName = sanitizeText(
      parsed.data.customerName || quote.customer_name || 'Customer'
    )
    const customerPhone = sanitizePhone(
      parsed.data.customerPhone || quote.phone
    )
    const customerEmail =
      parsed.data.customerEmail?.trim() || quote.customer_email || undefined

    let amountDue = depositAmount
    if (paymentMethod === 'stripe') {
      amountDue = Math.round(depositAmount * 1.05 * 100) / 100
    }

    const bookingId = generateBookingId()
    const pickupDate = details.pickupDate || quote.pickup_date
    const returnDate = details.returnDate || quote.pickup_date

    const createdBooking = await bookings.create({
      booking_id: bookingId,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      van_type: details.vehicleName || 'quoted-service',
      pickup_date: pickupDate,
      return_date: returnDate,
      total_amount: totalPrice,
      deposit_amount: depositAmount,
      amount_paid: 0,
      request_id: quote.id,
      payment_method: paymentMethod,
      payment_status: 'pending',
      pricing_breakdown: JSON.stringify({
        source: 'quote',
        description: details.description || quote.service_type,
        schedule: details.schedule,
        amountDueNow: depositAmount,
        stripeFeeApplied: paymentMethod === 'stripe',
      }),
    })

    if (!createdBooking) {
      throw new Error('Failed to create booking')
    }

    const accessToken = await createBookingAccessToken(bookingId, 30 * 24 * 60)
    const now = new Date().toISOString()

    await turso.execute({
      sql: `UPDATE rental_requests SET status = 'confirmed', booking_id = ?, confirmed_at = ?, updated_at = ? WHERE id = ?`,
      args: [bookingId, now, now, quote.id],
    })

    if (customerEmail) {
      try {
        await sendBookingConfirmation(createdBooking, accessToken)
      } catch {
        // non-blocking
      }
    }
    try {
      await sendAdminNotification(createdBooking)
    } catch {
      // non-blocking
    }

    if (paymentMethod === 'stripe') {
      const stripe = getStripe()
      const baseUrl = getBaseUrl()
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Eweeha — Booking commitment',
                description: `${details.description || quote.service_type} (${bookingId})`,
              },
              unit_amount: Math.round(amountDue * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        customer_email: customerEmail,
        client_reference_id: bookingId,
        metadata: {
          bookingId,
          requestId: String(quote.id),
          paymentType: depositAmount < totalPrice ? 'deposit' : 'full',
        },
        success_url: `${baseUrl}/payment/success?booking=${bookingId}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/payment/cancelled?booking=${bookingId}`,
      })

      return NextResponse.json({
        success: true,
        data: {
          bookingId,
          accessToken,
          paymentMethod: 'stripe',
          checkoutUrl: session.url,
        },
      })
    }

    const paymentPaths: Record<string, string> = {
      omt: 'omt',
      'whish-money': 'whish-money',
      'bank-transfer': 'bank-transfer',
    }
    const paymentPath = paymentPaths[paymentMethod]

    return NextResponse.json({
      success: true,
      data: {
        bookingId,
        accessToken,
        paymentMethod,
        redirectUrl: `/payment/${paymentPath}?booking=${bookingId}&token=${accessToken}&amount=${depositAmount}`,
      },
    })
  } catch (error) {
    console.error('Failed to accept quote:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to accept quote' },
      { status: 500 }
    )
  }
}
