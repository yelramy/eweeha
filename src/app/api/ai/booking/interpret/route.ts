import { NextRequest, NextResponse } from 'next/server'
import { interpretBookingRequest, isAIConfigured, type BookingInterpretation } from '@/lib/ai'
import { cached } from '@/lib/cache'
import { rateLimiters, checkRateLimit } from '@/lib/ratelimit'
import { sanitizeText } from '@/utils/sanitize'
import { sendAIQuoteEmail } from '@/lib/email'

/**
 * Wedding-day plan (no prices — pricing is confirmed on WhatsApp until the
 * range-based pricing system exists).
 */
export interface QuoteResponse {
  interpretation: BookingInterpretation
  vehicles: Array<{
    id: string
    name: string
    image: string
    maxPassengers?: number
    quantity: number
    reason: string
  }>
}

function buildVehicleDetails(
  interpretation: BookingInterpretation,
  availableVehicles: Array<{ id: string; name: string; images?: { main: string; gallery: string[] }; maxPassengers?: number }>
): QuoteResponse['vehicles'] {
  return interpretation.vehicleRecommendations.map(rec => {
    const vehicle = availableVehicles.find(v => v.id === rec.vehicleId)
    return {
      id: rec.vehicleId,
      name: rec.vehicleName,
      image: vehicle?.images?.main || '',
      maxPassengers: vehicle?.maxPassengers,
      quantity: rec.quantity || 1,
      reason: rec.reason,
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const rateResult = await checkRateLimit(request, rateLimiters.contact)
    if (!rateResult.success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil((rateResult.reset - Date.now()) / 1000)) },
        }
      )
    }

    if (!isAIConfigured()) {
      return NextResponse.json(
        { success: false, error: 'AI service is not configured.' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const message = sanitizeText(body.message?.trim() || '')

    if (!message || message.length < 5) {
      return NextResponse.json(
        { success: false, error: 'Please describe what you need (at least a few words).' },
        { status: 400 }
      )
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { success: false, error: 'Message is too long. Please keep it under 2000 characters.' },
        { status: 400 }
      )
    }

    const allVehicles = await cached.vehicles.getAll()
    const availableVehicles = allVehicles.filter(v => v.available)

    const catalog = availableVehicles.map(v => ({
      id: v.id,
      name: v.name,
      maxPassengers: v.maxPassengers,
    }))

    console.log(`🤖 AI booking interpret: "${message.substring(0, 100)}" | ${catalog.length} vehicles in catalog`)

    const interpretation = await interpretBookingRequest(message, catalog)
    console.log('✅ AI interpretation:', JSON.stringify(interpretation).substring(0, 300))

    const quoteResponse: QuoteResponse = {
      interpretation,
      vehicles: buildVehicleDetails(interpretation, availableVehicles),
    }

    return NextResponse.json({ success: true, data: quoteResponse })
  } catch (error) {
    console.error('AI booking interpretation error:', error)
    const message = error instanceof Error ? error.message : 'Failed to process your request.'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const interpretation = body.interpretation as BookingInterpretation

    if (!interpretation || !Array.isArray(interpretation.vehicleRecommendations)) {
      return NextResponse.json(
        { success: false, error: 'Invalid interpretation data.' },
        { status: 400 }
      )
    }

    const allVehicles = await cached.vehicles.getAll()
    const availableVehicles = allVehicles.filter(v => v.available)

    const quoteResponse: QuoteResponse = {
      interpretation,
      vehicles: buildVehicleDetails(interpretation, availableVehicles),
    }

    return NextResponse.json({ success: true, data: quoteResponse })
  } catch (error) {
    console.error('Plan refresh error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update the plan.' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const rateResult = await checkRateLimit(request, rateLimiters.contact)
    if (!rateResult.success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests.' },
        { status: 429 }
      )
    }

    const body = await request.json()

    if (body.action === 'email') {
      const { phone, quote } = body as { phone: string; quote: QuoteResponse }

      if (!phone || !quote) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields.' },
          { status: 400 }
        )
      }

      await sendAIQuoteEmail({
        phone,
        weddingDate: quote.interpretation.weddingDate,
        vehicles: quote.vehicles.map(v => ({
          name: v.name,
          quantity: v.quantity,
          reason: v.reason,
        })),
        addOns: quote.interpretation.addOns,
        passengers: quote.interpretation.passengers,
        startingLocation: quote.interpretation.startingLocation,
        venue: quote.interpretation.venue,
        notes: quote.interpretation.notes,
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action.' },
      { status: 400 }
    )
  } catch (error) {
    console.error('AI quote email error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send email.' },
      { status: 500 }
    )
  }
}
