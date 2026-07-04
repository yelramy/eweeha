'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { PhoneIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { Booking } from '@/lib/bookings'
import { useConfig } from '@/hooks/useConfig'

function OMTPaymentContent() {
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1)
  const [bookingData, setBookingData] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const { appConfig: config } = useConfig()
  const [formData, setFormData] = useState({
    senderName: '',
    senderPhone: '',
    omtReference: '',
    amount: '0'
  })
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)
  const copyFeedbackTimer = useRef<number | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch config
        
        // Fetch booking data
        const bookingId = searchParams.get('booking')
        const token = searchParams.get('token') || ''
        if (bookingId) {
          const response = await fetch(`/api/bookings/${bookingId}${token ? `?token=${encodeURIComponent(token)}` : ''}`)
          const result = await response.json()
          
          if (result.success && result.data) {
            setBookingData(result.data)
            setFormData(prev => ({
              ...prev,
              amount: result.data.total_amount.toString()
            }))
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

  useEffect(() => {
    return () => {
      if (copyFeedbackTimer.current) {
        window.clearTimeout(copyFeedbackTimer.current)
      }
    }
  }, [])

  const recipientDetails = {
    name: config?.business?.name || 'Eweeha LLC',
    phone: config?.contact?.phone || '+961-76-103-365'
  }

  const scheduleCopyFeedbackClear = () => {
    if (copyFeedbackTimer.current) {
      window.clearTimeout(copyFeedbackTimer.current)
    }
    copyFeedbackTimer.current = window.setTimeout(() => setCopyFeedback(null), 2000)
  }

  const handleCopy = async (text: string, label: string) => {
    if (!navigator?.clipboard?.writeText) {
      setCopyFeedback('Copy is not supported in this browser.')
      scheduleCopyFeedbackClear()
      return
    }

    try {
      await navigator.clipboard.writeText(text)
      setCopyFeedback(`${label} copied to clipboard.`)
    } catch (error) {
      console.error('Copy failed:', error)
      setCopyFeedback('Failed to copy. Please try again.')
    }

    scheduleCopyFeedbackClear()
  }

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!bookingData) {
      toast.error('Booking information not loaded')
      return
    }

    setIsSubmitting(true)
    const loadingToast = toast.loading('Submitting payment information...')

    try {
      const response = await fetch('/api/payment/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: bookingData.booking_id,
          paymentMethod: 'omt',
          senderName: formData.senderName,
          senderPhone: formData.senderPhone,
          reference: formData.omtReference,
          amount: formData.amount
        })
      })

      const result = await response.json()
      toast.dismiss(loadingToast)
      
      if (result.success) {
        toast.success('Payment information submitted successfully!')
        setStep(3)
      } else {
        toast.error(result.error || 'Failed to submit payment information')
      }
    } catch (error) {
      toast.dismiss(loadingToast)
      console.error('Error submitting payment info:', error)
      toast.error('Failed to submit payment information. Please try again or contact support.')
    } finally {
      setIsSubmitting(false)
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
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="text-2xl font-bold text-charcoal-500">
              Eweeha
            </Link>
            <a href={`tel:${config?.contact?.phone || '+96176103365'}`} className="flex items-center text-charcoal-500 hover:text-charcoal-500">
              <PhoneIcon className="h-5 w-5 mr-2" />
              {config?.contact?.phone || '+961-76-103-365'}
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-soft overflow-hidden">
          <div className="bg-primary-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white flex items-center">
              <div className="bg-white text-primary-600 rounded px-2 py-1 mr-3 font-bold text-sm">
                OMT
              </div>
              OMT Payment
            </h1>
            <p className="text-primary-100">Pay with OMT (Online Money Transfer)</p>
          </div>

          <div className="p-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-300'}`}>
                  1
                </div>
                <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-300'}`}></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-300'}`}>
                  2
                </div>
                <div className={`w-12 h-0.5 ${step >= 3 ? 'bg-primary-600' : 'bg-gray-300'}`}></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-300'}`}>
                  3
                </div>
              </div>
            </div>

            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-charcoal-500">Step 1: Send Money via OMT</h2>
                
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <h3 className="font-semibold text-primary-900 mb-3">Recipient Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-warm-600">Name:</span>
                      <div className="flex items-center">
                        <span className="font-medium">{recipientDetails.name}</span>
                        <button
                        onClick={() => handleCopy(recipientDetails.name, 'Recipient name')}
                          className="ml-2 text-primary-600 hover:text-primary-800"
                        >
                          <ClipboardDocumentIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-warm-600">Phone:</span>
                      <div className="flex items-center">
                        <span className="font-medium">{recipientDetails.phone}</span>
                        <button
                        onClick={() => handleCopy(recipientDetails.phone, 'Recipient phone')}
                          className="ml-2 text-primary-600 hover:text-primary-800"
                        >
                          <ClipboardDocumentIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-warm-600">Amount:</span>
                      <div className="flex items-center">
                        <span className="font-medium text-lg">${formData.amount} USD</span>
                        <button
                        onClick={() => handleCopy(formData.amount, 'Amount')}
                          className="ml-2 text-primary-600 hover:text-primary-800"
                        >
                          <ClipboardDocumentIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <h3 className="font-semibold text-primary-900 mb-2">Instructions:</h3>
                  <ol className="list-decimal list-inside text-sm text-primary-800 space-y-1">
                    <li>Visit any OMT branch or use the OMT app</li>
                    <li>Send the amount to the recipient details above</li>
                    <li>Keep your OMT reference number</li>
                    <li>Click "Continue" below to proceed</li>
                  </ol>
                </div>

                {copyFeedback && (
                  <p className="text-sm text-green-600" role="status">
                    {copyFeedback}
                  </p>
                )}

                <button
                  onClick={() => setStep(2)}
                  className="w-full bg-primary-600 text-white py-3 px-4 rounded-md hover:bg-primary-700 transition-colors"
                >
                  I've Sent the Money - Continue
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-charcoal-500">Step 2: Provide Transfer Details</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-charcoal-500 mb-2">
                      Your Full Name (as shown on OMT)
                    </label>
                    <input
                      type="text"
                      value={formData.senderName}
                      onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                      className="w-full border border-warm-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal-500 mb-2">
                      Your Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.senderPhone}
                      onChange={(e) => setFormData({ ...formData, senderPhone: e.target.value })}
                      className="w-full border border-warm-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal-500 mb-2">
                      OMT Reference Number
                    </label>
                    <input
                      type="text"
                      value={formData.omtReference}
                      onChange={(e) => setFormData({ ...formData, omtReference: e.target.value })}
                      placeholder="e.g., OMT12345678"
                      className="w-full border border-warm-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal-500 mb-2">
                      Amount Sent (USD)
                    </label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full border border-warm-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary-600 text-white py-3 px-4 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Payment Information'}
                  </button>
                </form>

                <div className="text-center">
                  <button
                    onClick={() => setStep(1)}
                    className="text-warm-600 hover:text-charcoal-500 text-sm"
                  >
                    ← Back to Step 1
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="text-center space-y-6">
                <div className="text-green-600">
                  <div className="text-6xl mb-4">✅</div>
                  <h2 className="text-2xl font-bold text-charcoal-500">Payment Information Received!</h2>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800">
                    We've received your OMT payment information. Our team will verify the transfer within 1-2 hours 
                    and confirm your booking.
                  </p>
                </div>

                <div className="space-y-2 text-sm text-warm-600">
                  <p><strong>Reference Number:</strong> {formData.omtReference}</p>
                  <p><strong>Amount:</strong> ${formData.amount} USD</p>
                </div>

                <div className="space-y-3">
                  <Link
                    href="/"
                    className="block bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Back to Home
                  </Link>
                  
                  <p className="text-sm text-warm-600">
                    You'll receive a confirmation call at your provided number once verified.
                  </p>
                </div>
              </div>
            )}

            {step < 3 && (
              <div className="mt-6 text-center">
                <Link
                  href="/booking"
                  className="text-warm-600 hover:text-charcoal-500 text-sm"
                >
                  ← Back to Payment Options
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Support */}
        <div className="mt-8 bg-white rounded-lg shadow p-6 text-center">
          <h3 className="font-semibold text-charcoal-500 mb-2">Need Help with OMT Payment?</h3>
          <div className="flex justify-center space-x-6">
            <a
              href={`tel:${config?.contact?.phone || '+96176103365'}`}
              className="flex items-center text-primary-600 hover:text-primary-800"
            >
              <PhoneIcon className="h-4 w-4 mr-1" />
              Call Support
            </a>
            <a
              href={`https://wa.me/${config?.contact?.whatsapp || '96176103365'}`}
              className="flex items-center text-green-600 hover:text-green-800"
            >
              💬 WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OMTPayment() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-warm-600">Loading payment page...</p>
        </div>
      </div>
    }>
      <OMTPaymentContent />
    </Suspense>
  )
}
