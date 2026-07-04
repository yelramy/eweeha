import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getValidInvitation } from '@/lib/reviewInvitations'
import turso from '@/lib/turso'
import { rateLimiters, checkRateLimit } from '@/lib/ratelimit'

const TokenSchema = z.string().min(8).max(128)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const limit = await checkRateLimit(request, rateLimiters.reads)
    if (!limit.success) {
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 })
    }

    const { token } = await params
    const parsed = TokenSchema.safeParse(token)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 400 })
    }

    const invitation = await getValidInvitation(parsed.data)
    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'This review link is invalid, expired, or already used.' },
        { status: 404 }
      )
    }

    let vehicleName: string | null = null
    if (invitation.vehicleId) {
      const v = await turso.execute({
        sql: 'SELECT name FROM vehicles WHERE id = ? LIMIT 1',
        args: [invitation.vehicleId],
      })
      if (v.rows.length > 0) vehicleName = (v.rows[0].name as string) || null
    }

    return NextResponse.json({
      success: true,
      data: {
        customerName: invitation.customerName,
        vehicleId: invitation.vehicleId,
        vehicleName,
        bookingId: invitation.bookingId,
      },
    })
  } catch (error) {
    console.error('Error verifying review token:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
