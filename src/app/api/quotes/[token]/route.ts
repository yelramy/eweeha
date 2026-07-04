import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import turso from '@/lib/turso'
import { rateLimiters, checkRateLimit } from '@/lib/ratelimit'
import {
  isQuoteExpired,
  parseQuoteDetails,
  type RentalRequestQuote,
} from '@/lib/quotes'

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    if (!token || token.length < 16) {
      return NextResponse.json(
        { success: false, error: 'Invalid quote link' },
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
    const details = parseQuoteDetails(quote.quote_details)
    const totalPrice = quote.total_price ?? quote.quoted_price ?? 0
    const depositAmount = quote.deposit_amount ?? totalPrice
    const expired = isQuoteExpired(quote.quote_expires_at)
    const accepted = !!quote.booking_id || quote.status === 'confirmed'

    let state: 'active' | 'expired' | 'accepted' = 'active'
    if (accepted) state = 'accepted'
    else if (expired || quote.status === 'expired') state = 'expired'

    return NextResponse.json({
      success: true,
      data: {
        state,
        requestId: quote.id,
        customerName: quote.customer_name,
        description: details.description || quote.service_type,
        schedule: details.schedule,
        pickupDate: details.pickupDate || quote.pickup_date,
        returnDate: details.returnDate || quote.pickup_date,
        pickupTime: quote.pickup_time,
        startingLocation:
          details.startingLocation || quote.starting_location,
        passengers: details.passengers ?? quote.passengers,
        totalPrice,
        depositAmount,
        amountDueNow: depositAmount,
        balanceDue: Math.max(0, totalPrice - depositAmount),
        isDepositOnly: depositAmount < totalPrice,
        expiresAt: quote.quote_expires_at,
        bookingId: quote.booking_id,
        notes: details.notes || quote.notes,
      },
    })
  } catch (error) {
    console.error('Failed to fetch quote:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load quote' },
      { status: 500 }
    )
  }
}
