'use client'

import { usePathname } from 'next/navigation'
import WhatsAppButton from '@/components/WhatsAppButton'
import MobileContactBar from '@/components/MobileContactBar'

export default function ContactButtons() {
  const pathname = usePathname()
  
  // Hide on admin pages
  if (pathname?.startsWith('/admin')) {
    return null
  }

  return (
    <>
      {/* WhatsApp Floating Button - Hidden on mobile when sticky bar is visible */}
      <div className="hidden md:block">
        <WhatsAppButton />
      </div>

      {/* Sticky Mobile Contact Bar */}
      <MobileContactBar />
    </>
  )
}
