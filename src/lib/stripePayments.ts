import turso from '@/lib/turso'

export interface StripePaymentDetailInput {
  paymentIntentId: string
  chargeId?: string | null
  balanceTransactionId?: string | null
  amount: number
  currency: string
  stripeFee?: number | null
  stripeNet?: number | null
  feeDetails?: string | null
  description?: string | null
  sourceType?: string | null
  bookingId?: string | null
  paymentLinkId?: string | null
  stripeLinkId?: string | null
  customerName?: string | null
  customerEmail?: string | null
  status?: string | null
  paymentDate?: string | null // Actual Stripe payment timestamp
}

// Cache table initialization - only run once per server instance
let tableInitialized = false

export async function ensureStripePaymentDetailsTable() {
  if (tableInitialized) return
  
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS stripe_payment_details (
      payment_intent_id TEXT PRIMARY KEY,
      charge_id TEXT,
      balance_transaction_id TEXT,
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      stripe_fee REAL,
      stripe_net REAL,
      fee_details TEXT,
      description TEXT,
      source_type TEXT,
      booking_id TEXT,
      payment_link_id TEXT,
      stripe_link_id TEXT,
      customer_name TEXT,
      customer_email TEXT,
      status TEXT,
      payment_date TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  // Add payment_date column if it doesn't exist (for existing tables)
  try {
    await turso.execute(`ALTER TABLE stripe_payment_details ADD COLUMN payment_date TEXT`)
  } catch {
    // Column already exists
  }
  
  await turso.execute(
    `CREATE INDEX IF NOT EXISTS idx_stripe_payment_details_description ON stripe_payment_details(description)`
  )
  await turso.execute(
    `CREATE INDEX IF NOT EXISTS idx_stripe_payment_details_created_at ON stripe_payment_details(created_at)`
  )
  await turso.execute(
    `CREATE INDEX IF NOT EXISTS idx_stripe_payment_details_payment_date ON stripe_payment_details(payment_date)`
  )
  
  tableInitialized = true
}

export async function upsertStripePaymentDetail(detail: StripePaymentDetailInput) {
  await turso.execute({
    sql: `
      INSERT INTO stripe_payment_details (
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(payment_intent_id) DO UPDATE SET
        charge_id = excluded.charge_id,
        balance_transaction_id = excluded.balance_transaction_id,
        amount = excluded.amount,
        currency = excluded.currency,
        stripe_fee = excluded.stripe_fee,
        stripe_net = excluded.stripe_net,
        fee_details = excluded.fee_details,
        description = excluded.description,
        source_type = excluded.source_type,
        booking_id = excluded.booking_id,
        payment_link_id = excluded.payment_link_id,
        stripe_link_id = excluded.stripe_link_id,
        customer_name = excluded.customer_name,
        customer_email = excluded.customer_email,
        status = excluded.status,
        payment_date = COALESCE(excluded.payment_date, stripe_payment_details.payment_date, stripe_payment_details.created_at),
        updated_at = CURRENT_TIMESTAMP
    `,
    args: [
      detail.paymentIntentId,
      detail.chargeId ?? null,
      detail.balanceTransactionId ?? null,
      detail.amount,
      detail.currency,
      detail.stripeFee ?? null,
      detail.stripeNet ?? null,
      detail.feeDetails ?? null,
      detail.description ?? null,
      detail.sourceType ?? null,
      detail.bookingId ?? null,
      detail.paymentLinkId ?? null,
      detail.stripeLinkId ?? null,
      detail.customerName ?? null,
      detail.customerEmail ?? null,
      detail.status ?? null,
      detail.paymentDate ?? null,
    ],
  })
}
