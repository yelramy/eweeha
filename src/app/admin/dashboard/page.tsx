'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Dashboard has been removed - redirect to bookings
    router.replace('/admin/bookings')
  }, [router])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-gray-500 text-sm">Redirecting...</p>
    </div>
  )
}
