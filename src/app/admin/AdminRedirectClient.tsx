'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminRedirectClient() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to bookings (main admin page)
    router.replace('/admin/bookings')
  }, [router])

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-warm-600">Loading admin panel...</p>
      </div>
    </div>
  )
}
