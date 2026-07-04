'use client'

import { useConfig } from '@/hooks/useConfig'
import { PhoneIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid'
import { generateWhatsAppMessage, QuoteData } from './WhatsAppQuickQuote'
import { events } from '@/lib/posthog'

interface MobileContactBarProps {
  quoteData?: QuoteData
}

export default function MobileContactBar({ quoteData }: MobileContactBarProps) {
  const { appConfig } = useConfig()

  const phoneNumber = appConfig?.contact?.phone || '+961-76-103-365'
  const whatsappNumber = appConfig?.contact?.whatsapp || '96176103365'
  const message = generateWhatsAppMessage(quoteData)
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`

  // Format phone number for tel: link (remove hyphens and spaces)
  const telLink = phoneNumber.replace(/[-\s]/g, '')

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#0B6B3A] border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.15)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex">
        {/* Call Button */}
        <a
          href={`tel:${telLink}`}
          onClick={() => events.phoneClicked('mobile_bar')}
          className="flex-1 flex items-center justify-center gap-2 py-4 px-4 bg-[#0B6B3A] hover:bg-[#094f2b] active:bg-[#073d22] text-white font-semibold transition-colors duration-150 active:scale-[0.98]"
          aria-label="Call us"
        >
          <PhoneIcon className="w-5 h-5" />
          <span className="text-sm">Call Now</span>
        </a>

        {/* Divider */}
        <div className="w-px bg-white/20 my-3" />

        {/* WhatsApp Button */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => events.whatsappClicked('mobile_bar')}
          className="flex-1 flex items-center justify-center gap-2 py-4 px-4 bg-[#0B6B3A] hover:bg-[#094f2b] active:bg-[#073d22] text-white font-semibold transition-colors duration-150 active:scale-[0.98]"
          aria-label="Chat on WhatsApp"
        >
          <ChatBubbleLeftRightIcon className="w-5 h-5" />
          <span className="text-sm">WhatsApp</span>
        </a>
      </div>
    </div>
  )
}
