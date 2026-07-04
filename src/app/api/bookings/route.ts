import { NextRequest, NextResponse } from 'next/server'
import bookings, { Booking, createBookingAccessToken } from '@/lib/bookings'
import { generateBookingId } from '@/lib/bookingId'
import { BookingCreateSchema } from '@/utils/validation'
import { sendBookingConfirmation, sendAdminNotification } from '@/lib/email'
import vehicles from '@/lib/vehicles'
import { logger } from '@/utils/logger'
import { calculateBookingPeriod, calculatePricing, DEFAULT_BOOKING_CONFIG } from '@/utils/bookingUtils'
import { rateLimiters, checkRateLimit } from '@/lib/ratelimit'
import { sanitizeBookingInput } from '@/utils/sanitize'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting - prevent booking spam
    const rateLimitResult = await checkRateLimit(request, rateLimiters.bookings)
    if (!rateLimitResult.success) {
      logger.warn('booking_rate_limited', { 
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        remaining: rateLimitResult.remaining 
      })
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many booking requests. Please wait before trying again.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.reset - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(rateLimitResult.reset)
          }
        }
      )
    }

    // 2. Parse and validate input
    const rawData = await request.json()
    const parsed = BookingCreateSchema.safeParse(rawData)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
    }
    
    // 3. Sanitize input to prevent XSS
    const sanitized = sanitizeBookingInput(parsed.data)
    const { 
      customerName, 
      customerPhone, 
      customerEmail, 
      vanType, 
      pickupDate, 
      returnDate, 
      totalAmount, 
      paymentMethod,
      rentalDays,
      hoursPerDay,
      passengerCount,
      luggageCount,
      selectedExtras,
      selectedVariant,
      pricingBreakdown
    } = sanitized

    // Validate required fields
    const missingFields = []
    if (!customerName) missingFields.push('customerName')
    if (!customerPhone) missingFields.push('customerPhone')
    if (!vanType) missingFields.push('vanType')
    if (!pickupDate) missingFields.push('pickupDate')
    if (!returnDate) missingFields.push('returnDate')
    if (!totalAmount) missingFields.push('totalAmount')
    if (!paymentMethod) missingFields.push('paymentMethod')
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields)
      console.error('Received data:', { customerName, customerPhone, vanType, pickupDate, returnDate, totalAmount, paymentMethod })
      return NextResponse.json(
        { 
          error: 'Missing required fields', 
          missingFields,
          success: false
        },
        { status: 400 }
      )
    }

    // Validate phone
    const { validatePhone } = await import('@/utils/validation')
    if (!validatePhone(customerPhone)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number' },
        { status: 400 }
      )
    }

    // Validate vehicle exists
    const vehicle = await vehicles.getById(vanType)
    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: 'Invalid vehicle selection' },
        { status: 400 }
      )
    }

    // Compute authoritative server-side amount
    let normalizedAmount = totalAmount
    let computedPricing = null

    // Use new rental pricing if available, otherwise fall back to legacy
    if (rentalDays && hoursPerDay && (hoursPerDay === 6 || hoursPerDay === 10 || hoursPerDay === 24)) {
      try {
        const { calculateRentalPricing } = await import('@/utils/bookingUtils')
        computedPricing = calculateRentalPricing(
          vehicle,
          rentalDays,
          hoursPerDay,
          selectedExtras || [],
          DEFAULT_BOOKING_CONFIG,
          paymentMethod
        )
        normalizedAmount = Math.round(computedPricing.total * 100) / 100
      } catch (error) {
        console.error('Rental pricing calculation failed, using provided amount:', error)
      }
    } else {
      // Legacy pricing calculation
      const [pickupDateOnly, pickupTime = '00:00'] = (pickupDate || '').trim().split(/\s+/)
      const [returnDateOnly, returnTime = '00:00'] = (returnDate || '').trim().split(/\s+/)
      const period = calculateBookingPeriod(pickupDateOnly, pickupTime, returnDateOnly, returnTime)
      computedPricing = calculatePricing(vehicle, period, DEFAULT_BOOKING_CONFIG, false)
      normalizedAmount = Math.round(computedPricing.total * 100) / 100
    }

    // If the booker is authenticated, tag the booking with their opaque user id
    // so they can retrieve it later via /api/users/bookings. Guest bookings
    // remain `user_id = null` (guest-only flow is still supported).
    const session = await getServerSession(authOptions)
    const userId = (session?.user as { id?: string } | undefined)?.id ?? null

    const booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'> = {
      booking_id: generateBookingId(),
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      van_type: vehicle.id,
      pickup_date: pickupDate,
      return_date: returnDate,
      total_amount: normalizedAmount,
      payment_method: paymentMethod,
      payment_status: 'pending',
      user_id: userId,
      rental_days: rentalDays || null,
      hours_per_day: hoursPerDay || null,
      passenger_count: passengerCount || null,
      luggage_count: luggageCount || null,
      selected_extras: selectedExtras ? JSON.stringify(selectedExtras) : null,
      selected_variant: selectedVariant ? JSON.stringify(selectedVariant) : null,
      pricing_breakdown: pricingBreakdown ? JSON.stringify(pricingBreakdown) : (computedPricing ? JSON.stringify(computedPricing) : null)
    }

    const createdBooking = await bookings.create(booking)

    if (!createdBooking) {
      throw new Error('Failed to create booking')
    }

    // Create an access token for the customer to view booking details (30 days)
    const accessToken = await createBookingAccessToken(createdBooking.booking_id, 30 * 24 * 60) // 30 days

    // Send notifications
    if (customerEmail) {
      // Validate email format before sending
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (emailRegex.test(customerEmail)) {
        await sendBookingConfirmation(createdBooking, accessToken)
      } else {
        console.warn('Invalid email format, skipping customer notification:', customerEmail)
      }
    }
    await sendAdminNotification(createdBooking)

    logger.info('booking_created', { route: '/api/bookings', method: 'POST', bookingId: createdBooking.booking_id })

    return NextResponse.json({
      success: true,
      data: createdBooking,
      accessToken
    })

  } catch (error) {
    logger.error('booking_create_error', { route: '/api/bookings', method: 'POST', error: (error as Error).message })
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Restrict list to admin users only; use separate admin endpoint if needed
  return NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { status: 401 }
  )
}
