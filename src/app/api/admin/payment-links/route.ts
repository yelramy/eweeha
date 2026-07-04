import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { isAdminRequestAuthorized } from '@/lib/auth'
import turso from '@/lib/turso'
import { randomUUID } from 'crypto'

// Lazy initialization - only create Stripe instance when needed
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

// Cache table initialization - only run once per server instance
let tableInitialized = false

async function ensureTable() {
  if (tableInitialized) return
  
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS payment_links (
      id TEXT PRIMARY KEY,
      stripe_link_id TEXT UNIQUE NOT NULL,
      stripe_url TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      customer_name TEXT,
      customer_email TEXT,
      booking_id TEXT,
      request_id INTEGER,
      notes TEXT,
      status TEXT DEFAULT 'pending',
      payment_intent_id TEXT,
      paid_at TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Check for missing columns only once
  const result = await turso.execute(`PRAGMA table_info(payment_links)`)
  const existingColumns = new Set(result.rows.map(row => String(row.name)))
  const columnsToAdd = [
    { name: 'stripe_link_id', sql: `ALTER TABLE payment_links ADD COLUMN stripe_link_id TEXT NOT NULL DEFAULT ''` },
    { name: 'stripe_url', sql: `ALTER TABLE payment_links ADD COLUMN stripe_url TEXT NOT NULL DEFAULT ''` },
    { name: 'amount', sql: `ALTER TABLE payment_links ADD COLUMN amount REAL NOT NULL DEFAULT 0` },
    { name: 'description', sql: `ALTER TABLE payment_links ADD COLUMN description TEXT NOT NULL DEFAULT ''` },
    { name: 'customer_name', sql: `ALTER TABLE payment_links ADD COLUMN customer_name TEXT` },
    { name: 'customer_email', sql: `ALTER TABLE payment_links ADD COLUMN customer_email TEXT` },
    { name: 'booking_id', sql: `ALTER TABLE payment_links ADD COLUMN booking_id TEXT` },
    { name: 'request_id', sql: `ALTER TABLE payment_links ADD COLUMN request_id INTEGER` },
    { name: 'notes', sql: `ALTER TABLE payment_links ADD COLUMN notes TEXT` },
    { name: 'status', sql: `ALTER TABLE payment_links ADD COLUMN status TEXT DEFAULT 'pending'` },
    { name: 'payment_intent_id', sql: `ALTER TABLE payment_links ADD COLUMN payment_intent_id TEXT` },
    { name: 'paid_at', sql: `ALTER TABLE payment_links ADD COLUMN paid_at TEXT` },
    { name: 'active', sql: `ALTER TABLE payment_links ADD COLUMN active INTEGER DEFAULT 1` },
    { name: 'created_at', sql: `ALTER TABLE payment_links ADD COLUMN created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP` },
  ]

  for (const column of columnsToAdd) {
    if (!existingColumns.has(column.name)) {
      try {
        await turso.execute(column.sql)
      } catch {
        // Column might already exist, ignore error
      }
    }
  }
  
  tableInitialized = true
}

// GET - List payment links from database
export async function GET(request: NextRequest) {
  const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
  if (!authorized) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await ensureTable()
    
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    
    const result = await turso.execute({
      sql: `SELECT * FROM payment_links ORDER BY created_at DESC LIMIT ?`,
      args: [limit]
    })

    return NextResponse.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        stripeLinkId: row.stripe_link_id,
        url: row.stripe_url,
        amount: row.amount,
        description: row.description,
        active: row.active === 1,
        status: row.status,
        createdAt: row.created_at,
        paidAt: row.paid_at,
        metadata: {
          customerName: row.customer_name,
          customerEmail: row.customer_email,
          bookingId: row.booking_id,
          requestId: row.request_id,
          notes: row.notes,
        },
      })),
    })
  } catch (error) {
    console.error('Failed to list payment links:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to list payment links' },
      { status: 500 }
    )
  }
}

// POST - Create a new payment link
export async function POST(request: NextRequest) {
  const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
  if (!authorized) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await ensureTable()
    const stripe = getStripe()
    const body = await request.json()
    
    const {
      amount, // in USD
      description,
      customerName,
      customerEmail,
      bookingId,
      requestId,
      notes,
    } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount is required and must be positive' },
        { status: 400 }
      )
    }

    if (!description) {
      return NextResponse.json(
        { success: false, error: 'Description is required' },
        { status: 400 }
      )
    }

    // Get base URL for after payment redirect
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL 
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || 'http://localhost:3000'

    // Generate our own ID for tracking
    const linkId = randomUUID()

    // Create a price for this payment link
    const price = await stripe.prices.create({
      currency: 'usd',
      unit_amount: Math.round(amount * 100), // Convert to cents
      product_data: {
        name: description,
      },
    })

    // Build metadata for Stripe (to track back to our record)
    const stripeMetadata: Record<string, string> = {
      linkId, // Our internal ID
      source: 'admin_payment_link',
    }
    if (customerName) stripeMetadata.customerName = customerName
    if (customerEmail) stripeMetadata.customerEmail = customerEmail
    if (bookingId) stripeMetadata.bookingId = bookingId
    if (requestId) stripeMetadata.requestId = String(requestId)

    // Create the payment link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      metadata: stripeMetadata,
      after_completion: {
        type: 'redirect',
        redirect: {
          url: bookingId 
            ? `${baseUrl}/payment/success?booking=${bookingId}&payment_link=${linkId}`
            : `${baseUrl}/payment/success?payment_link=${linkId}`,
        },
      },
      phone_number_collection: {
        enabled: true,
      },
    })

    // Store in database
    await turso.execute({
      sql: `INSERT INTO payment_links (
        id, stripe_link_id, stripe_url, amount, description,
        customer_name, customer_email, booking_id, request_id, notes,
        status, active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 1, CURRENT_TIMESTAMP)`,
      args: [
        linkId,
        paymentLink.id,
        paymentLink.url,
        amount,
        description,
        customerName || null,
        customerEmail || null,
        bookingId || null,
        requestId || null,
        notes || null,
      ]
    })

    return NextResponse.json({
      success: true,
      data: {
        id: linkId,
        stripeLinkId: paymentLink.id,
        url: paymentLink.url,
        active: paymentLink.active,
        amount,
        description,
      },
    })
  } catch (error) {
    console.error('Failed to create payment link:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create payment link' },
      { status: 500 }
    )
  }
}

// PATCH - Deactivate/reactivate a payment link
export async function PATCH(request: NextRequest) {
  const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
  if (!authorized) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await ensureTable()
    const stripe = getStripe()
    const body = await request.json()
    
    const { id, active } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Payment link ID is required' },
        { status: 400 }
      )
    }

    // Get the Stripe link ID from our database
    const result = await turso.execute({
      sql: `SELECT stripe_link_id FROM payment_links WHERE id = ?`,
      args: [id]
    })

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Payment link not found' },
        { status: 404 }
      )
    }

    const stripeLinkId = result.rows[0].stripe_link_id as string

    // Update on Stripe
    await stripe.paymentLinks.update(stripeLinkId, {
      active: active ?? false,
    })

    // Update in database
    await turso.execute({
      sql: `UPDATE payment_links SET active = ? WHERE id = ?`,
      args: [active ? 1 : 0, id]
    })

    return NextResponse.json({
      success: true,
      data: {
        id,
        active: active ?? false,
      },
    })
  } catch (error) {
    console.error('Failed to update payment link:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update payment link' },
      { status: 500 }
    )
  }
}
