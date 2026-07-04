'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function PaymentCancelledContent() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('booking')
  
  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-soft p-8 text-center">
        <div className="text-red-500 text-6xl mb-4">✖️</div>
        <h2 className="text-2xl font-bold text-charcoal-500 mb-2">Payment Cancelled</h2>
        <p className="text-warm-600 mb-6">
          Your payment was cancelled. You can try again or choose another method.
        </p>
        {bookingId && (
          <p className="text-sm text-warm-500 mb-6">Booking reference: <span className="font-mono">{bookingId}</span></p>
        )}
        <div className="space-y-3">
          <Link href={`/booking?booking=${bookingId ?? ''}`} className="block bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 transition-colors">
            Return to Booking
          </Link>
          <Link href="/" className="block text-charcoal-500 hover:text-charcoal-500">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function PaymentCancelledPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentCancelledContent />
    </Suspense>
  )
}


