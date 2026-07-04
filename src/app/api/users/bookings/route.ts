import { NextResponse } from 'next/server'
import turso from '@/lib/turso'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

// NOTE: bookings are scoped by the opaque `user_id` column (set at booking
// creation from the authenticated session), NOT by the free-text
// `customer_name` field from the booking form. Matching on customer_name is
// unsafe — it is attacker-controlled input and has no uniqueness guarantees.
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = (session.user as { id?: string }).id
    if (!userId) {
      // No stable user id = no bookings. Do not fall back to name matching.
      return NextResponse.json({ success: true, data: [] })
    }

    const result = await turso.execute({
      sql: 'SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC',
      args: [userId],
    })

    return NextResponse.json({ success: true, data: result.rows })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
