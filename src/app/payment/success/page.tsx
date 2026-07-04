'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircleIcon, PhoneIcon } from '@heroicons/react/24/outline'
import { useConfig } from '@/hooks/useConfig'
import { events } from '@/lib/posthog'

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('booking')
  const amount = searchParams.get('amount')
  const method = searchParams.get('method') || 'stripe'
  const { appConfig: config } = useConfig()

  useEffect(() => {
    if (bookingId) {
      // Track payment completion
      events.paymentCompleted(
        bookingId,
        amount ? parseFloat(amount) : 0,
        method
      )
    }
  }, [bookingId, amount, method])

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-soft p-8 text-center">
        <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
        
        <h2 className="text-2xl font-bold text-charcoal-500 mb-2">Payment Successful!</h2>
        
        <p className="text-warm-600 mb-4">
          Thank you for your payment. Your wedding car rental has been confirmed.
        </p>
        
        {bookingId && (
          <div className="bg-cream-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-warm-600 mb-1">Booking Reference</p>
            <p className="font-mono font-semibold text-lg">{bookingId}</p>
          </div>
        )}
        
        <div className="space-y-4">
          <p className="text-sm text-warm-600">
            You'll receive a confirmation email shortly. We'll also contact you to arrange pickup details.
          </p>
          
          <div className="flex justify-center space-x-4">
            <a
              href={`tel:${config?.contact?.phone || '+96170971841'}`}
              className="flex items-center text-primary-600 hover:text-primary-800"
            >
              <PhoneIcon className="h-4 w-4 mr-1" />
              Call us
            </a>
            <a
              href={`https://wa.me/${config?.contact?.whatsapp || '96170971841'}`}
              className="flex items-center text-[#128C7E] hover:text-[#075E54]"
            >
              💬 WhatsApp
            </a>
          </div>
          
          <Link
            href="/"
            className="block bg-primary-700 text-white px-6 py-3 rounded-md hover:bg-primary-800 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  )
}
