import { NextRequest, NextResponse } from 'next/server'
import { interpretBookingRequest, isAIConfigured, type BookingInterpretation } from '@/lib/ai'
import { cached } from '@/lib/cache'
import { rateLimiters, checkRateLimit } from '@/lib/ratelimit'
import { sanitizeText } from '@/utils/sanitize'
import { sendAIQuoteEmail } from '@/lib/email'

export interface QuoteDayPricing {
  date: string
  serviceType: 'airport' | '6h' | '10h' | 'full-day'
  label: string
  vehiclePricing: Array<{
    vehicleId: string
    vehicleName: string
    quantity: number
    ratePerUnit: number
    subtotal: number
  }>
  dayTotal: number
}

export interface QuoteResponse {
  interpretation: BookingInterpretation
  pricing: {
    days: QuoteDayPricing[]
    extrasBreakdown: Array<{
      id: string
      name: string
      pricePerUnit: number
      perDay: boolean
      total: number
    }>
    subtotal: number
    onlineDiscount: number
    onlineTotal: number
    totalWithoutDiscount: number
  }
  vehicles: Array<{
    id: string
    name: string
    image: string
    maxPassengers?: number
    maxLuggage?: number
    quantity: number
    reason: string
  }>
}

const priceKeyMap: Record<string, 'price6h' | 'price10h' | 'price24h'> = {
  'airport': 'price6h',
  '6h': 'price6h',
  '10h': 'price10h',
  'full-day': 'price24h',
}

function getVehicleRate(vehicle: { price6h?: number; price10h?: number; price24h?: number } | undefined, serviceType: string): number {
  if (!vehicle) return 0
  if (serviceType === 'airport') {
    return Math.round((vehicle.price6h || 0) / 2 * 100) / 100
  }
  const key = priceKeyMap[serviceType] || 'price10h'
  if (key === 'price6h') return vehicle.price6h || 0
  if (key === 'price24h') return vehicle.price24h || 0
  return vehicle.price10h || 0
}

function calculateQuotePricing(
  interpretation: BookingInterpretation,
  availableVehicles: Array<{ id: string; name: string; price6h?: number; price10h?: number; price24h?: number; images?: { main: string; gallery: string[] }; maxPassengers?: number; maxLuggage?: number; availableExtras?: Array<{ id: string; name: string; price: number; perDay: boolean }> }>
): { pricing: QuoteResponse['pricing']; vehicles: QuoteResponse['vehicles'] } {
  const daysPricing: QuoteDayPricing[] = interpretation.days.map(day => {
    const vehiclePricing = interpretation.vehicleRecommendations.map(rec => {
      const vehicle = availableVehicles.find(v => v.id === rec.vehicleId)
      const rate = getVehicleRate(vehicle, day.serviceType)
      const qty = rec.quantity || 1
      return {
        vehicleId: rec.vehicleId,
        vehicleName: rec.vehicleName,
        quantity: qty,
        ratePerUnit: rate,
        subtotal: rate * qty,
      }
    })
    return {
      date: day.date,
      serviceType: day.serviceType,
      label: day.label,
      vehiclePricing,
      dayTotal: vehiclePricing.reduce((sum, vp) => sum + vp.subtotal, 0),
    }
  })

  const totalDays = interpretation.days.length || 1
  const extrasBreakdown = interpretation.extras
    .map(extraId => {
      for (const v of availableVehicles) {
        const extra = v.availableExtras?.find(e => e.id === extraId)
        if (extra) {
          return {
            id: extra.id,
            name: extra.name,
            pricePerUnit: extra.price,
            perDay: extra.perDay,
            total: extra.perDay ? extra.price * totalDays : extra.price,
          }
        }
      }
      return null
    })
    .filter((e): e is NonNullable<typeof e> => e !== null)

  const daysSubtotal = daysPricing.reduce((sum, d) => sum + d.dayTotal, 0)
  const extrasSubtotal = extrasBreakdown.reduce((sum, e) => sum + e.total, 0)
  const subtotal = Math.round((daysSubtotal + extrasSubtotal) * 100) / 100
  const onlineDiscount = Math.round(subtotal * 0.10 * 100) / 100
  const onlineTotal = Math.round((subtotal - onlineDiscount) * 100) / 100

  const vehicleDetails = interpretation.vehicleRecommendations.map(rec => {
    const vehicle = availableVehicles.find(v => v.id === rec.vehicleId)
    return {
      id: rec.vehicleId,
      name: rec.vehicleName,
      image: vehicle?.images?.main || '',
      maxPassengers: vehicle?.maxPassengers,
      maxLuggage: vehicle?.maxLuggage,
      quantity: rec.quantity || 1,
      reason: rec.reason,
    }
  })

  return {
    pricing: { days: daysPricing, extrasBreakdown, subtotal, onlineDiscount, onlineTotal, totalWithoutDiscount: subtotal },
    vehicles: vehicleDetails,
  }
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
      maxLuggage: v.maxLuggage,
      price6h: v.price6h,
      price10h: v.price10h,
      price24h: v.price24h,
      availableExtras: v.availableExtras,
    }))

    console.log(`🤖 AI booking interpret: "${message.substring(0, 100)}" | ${catalog.length} vehicles in catalog`)

    const interpretation = await interpretBookingRequest(message, catalog)
    console.log('✅ AI interpretation:', JSON.stringify(interpretation).substring(0, 300))

    const { pricing, vehicles: vehicleDetails } = calculateQuotePricing(interpretation, availableVehicles)
    const quoteResponse: QuoteResponse = { interpretation, pricing, vehicles: vehicleDetails }

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

    if (!interpretation || !Array.isArray(interpretation.days)) {
      return NextResponse.json(
        { success: false, error: 'Invalid interpretation data.' },
        { status: 400 }
      )
    }

    const allVehicles = await cached.vehicles.getAll()
    const availableVehicles = allVehicles.filter(v => v.available)

    const { pricing, vehicles: vehicleDetails } = calculateQuotePricing(interpretation, availableVehicles)
    const quoteResponse: QuoteResponse = { interpretation, pricing, vehicles: vehicleDetails }

    return NextResponse.json({ success: true, data: quoteResponse })
  } catch (error) {
    console.error('Quote reprice error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to recalculate pricing.' },
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
        days: quote.interpretation.days,
        vehicles: quote.vehicles.map(v => ({
          name: v.name,
          quantity: v.quantity,
          reason: v.reason,
        })),
        passengers: quote.interpretation.passengers,
        startingLocation: quote.interpretation.startingLocation,
        subtotal: quote.pricing.subtotal,
        onlineTotal: quote.pricing.onlineTotal,
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
