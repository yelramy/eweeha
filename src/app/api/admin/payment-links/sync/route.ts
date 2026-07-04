import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { isAdminRequestAuthorized } from '@/lib/auth'
import turso from '@/lib/turso'
import { ensureStripePaymentDetailsTable, upsertStripePaymentDetail } from '@/lib/stripePayments'

let stripeInstance: Stripe | null = null
function getStripe() {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover',
    })
  }
  return stripeInstance
}

/**
 * POST /api/admin/payment-links/sync
 * 
 * Syncs payment link statuses from Stripe. For each pending payment link in the DB,
 * checks Stripe for completed checkout sessions and updates the local records.
 * This backfills old payments that were missed due to the webhook metadata bug.
 */
export async function POST(request: NextRequest) {
  const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
  if (!authorized) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const stripe = getStripe()

  try {
    // Get all payment links that aren't marked as paid
    const pendingLinks = await turso.execute({
      sql: `SELECT id, stripe_link_id, description, customer_name, customer_email, amount FROM payment_links WHERE status != 'paid'`,
      args: [],
    })

    if (pendingLinks.rows.length === 0) {
      return NextResponse.json({
        success: true,
        data: { synced: 0, checked: 0, message: 'No pending payment links to sync' },
      })
    }

    let synced = 0
    const errors: string[] = []

    await ensureStripePaymentDetailsTable()

    for (const row of pendingLinks.rows) {
      const linkId = row.id as string
      const stripeLinkId = row.stripe_link_id as string
      const description = row.description as string | null
      const customerName = row.customer_name as string | null
      const customerEmail = row.customer_email as string | null

      if (!stripeLinkId) continue

      try {
        // List checkout sessions created from this payment link
        const sessions = await stripe.checkout.sessions.list({
          payment_link: stripeLinkId,
          limit: 5,
        })

        // Find a completed session
        const completedSession = sessions.data.find(
          s => s.payment_status === 'paid' || s.status === 'complete'
        )

        if (!completedSession) continue

        const paymentIntentId = typeof completedSession.payment_intent === 'string'
          ? completedSession.payment_intent
          : completedSession.payment_intent?.id

        // Update payment_links table
        await turso.execute({
          sql: `UPDATE payment_links SET status = 'paid', payment_intent_id = ?, paid_at = COALESCE(paid_at, CURRENT_TIMESTAMP) WHERE id = ?`,
          args: [paymentIntentId || '', linkId],
        })

        // Backfill stripe_payment_details if we have a payment intent
        if (paymentIntentId) {
          try {
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

            const sessionCustomerName = completedSession.customer_details?.name || null
            const sessionCustomerEmail = completedSession.customer_details?.email || null

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
              description: description || paymentIntent.description || null,
              sourceType: 'payment_link',
              bookingId: null,
              paymentLinkId: linkId,
              stripeLinkId,
              customerName: customerName || sessionCustomerName,
              customerEmail: customerEmail || sessionCustomerEmail,
              status: paymentIntent.status,
              paymentDate,
            })
          } catch (detailError) {
            console.error(`Failed to backfill payment details for ${linkId}:`, detailError)
            // Don't fail the whole sync for one detail error
          }
        }

        synced++
        console.log(`✅ Synced payment link ${linkId} (${stripeLinkId}) → paid`)
      } catch (linkError) {
        const message = linkError instanceof Error ? linkError.message : String(linkError)
        console.error(`Failed to sync payment link ${linkId}:`, message)
        errors.push(`${linkId}: ${message}`)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        checked: pendingLinks.rows.length,
        synced,
        errors: errors.length > 0 ? errors : undefined,
        message: synced > 0
          ? `Synced ${synced} of ${pendingLinks.rows.length} pending links`
          : `Checked ${pendingLinks.rows.length} pending links, none were paid on Stripe`,
      },
    })
  } catch (error) {
    console.error('Sync failed:', error)
    return NextResponse.json(
      { success: false, error: 'Sync failed' },
      { status: 500 }
    )
  }
}
