import { randomBytes } from 'crypto'
import type { Booking } from './bookings'

export interface QuoteDetails {
  description?: string
  schedule?: string
  vehicleName?: string
  pickupDate?: string
  returnDate?: string
  startingLocation?: string
  passengers?: number
  notes?: string
}

export interface RentalRequestQuote {
  id: number
  service_type: string
  pickup_date: string
  pickup_time: string
  starting_location: string
  passengers: number
  phone: string
  notes: string | null
  status: string
  quoted_price: number | null
  quoted_at: string | null
  confirmed_at: string | null
  requested_at: string
  customer_name: string | null
  customer_email: string | null
  quote_token: string | null
  quote_expires_at: string | null
  total_price: number | null
  deposit_amount: number | null
  quote_details: string | null
  booking_id: string | null
}

export function generateQuoteToken(): string {
  return randomBytes(24).toString('base64url')
}

export function parseQuoteDetails(raw: string | null | undefined): QuoteDetails {
  if (!raw) return {}
  try {
    return JSON.parse(raw) as QuoteDetails
  } catch {
    return { description: raw }
  }
}

export function computeAmountDueNow(
  totalPrice: number,
  paymentType: 'full' | 'percent' | 'fixed',
  paymentValue: number
): number {
  if (paymentType === 'full') {
    return Math.round(totalPrice * 100) / 100
  }
  if (paymentType === 'percent') {
    const pct = Math.min(100, Math.max(1, paymentValue))
    return Math.round(totalPrice * (pct / 100) * 100) / 100
  }
  return Math.round(Math.min(totalPrice, Math.max(0.01, paymentValue)) * 100) / 100
}

/** Amount the customer must pay online to lock the booking (commitment). */
export function getCommitmentAmount(booking: Booking): number {
  const commitment =
    booking.deposit_amount != null && booking.deposit_amount > 0
      ? booking.deposit_amount
      : booking.total_amount
  return Math.round(commitment * 100) / 100
}

/** Remaining amount due now before commitment is satisfied. */
export function getAmountDueNow(booking: Booking): number {
  const commitment = getCommitmentAmount(booking)
  const paid = booking.amount_paid ?? 0
  return Math.max(0, Math.round((commitment - paid) * 100) / 100)
}

export function getBalanceDue(booking: Booking): number {
  const paid = booking.amount_paid ?? 0
  return Math.max(0, Math.round((booking.total_amount - paid) * 100) / 100)
}

export function isQuoteExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt).getTime() < Date.now()
}

export function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    'http://localhost:3000'
  )
}

export function buildQuoteUrl(token: string): string {
  return `${getBaseUrl()}/quote/${token}`
}
