import { NextRequest, NextResponse } from 'next/server'
import bookings from '@/lib/bookings'
import { sendBookingConfirmation } from '@/lib/email'
import { verifyWebhookSignature } from '@/lib/checkout'
import turso from '@/lib/turso'

// Simple in-memory idempotency store (per process). For production, use a shared persistent store.
const processedEvents = new Set<string>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('checkout-signature')

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const event = JSON.parse(body)

    // Idempotency: skip if we've seen this event ID already (in-memory or DB)
    const eventId: string | undefined = event?.id || event?.data?.id
    if (eventId) {
      if (processedEvents.has(eventId)) {
        return NextResponse.json({ received: true, duplicate: true })
      }
      const existing = await turso.execute({
        sql: 'SELECT id FROM webhook_events WHERE id = ? LIMIT 1',
        args: [eventId]
      })
      if (existing.rows.length > 0) {
        processedEvents.add(eventId)
        return NextResponse.json({ received: true, duplicate: true })
      }
    }

    if (event.type === 'payment_approved') {
      const paymentId = event.data.id
      const reference = event.data.reference // This is our booking ID
      
      // Update booking payment status
      await bookings.updatePaymentStatus(reference, 'completed', paymentId)
      
      // Send confirmation email
      const booking = await bookings.getByBookingId(reference)
      if (booking && booking.customer_email) {
        await sendBookingConfirmation(booking)
      }
      
      console.log(`Payment approved for booking: ${reference}`)
    }

    if (event.type === 'payment_declined') {
      const reference = event.data.reference
      await bookings.updatePaymentStatus(reference, 'failed')
      console.log(`Payment declined for booking: ${reference}`)
    }

    if (eventId) {
      processedEvents.add(eventId)
      await turso.execute({
        sql: 'INSERT OR IGNORE INTO webhook_events (id, source) VALUES (?, ?)',
        args: [eventId, 'checkout']
      })
    }
    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
