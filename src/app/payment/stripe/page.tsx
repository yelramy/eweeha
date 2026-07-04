'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { PhoneIcon, CreditCardIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { Booking } from '@/lib/bookings'
import { useConfig } from '@/hooks/useConfig'

function StripePaymentContent() {
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [bookingData, setBookingData] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [bookingAmount, setBookingAmount] = useState(0)
  const { appConfig: config } = useConfig()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch booking data
        const bookingId = searchParams.get('booking')
        const token = searchParams.get('token') || ''
        if (bookingId) {
          const response = await fetch(`/api/bookings/${bookingId}${token ? `?token=${encodeURIComponent(token)}` : ''}`)
          const result = await response.json()
          
          if (result.success && result.data) {
            setBookingData(result.data)
            const due =
              result.data.deposit_amount && result.data.deposit_amount > 0
                ? Math.max(
                    0,
                    result.data.deposit_amount - (result.data.amount_paid ?? 0)
                  )
                : result.data.total_amount - (result.data.amount_paid ?? 0)
            setBookingAmount(Math.max(0, due))
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [searchParams])

  const handleStripeCheckout = async () => {
    if (!bookingData) return
    
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: bookingData.booking_id,
          amount: bookingAmount,
          currency: 'USD',
          customerName: bookingData.customer_name,
          customerEmail: bookingData.customer_email,
        }),
      })

      const result = await response.json()

      if (result.success && result.url) {
        // Redirect to Stripe Checkout
        window.location.href = result.url
      } else {
        setError(result.error || 'Failed to create checkout session')
        setIsLoading(false)
      }
      
    } catch (error) {
      console.error('Checkout error:', error)
      setError('Failed to initiate payment. Please try again.')
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-warm-600">Loading booking information...</p>
        </div>
      </div>
    )
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-charcoal-500 mb-4">Booking Not Found</h2>
          <p className="text-warm-600 mb-4">The booking information could not be loaded.</p>
          <Link href="/" className="text-primary-600 hover:text-primary-800">
            Back to Fleet
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 md:py-6">
            <Link href="/" className="text-xl md:text-2xl font-bold text-charcoal-500 dark:text-white">
              Eweeha
            </Link>
            <a href={`tel:${config?.contact?.phone || '+96176103365'}`} className="flex items-center text-charcoal-500 dark:text-gray-300 hover:text-charcoal-500 dark:hover:text-primary-400 text-sm md:text-base min-h-[48px] px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <PhoneIcon className="h-5 w-5 md:h-6 md:w-6 mr-2" />
              <span className="hidden sm:inline">{config?.contact?.phone || '+961-76-103-365'}</span>
              <span className="sm:hidden">Call</span>
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto py-8 md:py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft overflow-hidden">
          <div className="bg-primary-600 px-5 md:px-6 py-5 md:py-6">
            <h1 className="text-xl md:text-2xl font-bold text-white flex items-center">
              <CreditCardIcon className="h-7 w-7 md:h-8 md:w-8 mr-3" />
              Credit/Debit Card Payment
            </h1>
            <p className="text-primary-100 text-sm md:text-base mt-1">Secure payment via Stripe</p>
          </div>

          <div className="p-5 md:p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-charcoal-500 dark:text-white mb-4">Payment Summary</h2>
              <div className="bg-cream-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-warm-600 dark:text-gray-400">Booking ID</span>
                  <span className="font-mono text-sm dark:text-gray-300">{bookingData.booking_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-warm-600 dark:text-gray-400">Wedding Car Rental</span>
                  <span className="dark:text-gray-300">${bookingData.total_amount}</span>
                </div>
                <div className="border-t dark:border-gray-600 pt-2 mt-2">
                  <div className="flex justify-between font-semibold text-lg">
                    <span className="dark:text-white">Total Amount</span>
                    <span className="text-primary-600 dark:text-primary-400">${bookingAmount}</span>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-5">
              <div className="bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-200 dark:border-primary-800 rounded-xl p-5">
                <h3 className="font-bold text-primary-900 dark:text-primary-300 mb-3 text-base md:text-lg">✓ Accepted Cards</h3>
                <div className="flex flex-wrap gap-3 text-sm md:text-base text-primary-800 dark:text-primary-300">
                  <span>💳 Visa</span>
                  <span>💳 MasterCard</span>
                  <span>💳 American Express</span>
                  <span>💳 Discover</span>
                </div>
              </div>

              <button
                onClick={handleStripeCheckout}
                disabled={isLoading}
                className={`w-full py-2.5 px-6 rounded-lg font-semibold transition-colors text-sm md:text-base min-h-[44px] ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700'
                } text-white`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                    Redirecting to Stripe...
                  </div>
                ) : (
                  `Pay $${bookingAmount} with Card`
                )}
              </button>

              <div className="text-center">
                <Link
                  href="/booking"
                  className="text-warm-600 hover:text-charcoal-500 text-xs md:text-sm font-medium inline-block py-2 px-4 rounded-md hover:bg-warm-50 transition-colors"
                >
                  ← Back to Payment Options
                </Link>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-green-800">
                  <p className="font-semibold mb-1">🔒 Secure Payment</p>
                  <p>Your payment information is encrypted and secure. Stripe is trusted by millions of businesses worldwide.</p>
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs text-warm-500 text-center">
              <p>Powered by Stripe - PCI DSS Level 1 Certified</p>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="mt-8 bg-white rounded-xl shadow-md p-6 md:p-8 text-center">
          <h3 className="font-bold text-charcoal-500 mb-4 text-lg md:text-xl">Need Help?</h3>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <a
              href={`tel:${config?.contact?.phone || '+96176103365'}`}
              className="flex items-center justify-center text-primary-600 hover:text-primary-800 text-sm md:text-base font-semibold py-2.5 px-5 rounded-lg hover:bg-primary-50 transition-colors min-h-[44px]"
            >
              <PhoneIcon className="h-4 w-4 md:h-5 md:w-5 mr-2" />
              Call Support
            </a>
            <a
              href={`https://wa.me/${config?.contact?.whatsapp || '96176103365'}`}
              className="flex items-center justify-center text-green-600 hover:text-green-800 text-sm md:text-base font-semibold py-2.5 px-5 rounded-lg hover:bg-green-50 transition-colors min-h-[44px]"
            >
              💬 WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StripePayment() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-warm-600">Loading payment page...</p>
        </div>
      </div>
    }>
      <StripePaymentContent />
    </Suspense>
  )
}


