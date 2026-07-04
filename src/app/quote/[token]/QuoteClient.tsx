'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import {
  CheckCircleIcon,
  ClockIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import Footer from '@/components/Footer'
import { useConfig } from '@/hooks/useConfig'

interface QuoteData {
  state: 'active' | 'expired' | 'accepted'
  customerName: string | null
  description: string
  schedule?: string
  pickupDate: string
  returnDate: string
  pickupTime: string
  startingLocation: string
  passengers: number
  totalPrice: number
  depositAmount: number
  amountDueNow: number
  balanceDue: number
  isDepositOnly: boolean
  expiresAt: string | null
  bookingId: string | null
  notes?: string | null
}

type PaymentMethod = 'stripe' | 'omt' | 'whish-money' | 'bank-transfer'

export default function QuoteClient() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const { appConfig } = useConfig()

  const [quote, setQuote] = useState<QuoteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const res = await fetch(`/api/quotes/${token}`)
        const data = await res.json()
        if (!data.success) {
          toast.error(data.error || 'Quote not found')
          return
        }
        setQuote(data.data)
        if (data.data.customerName) setCustomerName(data.data.customerName)
      } catch {
        toast.error('Failed to load quote')
      } finally {
        setLoading(false)
      }
    }
    if (token) fetchQuote()
  }, [token])

  const stripeTotal =
    quote && paymentMethod === 'stripe'
      ? Math.round(quote.amountDueNow * 1.05 * 100) / 100
      : quote?.amountDueNow ?? 0

  const handleAccept = async () => {
    if (!quote || !termsAccepted) {
      toast.error('Please accept the terms to continue')
      return
    }
    if (!customerName.trim()) {
      toast.error('Please enter your name')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/quotes/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod,
          termsAccepted: true,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
        }),
      })
      const data = await res.json()

      if (!data.success) {
        toast.error(data.error || 'Failed to accept quote')
        return
      }

      if (data.data.alreadyAccepted && data.data.redirectUrl) {
        router.push(data.data.redirectUrl)
        return
      }

      if (data.data.checkoutUrl) {
        window.location.href = data.data.checkoutUrl
        return
      }

      if (data.data.redirectUrl) {
        router.push(data.data.redirectUrl)
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const whatsapp = appConfig?.contact?.whatsapp || '96170971841'

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-700" />
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <ExclamationTriangleIcon className="h-12 w-12 text-amber-500 mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Quote Not Found</h1>
        <p className="text-gray-600 mb-6 text-center">This link may be invalid or expired.</p>
        <a
          href={`https://wa.me/${whatsapp}`}
          className="px-6 py-3 bg-[#25D366] text-white rounded-lg font-medium"
        >
          Contact us on WhatsApp
        </a>
      </div>
    )
  }

  if (quote.state === 'expired') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <ClockIcon className="h-12 w-12 text-amber-500 mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Quote Expired</h1>
        <p className="text-gray-600 mb-6 text-center max-w-md">
          This quote expired
          {quote.expiresAt
            ? ` on ${format(new Date(quote.expiresAt), 'MMM d, yyyy')}`
            : ''}
          . Message us to get a new quote.
        </p>
        <a
          href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('Hi, my quote link expired. Can you send a new one?')}`}
          className="px-6 py-3 bg-[#25D366] text-white rounded-lg font-medium"
        >
          Request New Quote on WhatsApp
        </a>
      </div>
    )
  }

  if (quote.state === 'accepted' && quote.bookingId) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <CheckCircleIcon className="h-12 w-12 text-green-600 mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Already Confirmed</h1>
        <p className="text-gray-600 mb-6">This quote was already accepted.</p>
        <Link
          href={`/booking/lookup`}
          className="px-6 py-3 bg-primary-700 text-white rounded-lg font-medium"
        >
          View My Booking
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-3xl mx-auto px-4 py-5 flex justify-between items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Eweeha
            </Link>
            <span className="text-sm text-gray-500">Secure quote</span>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Your Quote
            </h1>
            {quote.expiresAt && (
              <p className="text-sm text-amber-700 flex items-center justify-center gap-1">
                <ClockIcon className="h-4 w-4" />
                Valid until {format(new Date(quote.expiresAt), 'MMM d, yyyy')}
              </p>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6">
            <div className="bg-primary-700 px-6 py-4 text-white">
              <h2 className="font-semibold text-lg">{quote.description}</h2>
              {quote.schedule && (
                <p className="text-primary-100 text-sm mt-1">{quote.schedule}</p>
              )}
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Pickup</p>
                  <p className="font-medium">
                    {format(new Date(quote.pickupDate), 'MMM d, yyyy')}
                  </p>
                  <p className="text-gray-600">{quote.pickupTime}</p>
                </div>
                <div>
                  <p className="text-gray-500">Return</p>
                  <p className="font-medium">
                    {format(new Date(quote.returnDate), 'MMM d, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Location</p>
                  <p className="font-medium">{quote.startingLocation}</p>
                </div>
                <div>
                  <p className="text-gray-500">Passengers</p>
                  <p className="font-medium">{quote.passengers}</p>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total price</span>
                  <span className="font-medium">${quote.totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-primary-800">
                  <span>
                    {quote.isDepositOnly
                      ? 'Non-refundable deposit due now'
                      : 'Amount due now'}
                  </span>
                  <span>${quote.amountDueNow.toFixed(2)}</span>
                </div>
                {quote.isDepositOnly && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Balance before pickup</span>
                    <span>${quote.balanceDue.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Your details</h3>
            <input
              type="text"
              placeholder="Full name *"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            />
            <input
              type="email"
              placeholder="Email (for confirmation)"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            />
            <input
              type="tel"
              placeholder="Phone (optional if already on file)"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Payment method</h3>
            <div className="space-y-2">
              {(
                [
                  { id: 'stripe', label: 'Card (instant confirmation)', icon: '💳' },
                  { id: 'omt', label: 'OMT', icon: '🏦' },
                  { id: 'whish-money', label: 'Whish Money', icon: '📱' },
                  { id: 'bank-transfer', label: 'Bank transfer', icon: '🏛️' },
                ] as const
              ).map((m) => (
                <label
                  key={m.id}
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === m.id
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={m.id}
                    checked={paymentMethod === m.id}
                    onChange={() => setPaymentMethod(m.id)}
                    className="text-primary-700"
                  />
                  <span>{m.icon}</span>
                  <span className="font-medium">{m.label}</span>
                  {m.id === 'stripe' && paymentMethod === 'stripe' && (
                    <span className="ml-auto text-sm text-gray-500">
                      ${stripeTotal.toFixed(2)} incl. 5% fee
                    </span>
                  )}
                </label>
              ))}
            </div>
            {paymentMethod !== 'stripe' && (
              <p className="text-xs text-gray-500 mt-3">
                Manual payments are verified by our team before your booking is fully confirmed.
              </p>
            )}
          </div>

          <label className="flex items-start gap-3 mb-6 cursor-pointer">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1 rounded border-gray-300 text-primary-700"
            />
            <span className="text-sm text-gray-700">
              I agree to the{' '}
              <Link href="/terms" className="text-primary-700 underline" target="_blank">
                terms &amp; conditions
              </Link>
              .{' '}
              {quote.isDepositOnly
                ? 'I understand the deposit is non-refundable and locks in my booking.'
                : 'I understand this payment confirms my booking.'}
            </span>
          </label>

          <button
            onClick={handleAccept}
            disabled={submitting || !termsAccepted}
            className="w-full flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-50 text-white font-semibold py-4 px-6 rounded-xl transition-colors"
          >
            <CreditCardIcon className="h-5 w-5" />
            {submitting
              ? 'Processing...'
              : `Pay $${(paymentMethod === 'stripe' ? stripeTotal : quote.amountDueNow).toFixed(2)} & Confirm`}
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">
            Questions?{' '}
            <a
              href={`https://wa.me/${whatsapp}`}
              className="text-[#25D366] font-medium"
            >
              Chat on WhatsApp
            </a>
          </p>
        </main>
      </div>
      <Footer />
    </>
  )
}
