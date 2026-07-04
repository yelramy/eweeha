/**
 * Review Invitations - one-time tokens an admin generates to invite a
 * customer to leave a review. Token may be linked to a booking (online
 * customers) or be standalone (WhatsApp customers without an online booking).
 *
 * Mirrors the booking_tokens pattern in `src/lib/bookings.ts`.
 */

import { randomBytes } from 'crypto'
import turso, { ensureInitialized } from './turso'

export interface ReviewInvitation {
  token: string
  customerName: string
  customerEmail: string | null
  customerPhone: string | null
  bookingId: string | null
  vehicleId: string | null
  usedAt: string | null
  expiresAt: string
  createdAt: string
}

const DEFAULT_TTL_DAYS = 90

export interface CreateInvitationInput {
  customerName: string
  customerEmail?: string | null
  customerPhone?: string | null
  bookingId?: string | null
  vehicleId?: string | null
  ttlDays?: number
}

export async function createReviewInvitation(
  input: CreateInvitationInput
): Promise<ReviewInvitation> {
  await ensureInitialized()
  const token = randomBytes(24).toString('base64url')
  const ttlDays = input.ttlDays && input.ttlDays > 0 ? input.ttlDays : DEFAULT_TTL_DAYS
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000).toISOString()
  const createdAt = new Date().toISOString()

  await turso.execute({
    sql: `
      INSERT INTO review_invitations
        (token, customer_name, customer_email, customer_phone, booking_id, vehicle_id, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      token,
      input.customerName,
      input.customerEmail || null,
      input.customerPhone || null,
      input.bookingId || null,
      input.vehicleId || null,
      expiresAt,
      createdAt,
    ],
  })

  return {
    token,
    customerName: input.customerName,
    customerEmail: input.customerEmail || null,
    customerPhone: input.customerPhone || null,
    bookingId: input.bookingId || null,
    vehicleId: input.vehicleId || null,
    usedAt: null,
    expiresAt,
    createdAt,
  }
}

function rowToInvitation(row: Record<string, unknown>): ReviewInvitation {
  return {
    token: row.token as string,
    customerName: row.customer_name as string,
    customerEmail: (row.customer_email as string | null) ?? null,
    customerPhone: (row.customer_phone as string | null) ?? null,
    bookingId: (row.booking_id as string | null) ?? null,
    vehicleId: (row.vehicle_id as string | null) ?? null,
    usedAt: (row.used_at as string | null) ?? null,
    expiresAt: row.expires_at as string,
    createdAt: row.created_at as string,
  }
}

/**
 * Returns the invitation if the token is valid (exists, not expired, not used).
 * Returns null otherwise.
 */
export async function getValidInvitation(token: string): Promise<ReviewInvitation | null> {
  if (!token) return null
  await ensureInitialized()

  const result = await turso.execute({
    sql: 'SELECT * FROM review_invitations WHERE token = ?',
    args: [token],
  })

  if (result.rows.length === 0) return null

  const inv = rowToInvitation(result.rows[0] as unknown as Record<string, unknown>)

  if (inv.usedAt) return null
  if (new Date(inv.expiresAt).getTime() < Date.now()) return null

  return inv
}

/**
 * Mark an invitation as used (one-time consumption). Idempotent: returns false
 * if the token was already used or doesn't exist, true on first successful mark.
 */
export async function markInvitationUsed(token: string): Promise<boolean> {
  await ensureInitialized()
  const result = await turso.execute({
    sql: `
      UPDATE review_invitations
      SET used_at = CURRENT_TIMESTAMP
      WHERE token = ? AND used_at IS NULL
    `,
    args: [token],
  })
  return result.rowsAffected > 0
}

export async function getAllInvitations(limit = 50, offset = 0): Promise<ReviewInvitation[]> {
  await ensureInitialized()
  const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)))
  const safeOffset = Math.max(0, Math.floor(offset))

  const result = await turso.execute({
    sql: `SELECT * FROM review_invitations ORDER BY datetime(created_at) DESC LIMIT ? OFFSET ?`,
    args: [safeLimit, safeOffset],
  })

  return result.rows.map(row => rowToInvitation(row as unknown as Record<string, unknown>))
}
