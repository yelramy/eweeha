import { NextResponse } from 'next/server'

export async function GET() {
  // Restrict to admin-only (use admin API if needed). Avoid leaking business metrics.
  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
}
