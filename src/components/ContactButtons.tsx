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
      {/* WhatsApp Floating Button - the familiar green circle, on all screen sizes */}
      <WhatsAppButton />

      {/* Sticky Mobile Contact Bar */}
      <MobileContactBar />
    </>
  )
}
