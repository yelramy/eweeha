import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import bookings from '@/lib/bookings'
import { rateLimiters, checkRateLimit } from '@/lib/ratelimit'
import turso from '@/lib/turso'
import { sendPaymentConfirmation } from '@/lib/email'
import { ensureStripePaymentDetailsTable, upsertStripePaymentDetail } from '@/lib/stripePayments'
import { getCommitmentAmount } from '@/lib/quotes'

// Lazy initialization - only create Stripe instance when needed
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
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  
  // Rate limiting - protect against webhook flooding
  const rateLimitResult = await checkRateLimit(request, rateLimiters.webhooks)
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many webhook requests' },
      { status: 429 }
    )
  }
  
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    if (!webhookSecret) {
      return NextResponse.json(
        { error: 'STRIPE_WEBHOOK_SECRET is not configured' },
        { status: 500 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('⚠️ Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Idempotency check - prevent processing same event twice
    const existingEvent = await turso.execute({
      sql: 'SELECT id FROM webhook_events WHERE id = ? AND source = ?',
      args: [event.id, 'stripe']
    })
    
    if (existingEvent.rows.length > 0) {
      console.log('⚠️ Duplicate webhook event, already processed:', event.id)
      return NextResponse.json({ received: true })
    }

    // Record event as processed
    await turso.execute({
      sql: 'INSERT INTO webhook_events (id, source, received_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
      args: [event.id, 'stripe']
    })

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        const bookingId = session.client_reference_id || session.metadata?.bookingId
        const paymentIntentId = typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id
        
        // Detect payment link origin.
        // Payment Link metadata does NOT transfer to Session metadata,
        // so we check session.payment_link (set by Stripe) and look up our DB.
        let linkId: string | null = session.metadata?.linkId || null
        let isPaymentLink = session.metadata?.source === 'admin_payment_link'
        
        const stripePaymentLinkId = typeof session.payment_link === 'string'
          ? session.payment_link
          : (session.payment_link as Stripe.PaymentLink | null)?.id || null
        
        if (!isPaymentLink && stripePaymentLinkId) {
          try {
            const lookupResult = await turso.execute({
              sql: `SELECT id FROM payment_links WHERE stripe_link_id = ?`,
              args: [stripePaymentLinkId],
            })
            if (lookupResult.rows.length > 0) {
              linkId = lookupResult.rows[0].id as string
              isPaymentLink = true
              console.log('✅ Matched payment link via session.payment_link:', stripePaymentLinkId, '→ linkId:', linkId)
            }
          } catch (lookupError) {
            console.error('❌ Failed to look up payment link by stripe_link_id:', lookupError)
          }
        }
        
        // Fetch payment link data once (for both status update and payment detail storage)
        let paymentLinkData: { description: string | null; customerName: string | null; customerEmail: string | null; stripeLinkId: string | null } | null = null
        
        // Handle payment link payments
        if (isPaymentLink && linkId) {
          try {
            // Fetch payment link data first (we'll use it later for payment details)
            const paymentLinkResult = await turso.execute({
              sql: `SELECT description, customer_name, customer_email, stripe_link_id FROM payment_links WHERE id = ?`,
              args: [linkId],
            })
            if (paymentLinkResult.rows.length > 0) {
              const row = paymentLinkResult.rows[0]
              paymentLinkData = {
                description: row.description as string | null,
                customerName: row.customer_name as string | null,
                customerEmail: row.customer_email as string | null,
                stripeLinkId: row.stripe_link_id as string | null,
              }
            }

            // Update payment link status
            await turso.execute({
              sql: `UPDATE payment_links SET status = 'paid', payment_intent_id = ?, paid_at = CURRENT_TIMESTAMP WHERE id = ?`,
              args: [String(session.payment_intent || ''), linkId]
            })
            console.log('✅ Payment link marked as paid:', linkId)
            
            // If this payment link is also associated with a booking, update the booking
            if (bookingId) {
              const paidAmount = (session.amount_total ?? 0) / 100
              const booking = await bookings.getByBookingId(bookingId)
              if (booking && paidAmount > 0) {
                const newAmountPaid = Math.round(
                  ((booking.amount_paid ?? 0) + paidAmount) * 100
                ) / 100
                const commitment = getCommitmentAmount(booking)
                await bookings.setAmountPaid(
                  bookingId,
                  newAmountPaid,
                  newAmountPaid >= commitment ? 'completed' : 'pending',
                  String(session.payment_intent || '')
                )
              } else {
                await bookings.updatePaymentStatus(
                  bookingId,
                  'completed',
                  String(session.payment_intent || '')
                )
              }
              console.log('✅ Associated booking also updated:', bookingId)
            }
          } catch (linkError) {
            console.error('❌ Failed to update payment link status:', linkError)
          }
        }
        // Handle regular checkout session payments (not from payment links)
        else if (bookingId) {
          const booking = await bookings.getByBookingId(bookingId)
          const paidAmount =
            (session.amount_total ?? 0) / 100 ||
            (booking ? getCommitmentAmount(booking) : 0)

          if (booking) {
            const newAmountPaid = Math.round(
              ((booking.amount_paid ?? 0) + paidAmount) * 100
            ) / 100
            const commitment = getCommitmentAmount(booking)
            const paymentStatus =
              newAmountPaid >= commitment ? 'completed' : 'pending'

            await bookings.setAmountPaid(
              bookingId,
              newAmountPaid,
              paymentStatus,
              String(session.payment_intent || '')
            )
          } else {
            await bookings.updatePaymentStatus(
              bookingId,
              'completed',
              String(session.payment_intent || '')
            )
          }

          console.log('✅ Payment successful for booking:', bookingId)
          console.log('Payment Intent ID:', session.payment_intent)

          try {
            const updatedBooking = await bookings.getByBookingId(bookingId)
            if (updatedBooking && updatedBooking.customer_email) {
              await sendPaymentConfirmation(updatedBooking)
              console.log('✅ Payment confirmation email sent to:', updatedBooking.customer_email)
            }
          } catch (emailError) {
            console.error('❌ Failed to send payment confirmation email:', emailError)
          }

          if (booking?.request_id) {
            try {
              await turso.execute({
                sql: `UPDATE rental_requests SET status = 'confirmed', confirmed_at = COALESCE(confirmed_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                args: [booking.request_id],
              })
            } catch (reqError) {
              console.error('❌ Failed to update rental request:', reqError)
            }
          }
        }

        if (paymentIntentId) {
          try {
            await ensureStripePaymentDetailsTable()
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
              expand: ['latest_charge.balance_transaction'],
            })
            const latestCharge = paymentIntent.latest_charge as Stripe.Charge | null
            const balanceTransaction = latestCharge?.balance_transaction as Stripe.BalanceTransaction | null
            const amount = (paymentIntent.amount_received || paymentIntent.amount || 0) / 100
            const currency = (paymentIntent.currency || 'usd').toUpperCase()
            const stripeFee = balanceTransaction ? balanceTransaction.fee / 100 : null
            const stripeNet = balanceTransaction ? balanceTransaction.net / 100 : null
            const feeDetails = balanceTransaction?.fee_details
              ? JSON.stringify(balanceTransaction.fee_details)
              : null
            let description = paymentIntent.description || null
            let customerName = session.customer_details?.name || null
            let customerEmail = session.customer_details?.email || null
            let stripeLinkId: string | null = null

            if (isPaymentLink && paymentLinkData) {
              // Use data already fetched earlier
              description = paymentLinkData.description || description
              customerName = paymentLinkData.customerName || customerName
              customerEmail = paymentLinkData.customerEmail || customerEmail
              stripeLinkId = paymentLinkData.stripeLinkId
            } else if (bookingId) {
              description = description || `Booking ${bookingId}`
              const booking = await bookings.getByBookingId(bookingId)
              if (booking) {
                customerName = booking.customer_name || customerName
                customerEmail = booking.customer_email || customerEmail
              }
            }

            // Convert Stripe timestamp (Unix seconds) to ISO string
            const paymentDate = paymentIntent.created 
              ? new Date(paymentIntent.created * 1000).toISOString()
              : null

            await upsertStripePaymentDetail({
              paymentIntentId: paymentIntent.id,
              chargeId: latestCharge?.id ?? null,
              balanceTransactionId: balanceTransaction?.id ?? null,
              amount,
              currency,
              stripeFee,
              stripeNet,
              feeDetails,
              description,
              sourceType: isPaymentLink ? 'payment_link' : 'booking',
              bookingId: bookingId || null,
              paymentLinkId: isPaymentLink ? linkId : null,
              stripeLinkId,
              customerName,
              customerEmail,
              status: paymentIntent.status,
              paymentDate,
            })
          } catch (detailError) {
            console.error('❌ Failed to store Stripe payment details:', detailError)
          }
        }
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('✅ PaymentIntent succeeded:', paymentIntent.id)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('❌ Payment failed:', paymentIntent.id)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
