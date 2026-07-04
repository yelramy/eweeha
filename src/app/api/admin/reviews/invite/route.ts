import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isAdminRequestAuthorized } from '@/lib/auth'
import { createReviewInvitation } from '@/lib/reviewInvitations'
import { sendReviewRequest } from '@/lib/email'
import bookings from '@/lib/bookings'
import turso from '@/lib/turso'

const InviteSchema = z.object({
  customerName: z.string().trim().min(1).max(120),
  customerEmail: z.string().trim().email().max(200).optional().or(z.literal('')),
  customerPhone: z.string().trim().min(4).max(40).optional().or(z.literal('')),
  bookingId: z.string().trim().max(80).optional().or(z.literal('')),
  vehicleId: z.string().trim().max(80).optional().or(z.literal('')),
  sendEmail: z.boolean().optional(),
  ttlDays: z.number().int().positive().max(730).optional(),
})

function resolveBaseUrl(request: NextRequest): string {
  const envBase = process.env.NEXT_PUBLIC_BASE_URL
  if (envBase) return envBase.replace(/\/$/, '')
  const vercel = process.env.VERCEL_URL
  if (vercel) return `https://${vercel}`
  const proto = request.headers.get('x-forwarded-proto') || 'https'
  const host = request.headers.get('host')
  return host ? `${proto}://${host}` : 'http://localhost:3000'
}

function digitsOnly(value: string): string {
  return value.replace(/[^0-9]/g, '')
}

export async function POST(request: NextRequest) {
  try {
    const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = InviteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input',
          details: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
        },
        { status: 400 }
      )
    }

    const input = parsed.data
    const customerEmail = input.customerEmail || null
    const customerPhone = input.customerPhone || null
    let bookingIdForInvite: string | null = null
    let vehicleIdForInvite: string | null = input.vehicleId || null
    let prefilledName = input.customerName

    // If a booking_id is provided, look it up and pull defaults from it
    if (input.bookingId) {
      const booking = await bookings.getByBookingId(input.bookingId)
      if (!booking) {
        return NextResponse.json(
          { success: false, error: `Booking ${input.bookingId} not found` },
          { status: 404 }
        )
      }
      bookingIdForInvite = booking.booking_id
      prefilledName = prefilledName || booking.customer_name

      // Resolve vehicle_id from booking if caller didn't supply one
      if (!vehicleIdForInvite && booking.van_type) {
        try {
          const vehicleRow = await turso.execute({
            sql: 'SELECT id FROM vehicles WHERE id = ? OR slug = ? OR name = ? LIMIT 1',
            args: [booking.van_type, booking.van_type, booking.van_type],
          })
          if (vehicleRow.rows.length > 0) {
            vehicleIdForInvite = vehicleRow.rows[0].id as string
          }
        } catch {
          // best-effort vehicle resolution; don't block invitation
        }
      }
    }

    const invitation = await createReviewInvitation({
      customerName: prefilledName,
      customerEmail,
      customerPhone,
      bookingId: bookingIdForInvite,
      vehicleId: vehicleIdForInvite,
      ttlDays: input.ttlDays,
    })

    const baseUrl = resolveBaseUrl(request)
    const reviewLink = `${baseUrl}/review/${invitation.token}`

    let vehicleName: string | null = null
    if (vehicleIdForInvite) {
      try {
        const v = await turso.execute({
          sql: 'SELECT name FROM vehicles WHERE id = ? LIMIT 1',
          args: [vehicleIdForInvite],
        })
        if (v.rows.length > 0) vehicleName = (v.rows[0].name as string) || null
      } catch {
        // optional
      }
    }

    // WhatsApp deeplink (admin can click to open chat with prefilled message).
    const waMessage = `Hi ${prefilledName}, thank you for choosing Eweeha! We'd love your feedback. Please leave us a quick review here: ${reviewLink}`
    const waPhone = customerPhone ? digitsOnly(customerPhone) : ''
    const whatsappLink = waPhone
      ? `https://wa.me/${waPhone}?text=${encodeURIComponent(waMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(waMessage)}`

    // Optional email send
    let emailed = false
    let emailError: string | null = null
    if (input.sendEmail && customerEmail) {
      try {
        await sendReviewRequest(customerEmail, {
          customerName: prefilledName,
          reviewLink,
          vehicleName,
        })
        emailed = true
      } catch (error) {
        emailError = (error as Error).message || 'Failed to send email'
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        token: invitation.token,
        reviewLink,
        whatsappLink,
        whatsappMessage: waMessage,
        expiresAt: invitation.expiresAt,
        emailed,
        emailError,
      },
    })
  } catch (error) {
    console.error('Failed to create review invitation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create invitation' },
      { status: 500 }
    )
  }
}
