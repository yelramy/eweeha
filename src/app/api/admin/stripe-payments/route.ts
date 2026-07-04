import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequestAuthorized } from '@/lib/auth'
import turso from '@/lib/turso'
import { ensureStripePaymentDetailsTable } from '@/lib/stripePayments'

function toNumber(value: string | null, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

// Validate ISO date format (YYYY-MM-DD)
function isValidDate(dateStr: string | null): boolean {
  if (!dateStr) return false
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateStr)) return false
  const date = new Date(dateStr)
  return !isNaN(date.getTime())
}

export async function GET(request: NextRequest) {
  const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
  if (!authorized) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await ensureStripePaymentDetailsTable()
    const { searchParams } = new URL(request.url)
    
    // Pagination
    const limit = Math.min(200, Math.max(1, toNumber(searchParams.get('limit'), 50)))
    const offset = Math.max(0, toNumber(searchParams.get('offset'), 0))
    
    // Filters
    const descriptionFilter = searchParams.get('description')?.trim()
    const sourceTypeFilter = searchParams.get('sourceType')?.trim() // 'booking' or 'payment_link'
    const startDate = searchParams.get('startDate')?.trim() // YYYY-MM-DD
    const endDate = searchParams.get('endDate')?.trim() // YYYY-MM-DD
    const simple = searchParams.get('simple') === '1' // Skip summary query for faster loading

    // Build WHERE clause dynamically
    const conditions: string[] = []
    const baseArgs: Array<string | number> = []

    if (descriptionFilter) {
      conditions.push('description = ?')
      baseArgs.push(descriptionFilter)
    }

    if (sourceTypeFilter && ['booking', 'payment_link'].includes(sourceTypeFilter)) {
      conditions.push('source_type = ?')
      baseArgs.push(sourceTypeFilter)
    }

    if (startDate && isValidDate(startDate)) {
      conditions.push('date(created_at) >= ?')
      baseArgs.push(startDate)
    }

    if (endDate && isValidDate(endDate)) {
      conditions.push('date(created_at) <= ?')
      baseArgs.push(endDate)
    }

    const baseWhere = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Get paginated payments (always needed)
    const paymentsResult = await turso.execute({
      sql: `
        SELECT
          payment_intent_id,
          charge_id,
          balance_transaction_id,
          amount,
          currency,
          stripe_fee,
          stripe_net,
          fee_details,
          description,
          source_type,
          booking_id,
          payment_link_id,
          stripe_link_id,
          customer_name,
          customer_email,
          status,
          payment_date,
          created_at,
          updated_at
        FROM stripe_payment_details
        ${baseWhere}
        ORDER BY datetime(COALESCE(payment_date, created_at)) DESC
        LIMIT ? OFFSET ?
      `,
      args: [...baseArgs, limit, offset],
    })

    // Get overall totals (always needed)
    const totalsResult = await turso.execute({
      sql: `
        SELECT
          COUNT(*) as total_count,
          SUM(amount) as total_gross,
          SUM(stripe_fee) as total_fees,
          SUM(stripe_net) as total_net
        FROM stripe_payment_details
        ${baseWhere}
      `,
      args: baseArgs,
    })
    const totals = totalsResult.rows[0]
    const total = Number(totals?.total_count || 0)

    // For simple mode, skip the summary query
    let summaryByDescription: Array<{
      description: unknown
      paymentCount: number
      grossAmount: number
      stripeFees: number
      netAmount: number
    }> = []
    
    if (!simple) {
      const summaryResult = await turso.execute({
        sql: `
          SELECT
            COALESCE(description, 'Unspecified') as description,
            COUNT(*) as payment_count,
            SUM(amount) as gross_amount,
            SUM(stripe_fee) as stripe_fees,
            SUM(stripe_net) as net_amount
          FROM stripe_payment_details
          ${baseWhere}
          GROUP BY COALESCE(description, 'Unspecified')
          ORDER BY gross_amount DESC
        `,
        args: baseArgs,
      })
      summaryByDescription = summaryResult.rows.map(row => ({
        description: row.description,
        paymentCount: Number(row.payment_count || 0),
        grossAmount: Number(row.gross_amount || 0),
        stripeFees: Number(row.stripe_fees || 0),
        netAmount: Number(row.net_amount || 0),
      }))
    }

    return NextResponse.json({
      success: true,
      data: {
        // Pagination info
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
        // Overall totals for the filtered data
        totals: {
          count: total,
          grossAmount: Number(totals?.total_gross || 0),
          stripeFees: Number(totals?.total_fees || 0),
          netAmount: Number(totals?.total_net || 0),
        },
        // Summary grouped by description (empty if simple mode)
        summaryByDescription,
        // Individual payment records
        payments: paymentsResult.rows.map(row => ({
          paymentIntentId: row.payment_intent_id,
          chargeId: row.charge_id,
          balanceTransactionId: row.balance_transaction_id,
          amount: row.amount,
          currency: row.currency,
          stripeFee: row.stripe_fee,
          stripeNet: row.stripe_net,
          feeDetails: row.fee_details ? JSON.parse(String(row.fee_details)) : null,
          description: row.description,
          sourceType: row.source_type,
          bookingId: row.booking_id,
          paymentLinkId: row.payment_link_id,
          stripeLinkId: row.stripe_link_id,
          customerName: row.customer_name,
          customerEmail: row.customer_email,
          status: row.status,
          paymentDate: row.payment_date,
          createdAt: row.payment_date || row.created_at, // Use payment_date if available, fallback to created_at
          updatedAt: row.updated_at,
        })),
      },
    })
  } catch (error) {
    console.error('Failed to fetch Stripe payments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Stripe payments' },
      { status: 500 }
    )
  }
}

// DELETE - Remove payment records from local database (not from Stripe)
export async function DELETE(request: NextRequest) {
  const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
  if (!authorized) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { paymentIntentIds } = body

    if (!paymentIntentIds || !Array.isArray(paymentIntentIds) || paymentIntentIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'paymentIntentIds array is required' },
        { status: 400 }
      )
    }

    // Limit to 100 deletions at once for safety
    if (paymentIntentIds.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Maximum 100 deletions at once' },
        { status: 400 }
      )
    }

    // Build placeholders for IN clause
    const placeholders = paymentIntentIds.map(() => '?').join(', ')
    
    const result = await turso.execute({
      sql: `DELETE FROM stripe_payment_details WHERE payment_intent_id IN (${placeholders})`,
      args: paymentIntentIds,
    })

    return NextResponse.json({
      success: true,
      deleted: result.rowsAffected,
    })
  } catch (error) {
    console.error('Failed to delete Stripe payments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete payments' },
      { status: 500 }
    )
  }
}
