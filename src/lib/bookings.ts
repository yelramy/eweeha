// Bookings management with Turso database
import turso from './turso'
import { randomUUID, randomBytes } from 'crypto'

export interface Booking {
  id: string
  booking_id: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  van_type: string
  pickup_date: string
  return_date: string
  total_amount: number
  payment_method: string
  payment_status: 'pending' | 'completed' | 'failed' | 'confirmed' | 'cancelled'
  payment_reference?: string
  created_at: string
  updated_at: string
  // Opaque id of the authenticated `users` row that created this booking.
  // Null for guest bookings. Used by /api/users/bookings for authorization —
  // do NOT substitute customer_name (that's attacker-controlled form input).
  user_id?: string | null
  // Optional new rental fields
  rental_days?: number | null
  hours_per_day?: number | null
  passenger_count?: number | null
  luggage_count?: number | null
  selected_extras?: string | null
  selected_variant?: string | null
  pricing_breakdown?: string | null
  deposit_amount?: number | null
  amount_paid?: number | null
  request_id?: number | null
}

// Convert database row to Booking object
const VALID_PAYMENT_STATUSES: Booking['payment_status'][] = [
  'pending',
  'completed',
  'failed',
  'confirmed',
  'cancelled',
]

function rowToBooking(row: Record<string, unknown>): Booking {
  const rawStatus = row.payment_status as string
  const paymentStatus = VALID_PAYMENT_STATUSES.includes(
    rawStatus as Booking['payment_status']
  )
    ? (rawStatus as Booking['payment_status'])
    : (() => {
        throw new Error(`Unexpected payment status received: ${rawStatus}`)
      })()

  return {
    id: row.id as string,
    booking_id: row.booking_id as string,
    customer_name: row.customer_name as string,
    customer_phone: row.customer_phone as string,
    customer_email: row.customer_email as string | undefined,
    van_type: row.van_type as string,
    pickup_date: row.pickup_date as string,
    return_date: row.return_date as string,
    total_amount: row.total_amount as number,
    payment_method: row.payment_method as string,
    payment_status: paymentStatus,
    payment_reference: row.payment_reference as string | undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    user_id: (row.user_id as string | null) ?? null,
    deposit_amount: (row.deposit_amount as number | null) ?? null,
    amount_paid: (row.amount_paid as number | null) ?? null,
    request_id: (row.request_id as number | null) ?? null,
  }
}

// Generate a time-limited token for a customer to view their booking with minimal PII
export async function createBookingAccessToken(bookingId: string, ttlMinutes = 60): Promise<string> {
  const token = randomBytes(24).toString('base64url')
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString()
  await turso.execute({
    sql: `INSERT INTO booking_tokens (token, booking_id, expires_at) VALUES (?, ?, ?)`,
    args: [token, bookingId, expiresAt]
  })
  return token
}

export async function verifyBookingAccessToken(token: string): Promise<string | null> {
  const res = await turso.execute({
    sql: `SELECT booking_id, expires_at FROM booking_tokens WHERE token = ?`,
    args: [token]
  })
  if (res.rows.length === 0) return null
  const row = res.rows[0] as unknown as { booking_id: string; expires_at: string }
  if (new Date(row.expires_at).getTime() < Date.now()) return null
  return row.booking_id
}

