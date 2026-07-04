import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { isAdminRequestAuthorized } from '@/lib/auth'
import { ensureStripePaymentDetailsTable, upsertStripePaymentDetail } from '@/lib/stripePayments'

// Lazy initialization
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-10-29.clover',
  })
}

/**
 * POST /api/admin/stripe-payments/backfill
 * 
 * Backfills historical Stripe payments into the stripe_payment_details table.
 * 
 * Query params:
 * - limit: Max number of payments to fetch (default: 100, max: 100)
 * - startingAfter: Pagination cursor (payment intent ID to start after)
 * - createdAfter: Unix timestamp - only fetch payments created after this date
 * - createdBefore: Unix timestamp - only fetch payments created before this date
 */
export async function POST(request: NextRequest) {
  const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
  if (!authorized) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const stripe = getStripe()
    await ensureStripePaymentDetailsTable()

    const { searchParams } = new URL(request.url)
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 100))
    const startingAfter = searchParams.get('startingAfter') || undefined
    const createdAfter = searchParams.get('createdAfter') ? Number(searchParams.get('createdAfter')) : undefined
    const createdBefore = searchParams.get('createdBefore') ? Number(searchParams.get('createdBefore')) : undefined

    // Build the created filter
    const created: Stripe.PaymentIntentListParams['created'] = {}
    if (createdAfter) created.gte = createdAfter
    if (createdBefore) created.lte = createdBefore

    // Fetch payment intents from Stripe
    const paymentIntents = await stripe.paymentIntents.list({
      limit,
      starting_after: startingAfter,
      ...(Object.keys(created).length > 0 && { created }),
      expand: ['data.latest_charge.balance_transaction'],
    })

    let processed = 0
    let skipped = 0
    let errors = 0
    const results: Array<{ id: string; status: string; error?: string }> = []

    for (const paymentIntent of paymentIntents.data) {
      try {
        // Only process succeeded payments
        if (paymentIntent.status !== 'succeeded') {
          skipped++
          results.push({ id: paymentIntent.id, status: 'skipped', error: `Status: ${paymentIntent.status}` })
          continue
        }

        const latestCharge = paymentIntent.latest_charge as Stripe.Charge | null
        const balanceTransaction = latestCharge?.balance_transaction as Stripe.BalanceTransaction | null

        // Calculate amounts
        const amount = (paymentIntent.amount_received || paymentIntent.amount || 0) / 100
        const currency = (paymentIntent.currency || 'usd').toUpperCase()
        const stripeFee = balanceTransaction ? balanceTransaction.fee / 100 : null
        const stripeNet = balanceTransaction ? balanceTransaction.net / 100 : null
        const feeDetails = balanceTransaction?.fee_details
          ? JSON.stringify(balanceTransaction.fee_details)
          : null

        // Try to determine source type from metadata
        const metadata = paymentIntent.metadata || {}
        const isPaymentLink = metadata.source === 'admin_payment_link'
        const bookingId = metadata.bookingId || null
        const linkId = metadata.linkId || null

        // Get customer info from charge if available
        let customerName: string | null = null
        let customerEmail: string | null = null
        
        if (latestCharge?.billing_details) {
          customerName = latestCharge.billing_details.name || null
          customerEmail = latestCharge.billing_details.email || null
        }

        // Determine description
        let description = paymentIntent.description || null
        if (!description && bookingId) {
          description = `Booking ${bookingId}`
        } else if (!description && isPaymentLink) {
          description = 'Payment Link'
        } else if (!description) {
          description = 'Stripe Payment'
        }

        // Convert Stripe timestamp (Unix seconds) to ISO string
        const paymentDate = paymentIntent.created 
          ? new Date(paymentIntent.created * 1000).toISOString()
          : null

        // Upsert into database
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
          sourceType: isPaymentLink ? 'payment_link' : bookingId ? 'booking' : 'unknown',
          bookingId,
          paymentLinkId: linkId,
          stripeLinkId: metadata.stripeLinkId || null,
          customerName,
          customerEmail,
          status: paymentIntent.status,
          paymentDate,
        })

        processed++
        results.push({ id: paymentIntent.id, status: 'processed' })
      } catch (err) {
        errors++
        results.push({ 
          id: paymentIntent.id, 
          status: 'error', 
          error: err instanceof Error ? err.message : 'Unknown error' 
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        processed,
        skipped,
        errors,
        total: paymentIntents.data.length,
        hasMore: paymentIntents.has_more,
        // Provide the last ID for pagination
        lastId: paymentIntents.data.length > 0 
          ? paymentIntents.data[paymentIntents.data.length - 1].id 
          : null,
        results,
      },
    })
  } catch (error) {
    console.error('Failed to backfill Stripe payments:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to backfill Stripe payments' 
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/stripe-payments/backfill
 * 
 * Returns info about backfill status and Stripe account payment count
 */
export async function GET(request: NextRequest) {
  const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
  if (!authorized) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const stripe = getStripe()

    // Get a count of payments in Stripe (approximate via list with limit 1)
    const recentPayments = await stripe.paymentIntents.list({
      limit: 1,
    })

    // Get count of payments we have stored
    const { ensureStripePaymentDetailsTable } = await import('@/lib/stripePayments')
    await ensureStripePaymentDetailsTable()
    
    const turso = (await import('@/lib/turso')).default
    const countResult = await turso.execute('SELECT COUNT(*) as count FROM stripe_payment_details')
    const storedCount = Number(countResult.rows[0]?.count || 0)

    return NextResponse.json({
      success: true,
      data: {
        storedPayments: storedCount,
        stripeHasPayments: recentPayments.data.length > 0,
        // Note: Stripe doesn't provide a direct count API, so we can't show exact total
        message: storedCount === 0 
          ? 'No payments stored yet. Run POST to backfill historical payments.'
          : `${storedCount} payments currently stored.`,
      },
    })
  } catch (error) {
    console.error('Failed to get backfill status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get backfill status' },
      { status: 500 }
    )
  }
}
