'use client'

import { useState } from 'react'
import {
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import type { QuoteResponse } from '@/app/api/ai/booking/interpret/route'
import { getAddOnName } from '@/lib/weddingAddOns'
import { events } from '@/lib/posthog'

interface QuoteActionsProps {
  quote: QuoteResponse
  phone: string
  whatsappNumber: string
  onReset: () => void
}

function formatDateForMessage(dateStr: string | null): string {
  if (!dateStr) return ''
  try {
    return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function buildPlanSummaryText(quote: QuoteResponse, phone: string): string {
  const lines: string[] = ['Hi Eweeha! Our wedding plan:']

  const when = formatDateForMessage(quote.interpretation.weddingDate)
  lines.push(`Date: ${when || 'not set yet'}`)

  lines.push('Cars:')
  for (const v of quote.vehicles) {
    lines.push(`* ${v.name}${v.quantity > 1 ? ` x${v.quantity}` : ''}`)
  }

  if (quote.interpretation.addOns.length > 0) {
    lines.push(`Add-ons: ${quote.interpretation.addOns.map(getAddOnName).join(', ')}`)
  }
  if (quote.interpretation.startingLocation) {
    lines.push(`Day starts at: ${quote.interpretation.startingLocation}`)
  }
  if (quote.interpretation.venue) {
    lines.push(`Venue: ${quote.interpretation.venue}`)
  }
  if (phone) {
    lines.push(`My number: ${phone}`)
  }

  lines.push('How much would this be?')
  return lines.join('\n')
}

/**
 * Actions under the wedding-day plan. No online payment — there are no public
 * prices yet, so the flow ends on WhatsApp (or an email to the team).
 */
export default function QuoteActions({ quote, phone, whatsappNumber, onReset }: QuoteActionsProps) {
  const [sendingEmail, setSendingEmail] = useState(false)

  const handleWhatsApp = () => {
    const message = buildPlanSummaryText(quote, phone)
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
        throw new Error(data.error || 'Failed to send')
      }

      toast.success('Sent to our team! We\'ll message you with the price.')
    } catch (err) {
      console.error('Email send error:', err)
      toast.error('Could not send. Try WhatsApp instead.')
    } finally {
      setSendingEmail(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 rounded-b-lg sm:sticky sm:bottom-0 z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug pr-2">
            Send us this plan — we reply with availability and the exact price.
          </p>
          <button
            onClick={onReset}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1 transition-colors flex-shrink-0"
          >
            <ArrowPathIcon className="w-3.5 h-3.5" /> Start over
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleWhatsApp}
            className="flex-1 bg-[#25D366] hover:bg-[#1da851] text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4" />
            Send on WhatsApp
          </button>
          <button
            onClick={handleEmail}
            disabled={sendingEmail}
            className="flex-initial bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            <EnvelopeIcon className="w-4 h-4" />
            <span>{sendingEmail ? 'Sending...' : 'Email us'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