const bookings = {
  // Get paginated bookings (newest first)
  async getAll({ limit = 50, offset = 0 }: { limit?: number; offset?: number } = {}): Promise<Booking[]> {
    try {
      const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)))
      const safeOffset = Math.max(0, Math.floor(offset))
      const result = await turso.execute({
        sql: `SELECT * FROM bookings ORDER BY datetime(created_at) DESC LIMIT ? OFFSET ?`,
        args: [safeLimit, safeOffset]
      })
      return result.rows.map(rowToBooking)
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
      return []
    }
  },

  async count(): Promise<number> {
    try {
      const res = await turso.execute('SELECT COUNT(*) as cnt FROM bookings')
      return Number(res.rows[0]?.cnt || 0)
    } catch (error) {
      console.error('Failed to count bookings:', error)
      return 0
    }
  },

  // Get booking by booking_id
  async getByBookingId(bookingId: string): Promise<Booking | null> {
    try {
      const result = await turso.execute({
        sql: 'SELECT * FROM bookings WHERE booking_id = ?',
        args: [bookingId]
      })
      return result.rows.length > 0 ? rowToBooking(result.rows[0]) : null
    } catch (error) {
      console.error('Failed to fetch booking:', error)
      return null
    }
  },

  // Create a new booking
  async create(booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>): Promise<Booking | null> {
    try {
      const id = randomUUID()
      const now = new Date().toISOString()
      
      await turso.execute({
        sql: `
          INSERT INTO bookings (
            id, booking_id, customer_name, customer_phone, customer_email,
            van_type, pickup_date, return_date, total_amount, payment_method,
            payment_status, payment_reference, rental_days, hours_per_day,
            passenger_count, luggage_count, selected_extras,
            selected_variant, pricing_breakdown, user_id,
            deposit_amount, amount_paid, request_id,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          id, booking.booking_id, booking.customer_name, booking.customer_phone,
          booking.customer_email || null, booking.van_type, booking.pickup_date,
          booking.return_date, booking.total_amount, booking.payment_method,
          booking.payment_status, booking.payment_reference || null,
          booking.rental_days ?? null,
          booking.hours_per_day ?? null,
          booking.passenger_count ?? null,
          booking.luggage_count ?? null,
          booking.selected_extras || null,
          booking.selected_variant || null,
          booking.pricing_breakdown || null,
          booking.user_id ?? null,
          booking.deposit_amount ?? null,
          booking.amount_paid ?? 0,
          booking.request_id ?? null,
          now, now
        ]
      })
      
      return {
        ...booking,
        id,
        created_at: now,
        updated_at: now
      }
    } catch (error) {
      console.error('Failed to create booking:', error)
      return null
    }
  },

  // Update booking payment status
  async updatePaymentStatus(
    bookingId: string, 
    status: 'pending' | 'completed' | 'failed' | 'confirmed' | 'cancelled', 
    reference?: string
  ): Promise<boolean> {
    try {
      const result = await turso.execute({
        sql: `
          UPDATE bookings 
          SET payment_status = ?, payment_reference = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE booking_id = ?
        `,
        args: [status, reference || null, bookingId]
      })
      return result.rowsAffected > 0
    } catch (error) {
      console.error('Failed to update payment status:', error)
      return false
    }
  },

  async recordPayment(
    bookingId: string,
    amount: number,
    status: 'pending' | 'completed' | 'failed' | 'confirmed' | 'cancelled',
    reference?: string
  ): Promise<boolean> {
    try {
      const result = await turso.execute({
        sql: `
          UPDATE bookings
          SET amount_paid = COALESCE(amount_paid, 0) + ?,
              payment_status = ?,
              payment_reference = COALESCE(?, payment_reference),
              updated_at = CURRENT_TIMESTAMP
          WHERE booking_id = ?
        `,
        args: [amount, status, reference || null, bookingId],
      })
      return result.rowsAffected > 0
    } catch (error) {
      console.error('Failed to record payment:', error)
      return false
    }
  },

  async setAmountPaid(
    bookingId: string,
    amountPaid: number,
    status: 'pending' | 'completed' | 'failed' | 'confirmed' | 'cancelled',
    reference?: string
  ): Promise<boolean> {
    try {
      const result = await turso.execute({
        sql: `
          UPDATE bookings
          SET amount_paid = ?,
              payment_status = ?,
              payment_reference = COALESCE(?, payment_reference),
              updated_at = CURRENT_TIMESTAMP
          WHERE booking_id = ?
        `,
        args: [amountPaid, status, reference || null, bookingId],
      })
      return result.rowsAffected > 0
    } catch (error) {
      console.error('Failed to set amount paid:', error)
      return false
    }
  },

  // Update booking
  async update(id: string, updates: Partial<Booking>): Promise<Booking | null> {
    try {
      const fields = []
      const values = []
      
      for (const [key, value] of Object.entries(updates)) {
        if (key !== 'id' && key !== 'created_at') {
          fields.push(`${key} = ?`)
          values.push(value)
        }
      }
      
      if (fields.length === 0) return null
      
      fields.push('updated_at = CURRENT_TIMESTAMP')
      values.push(id)
      
      const result = await turso.execute({
        sql: `UPDATE bookings SET ${fields.join(', ')} WHERE id = ?`,
        args: values
      })
      
      if (result.rowsAffected === 0) return null
      
      // Return updated booking
      const updated = await turso.execute({
        sql: 'SELECT * FROM bookings WHERE id = ?',
        args: [id]
      })
      
      return updated.rows.length > 0 ? rowToBooking(updated.rows[0]) : null
    } catch (error) {
      console.error('Failed to update booking:', error)
      return null
    }
  },

  // Delete booking
  async delete(id: string): Promise<boolean> {
    try {
      const result = await turso.execute({
        sql: 'DELETE FROM bookings WHERE id = ?',
        args: [id]
      })
      return result.rowsAffected > 0
    } catch (error) {
      console.error('Failed to delete booking:', error)
      return false
    }
  },

  // Get booking statistics
  async getStats(): Promise<{
    total: number
    pending: number
    completed: number
    failed: number
    totalRevenue: number
    averageValue: number
  }> {
    try {
      const [countResult, revenueResult] = await Promise.all([
        turso.execute(`
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending,
            COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as completed,
            COUNT(CASE WHEN payment_status = 'failed' THEN 1 END) as failed
          FROM bookings
        `),
        turso.execute(`
          SELECT 
            COALESCE(SUM(total_amount), 0) as total_revenue,
            COALESCE(AVG(total_amount), 0) as average_value
          FROM bookings 
          WHERE payment_status = 'completed'
        `)
      ])
      
      const countRow = countResult.rows[0]
      const revenueRow = revenueResult.rows[0]
      
      return {
        total: Number(countRow?.total || 0),
        pending: Number(countRow?.pending || 0),
        completed: Number(countRow?.completed || 0),
        failed: Number(countRow?.failed || 0),
        totalRevenue: Number(revenueRow?.total_revenue || 0),
        averageValue: Number(revenueRow?.average_value || 0)
      }
    } catch (error) {
      console.error('Failed to get booking stats:', error)
      return {
        total: 0,
        pending: 0,
        completed: 0,
        failed: 0,
        totalRevenue: 0,
        averageValue: 0
      }
    }
  }
}

export default bookings