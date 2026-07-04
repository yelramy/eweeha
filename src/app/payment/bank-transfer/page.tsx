'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { PhoneIcon, ClipboardDocumentIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { Booking } from '@/lib/bookings'
import { useConfig } from '@/hooks/useConfig'

function BankTransferPaymentContent() {
  const searchParams = useSearchParams()
  const [confirmationSent, setConfirmationSent] = useState(false)
  const [bookingData, setBookingData] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const { appConfig: config } = useConfig()
  const [formData, setFormData] = useState({
    senderName: '',
    senderBank: '',
    transferDate: '',
    referenceNumber: '',
    amount: '0'
  })
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)
  const copyFeedbackTimer = useRef<number | null>(null)

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

  const bankDetails = {
    bankName: process.env.NEXT_PUBLIC_BANK_NAME || 'Bank Audi',
    accountName: config?.business?.name || 'Eweeha LLC',
    accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || '1234567890',
    iban: process.env.NEXT_PUBLIC_BANK_IBAN || 'LB62 0999 0000 0001 2345 6789 0123',
    swiftCode: process.env.NEXT_PUBLIC_BANK_SWIFT_CODE || 'AUDBLBBX',
    branch: process.env.NEXT_PUBLIC_BANK_BRANCH || 'Beirut Main Branch'
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate submission
    setTimeout(() => {
      toast.success('Transfer details confirmed!')
      setConfirmationSent(true)
      setIsSubmitting(false)
    }, 500)
  }

  if (confirmationSent) {
    return (
      <div className="min-h-screen bg-cream-50">
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
          <div className="bg-white rounded-lg shadow-soft p-8 text-center">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-charcoal-500 mb-2">Transfer Details Received!</h2>
            <p className="text-warm-600 mb-6">
              We've received your bank transfer information. Our team will verify the payment within 24 hours 
              and confirm your booking.
            </p>
            
            <div className="bg-cream-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-charcoal-500 mb-2">Transfer Summary:</h3>
              <div className="space-y-1 text-sm text-warm-600">
                <p><strong>Reference:</strong> {formData.referenceNumber}</p>
                <p><strong>Amount:</strong> ${formData.amount} USD</p>
                <p><strong>Transfer Date:</strong> {formData.transferDate}</p>
              </div>
            </div>

            <Link
              href="/"
              className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors inline-block"
            >
              Back to Home
            </Link>
            
            <p className="text-sm text-warm-500 mt-4">
              You'll receive a confirmation call once the transfer is verified.
            </p>
          </div>
        </div>
      </div>
    )
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
          <div className="bg-gray-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white flex items-center">
              🏦 Bank Transfer Payment
            </h1>
            <p className="text-gray-200">Transfer funds directly to our bank account</p>
          </div>

          <div className="p-6 space-y-8">
            {/* Bank Details */}
            <div>
              <h2 className="text-lg font-semibold text-charcoal-500 mb-4">Step 1: Bank Account Details</h2>
              <div className="bg-cream-50 border border-warm-200 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-warm-600">Bank Name:</span>
                    <div className="flex items-center">
                      <span className="font-medium">{bankDetails.bankName}</span>
                      <button
                        onClick={() => handleCopy(bankDetails.bankName, 'Bank name')}
                        className="ml-2 text-warm-600 hover:text-charcoal-500"
                      >
                        <ClipboardDocumentIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-warm-600">Account Name:</span>
                    <div className="flex items-center">
                      <span className="font-medium">{bankDetails.accountName}</span>
                      <button
                        onClick={() => handleCopy(bankDetails.accountName, 'Account name')}
                        className="ml-2 text-warm-600 hover:text-charcoal-500"
                      >
                        <ClipboardDocumentIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-warm-600">Account Number:</span>
                    <div className="flex items-center">
                      <span className="font-medium font-mono">{bankDetails.accountNumber}</span>
                      <button
                        onClick={() => handleCopy(bankDetails.accountNumber, 'Account number')}
                        className="ml-2 text-warm-600 hover:text-charcoal-500"
                      >
                        <ClipboardDocumentIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-warm-600">IBAN:</span>
                    <div className="flex items-center">
                      <span className="font-medium font-mono text-sm">{bankDetails.iban}</span>
                      <button
                        onClick={() => handleCopy(bankDetails.iban, 'IBAN')}
                        className="ml-2 text-warm-600 hover:text-charcoal-500"
                      >
                        <ClipboardDocumentIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-warm-600">SWIFT Code:</span>
                    <div className="flex items-center">
                      <span className="font-medium font-mono">{bankDetails.swiftCode}</span>
                      <button
                        onClick={() => handleCopy(bankDetails.swiftCode, 'SWIFT code')}
                        className="ml-2 text-warm-600 hover:text-charcoal-500"
                      >
                        <ClipboardDocumentIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-warm-600">Branch:</span>
                    <span className="font-medium">{bankDetails.branch}</span>
                  </div>

                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-warm-600">Amount to Transfer:</span>
                      <div className="flex items-center">
                        <span className="font-bold text-lg text-green-600">${formData.amount} USD</span>
                        <button
                          onClick={() => handleCopy(formData.amount, 'Amount')}
                          className="ml-2 text-warm-600 hover:text-charcoal-500"
                        >
                          <ClipboardDocumentIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {copyFeedback && (
                <p className="mt-3 text-sm text-green-600" role="status">
                  {copyFeedback}
                </p>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <h3 className="font-semibold text-primary-900 mb-2">Important Instructions:</h3>
              <ul className="list-disc list-inside text-sm text-primary-800 space-y-1">
                <li>Transfer exactly ${formData.amount} USD to the account above</li>
                <li>Include "Wedding Car Rental" in the transfer reference/memo</li>
                <li>Keep your transfer receipt/confirmation</li>
                <li>Fill out the form below after completing the transfer</li>
                <li>Transfers may take 1-3 business days to process</li>
              </ul>
            </div>

            {/* Confirmation Form */}
            <div>
              <h2 className="text-lg font-semibold text-charcoal-500 mb-4">Step 2: Confirm Your Transfer</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal-500 mb-2">
                    Your Full Name (as on bank account)
                  </label>
                  <input
                    type="text"
                    value={formData.senderName}
                    onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                    className="w-full border border-warm-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal-500 mb-2">
                    Your Bank Name
                  </label>
                  <input
                    type="text"
                    value={formData.senderBank}
                    onChange={(e) => setFormData({ ...formData, senderBank: e.target.value })}
                    className="w-full border border-warm-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal-500 mb-2">
                    Transfer Date
                  </label>
                  <input
                    type="date"
                    value={formData.transferDate}
                    onChange={(e) => setFormData({ ...formData, transferDate: e.target.value })}
                    className="w-full border border-warm-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal-500 mb-2">
                    Transfer Reference/Transaction ID
                  </label>
                  <input
                    type="text"
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    placeholder="e.g., TXN123456789"
                    className="w-full border border-warm-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal-500 mb-2">
                    Amount Transferred (USD)
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full border border-warm-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gray-600 text-white py-3 px-4 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Confirming...' : 'Confirm Transfer Details'}
                </button>
              </form>
            </div>

            <div className="text-center">
              <Link
                href="/booking"
                className="text-warm-600 hover:text-charcoal-500 text-sm"
              >
                ← Back to Payment Options
              </Link>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="mt-8 bg-white rounded-lg shadow p-6 text-center">
          <h3 className="font-semibold text-charcoal-500 mb-2">Need Help with Bank Transfer?</h3>
          <div className="flex justify-center space-x-6">
            <a
              href={`tel:${config?.contact?.phone || '+96176103365'}`}
              className="flex items-center text-warm-600 hover:text-charcoal-500"
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
          <p className="text-xs text-warm-500 mt-2">
            Our team will manually verify your transfer within 24 hours
          </p>
        </div>
      </div>
    </div>
  )
}

export default function BankTransferPayment() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-warm-600">Loading payment page...</p>
        </div>
      </div>
    }>
      <BankTransferPaymentContent />
    </Suspense>
  )
}
