import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import bookings from '@/lib/bookings'
import { getAmountDueNow } from '@/lib/quotes'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-10-29.clover',
  })
}

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  try {
    const body = await request.json()
    
    const { bookingId } = body

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      )
    }

    const booking = await bookings.getByBookingId(bookingId)
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    if (booking.payment_status === 'completed' || booking.payment_status === 'confirmed') {
      const due = getAmountDueNow(booking)
      if (due <= 0) {
        return NextResponse.json(
          { error: 'Booking already paid' },
          { status: 400 }
        )
      }
    }

    let amount = getAmountDueNow(booking)
    if (amount <= 0) {
      amount = booking.total_amount
    }

    if (booking.payment_method === 'stripe' && booking.request_id) {
      amount = Math.round(amount * 1.05 * 100) / 100
    } else if (booking.payment_method === 'stripe' && !booking.request_id) {
      // Wizard bookings: total_amount may already include stripe fee from pricing engine
      amount = booking.total_amount - (booking.amount_paid ?? 0)
      if (amount <= 0) amount = booking.total_amount
    }

    const currency = 'USD'
    const customerName = booking.customer_name
    const customerEmail = booking.customer_email

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL 
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: 'Wedding Car Rental - Eweeha',
              description: `Booking ID: ${bookingId}`,
              images: [`${baseUrl}/images/fleet/standard.svg`],
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: customerEmail,
      client_reference_id: bookingId,
      metadata: {
        bookingId,
        customerName,
        paymentType: (booking.deposit_amount ?? 0) < booking.total_amount ? 'deposit' : 'full',
      },
      success_url: `${baseUrl}/payment/success?booking=${bookingId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/payment/cancelled?booking=${bookingId}`,
    })

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
      amountDue: amount,
    })

  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
