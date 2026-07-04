/**
 * Quick booking request form handler
 * Processes form data and sends email notification
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendQuickQuoteRequest } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const vehicle = formData.get('vehicle') as string
    const startDate = formData.get('startDate') as string
    const endDate = formData.get('endDate') as string
    const pickupCity = formData.get('pickup_city') as string
    const contact = formData.get('contact') as string
    const notes = formData.get('notes') as string | null
    
    // Validation
    if (!vehicle || !startDate || !endDate || !pickupCity || !contact) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      )
    }
    
    // Validate dates
    const start = new Date(startDate)
    const end = new Date(endDate)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    
    if (start < now) {
      return NextResponse.json(
        { error: 'Start date cannot be in the past' },
        { status: 400 }
      )
    }
    
    if (end <= start) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }
    
    // Send email notification
    await sendQuickQuoteRequest({
      vehicle,
      startDate,
      endDate,
      pickupCity,
      contact,
      notes: notes || undefined,
    })
    
    // Redirect with success parameter
    const redirectUrl = new URL('/booking', request.url)
    redirectUrl.searchParams.set('submitted', '1')
    
    return NextResponse.redirect(redirectUrl, 303)
  } catch (error) {
    console.error('Failed to process booking request:', error)
    
    // Redirect with error parameter
    const redirectUrl = new URL('/booking', request.url)
    redirectUrl.searchParams.set('error', '1')
    
    return NextResponse.redirect(redirectUrl, 303)
  }
}
