'use client'

import { usePathname } from 'next/navigation'
import WhatsAppButton from '@/components/WhatsAppButton'

export default function ContactButtons() {
  const pathname = usePathname()
  
  // Hide on admin pages
  if (pathname?.startsWith('/admin')) {
    return null
  }

  // The green WhatsApp FAB is the single floating contact entry point
  // (the old sticky Call/WhatsApp bottom bar was removed to unclutter mobile).
  return <WhatsAppButton />
}
