'use client'

import { useConfig } from '@/hooks/useConfig'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid'

export interface QuoteData {
  pickup?: string
  dropoff?: string
  date?: string
  time?: string
  passengers?: number
  bags?: number
}

interface WhatsAppQuickQuoteProps {
  data?: QuoteData
  className?: string
  showIcon?: boolean
  label?: string
}

export function generateWhatsAppMessage(data?: QuoteData): string {
  if (!data || Object.keys(data).length === 0) {
    return 'Hi, I need a wedding car rental. Can you help me?'
  }

  const parts: string[] = ['Hi, I need a wedding car']

  if (data.pickup && data.dropoff) {
    parts.push(`from ${data.pickup} to ${data.dropoff}`)
  } else if (data.pickup) {
    parts.push(`from ${data.pickup}`)
  } else if (data.dropoff) {
    parts.push(`to ${data.dropoff}`)
  }

  if (data.date) {
    const datePart = data.time ? `on ${data.date} at ${data.time}` : `on ${data.date}`
    parts.push(datePart)
  }

  const details: string[] = []
  if (data.passengers) {
    details.push(`Passengers: ${data.passengers}`)
  }
  if (data.bags) {
    details.push(`Bags: ${data.bags}`)
  }

  if (details.length > 0) {
    parts.push(`. ${details.join('. ')}.`)
  } else {
    parts.push('.')
  }

  return parts.join(' ')
}

export default function WhatsAppQuickQuote({
  data,
  className = '',
  showIcon = true,
  label = 'Quick Quote via WhatsApp'
}: WhatsAppQuickQuoteProps) {
  const { appConfig } = useConfig()

  const whatsappNumber = appConfig?.contact?.whatsapp || '96176103365'
  const message = generateWhatsAppMessage(data)
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#20BD5A] text-white font-medium rounded-lg transition-all duration-200 hover:shadow-lg active:scale-95 ${className}`}
      aria-label={label}
    >
      {showIcon && <ChatBubbleLeftRightIcon className="w-5 h-5" />}
      <span>{label}</span>
    </a>
  )
}
