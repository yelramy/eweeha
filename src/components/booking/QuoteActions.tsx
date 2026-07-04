'use client'

import { useState } from 'react'
import {
  CreditCardIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import type { QuoteResponse } from '@/app/api/ai/booking/interpret/route'
import { events } from '@/lib/posthog'

interface QuoteActionsProps {
  quote: QuoteResponse
  phone: string
  whatsappNumber: string
  onReset: () => void
}

function buildQuoteSummaryText(quote: QuoteResponse): string {
  const lines: string[] = ['Wedding Car Rental Quote from Eweeha\n']

  lines.push('Schedule:')
  for (const day of quote.interpretation.days) {
    const serviceLabel = day.serviceType === 'full-day' ? 'Full Day' : day.serviceType
    lines.push(`  ${day.date} - ${serviceLabel} - ${day.label}`)
  }

  lines.push('\nVehicles:')
  for (const v of quote.vehicles) {
    lines.push(`  ${v.name}${v.quantity > 1 ? ` x${v.quantity}` : ''} - ${v.reason}`)
  }

  if (quote.interpretation.startingLocation) {
    lines.push(`\nPickup: ${quote.interpretation.startingLocation}`)
  }
  if (quote.interpretation.passengers) {
    lines.push(`Passengers: ${quote.interpretation.passengers}`)
  }

  lines.push(`\nTotal: $${quote.pricing.subtotal.toFixed(2)}`)
  lines.push(`Pay online & save 10%: $${quote.pricing.onlineTotal.toFixed(2)}`)

  return lines.join('\n')
}

export default function QuoteActions({ quote, phone, whatsappNumber, onReset }: QuoteActionsProps) {
  const [sendingEmail, setSendingEmail] = useState(false)
  const [showPayForm, setShowPayForm] = useState(false)
  const [payName, setPayName] = useState('')
  const [payEmail, setPayEmail] = useState('')
  const [paying, setPaying] = useState(false)

  const handlePayOnline = async () => {
    if (!showPayForm) {
      setShowPayForm(true)
      return
    }

    if (!payName.trim()) {
      toast.error('Please enter your name')
      return
    }

    setPaying(true)

    try {
      const days = quote.interpretation.days
      const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date))
      const firstDate = sorted[0]?.date || new Date().toISOString().split('T')[0]
      const lastDate = sorted[sorted.length - 1]?.date || firstDate

      const hoursMap: Record<string, number> = { '6h': 6, '10h': 10, 'full-day': 24 }
      const dominantService = sorted[0]?.serviceType || '10h'

      const bookingRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: payName.trim(),
          customerPhone: phone,
          customerEmail: payEmail.trim() || undefined,
          vanType: quote.vehicles[0]?.id || '',
          pickupDate: firstDate,
          returnDate: lastDate,
          totalAmount: quote.pricing.onlineTotal,
          paymentMethod: 'stripe',
          rentalDays: days.length || 1,
          hoursPerDay: hoursMap[dominantService] || 10,
          passengerCount: quote.interpretation.passengers || undefined,
          pricingBreakdown: quote.pricing,
        }),
      })

      const bookingData = await bookingRes.json()
      if (!bookingRes.ok || !bookingData.success) {
        throw new Error(bookingData.error || 'Failed to create booking')
      }

      const bookingId = bookingData.data.booking_id

      const stripeRes = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      })

      const stripeData = await stripeRes.json()
      if (!stripeRes.ok || !stripeData.url) {
        throw new Error(stripeData.error || 'Failed to create payment session')
      }

      events.bookingStarted(quote.vehicles[0]?.id)
      window.location.replace(stripeData.url)
    } catch (err) {
      console.error('Pay online error:', err)
      toast.error(err instanceof Error ? err.message : 'Payment failed. Try again.')
      setPaying(false)
    }
  }

  const handleWhatsApp = () => {
    const summary = buildQuoteSummaryText(quote)
    const message = `Hi, I just got an AI quote on your website:\n\n${summary}\n\nCan we proceed?`
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    events.whatsappClicked('ai_quote')
    window.open(url, '_blank')
  }

  const handleEmail = async () => {
    setSendingEmail(true)
    try {
      const res = await fetch('/api/ai/booking/interpret', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'email', phone, quote }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to send email')
      }

      toast.success('Quote sent to our team! We\'ll contact you shortly.')
    } catch (err) {
      console.error('Email send error:', err)
      toast.error('Could not send email. Try WhatsApp instead.')
    } finally {
      setSendingEmail(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 rounded-b-lg sm:sticky sm:bottom-0 z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {/* Price summary row */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 line-through">${quote.pricing.subtotal.toFixed(2)}</div>
            <div className="text-lg font-bold text-primary-700 dark:text-primary-300">${quote.pricing.onlineTotal.toFixed(2)}
              <span className="text-xs font-normal ml-1 text-primary-600 dark:text-primary-400">with 10% off</span>
            </div>
          </div>
          <button
            onClick={onReset}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1 transition-colors"
          >
            <ArrowPathIcon className="w-3.5 h-3.5" /> Start over
          </button>
        </div>

        {/* Pay online inline form */}
        {showPayForm && (
          <div className="mb-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800 space-y-2">
            <input
              type="text"
              value={payName}
              onChange={(e) => setPayName(e.target.value)}
              placeholder="Your name *"
              className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#742F38] focus:border-[#742F38] dark:bg-gray-700 dark:text-white"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handlePayOnline() }}
            />
            <input
              type="email"
              value={payEmail}
              onChange={(e) => setPayEmail(e.target.value)}
              placeholder="Email (optional — for receipt)"
              className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#742F38] focus:border-[#742F38] dark:bg-gray-700 dark:text-white"
              onKeyDown={(e) => { if (e.key === 'Enter') handlePayOnline() }}
            />
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handlePayOnline}
            disabled={paying}
            className="flex-1 bg-[#742F38] hover:bg-[#5C262D] text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-60"
          >
            <CreditCardIcon className="w-4 h-4" />
            {paying ? 'Redirecting to payment...' : showPayForm ? 'Proceed to Payment' : 'Pay Online & Save 10%'}
          </button>
          <div className="flex gap-2 sm:flex-shrink-0">
            <button
              onClick={handleWhatsApp}
              className="flex-1 sm:flex-initial bg-[#25D366] hover:bg-[#1da851] text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              <span className="sm:hidden">WhatsApp</span>
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={handleEmail}
              disabled={sendingEmail}
              className="flex-1 sm:flex-initial bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              <EnvelopeIcon className="w-4 h-4" />
              <span>{sendingEmail ? 'Sending...' : 'Email'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
