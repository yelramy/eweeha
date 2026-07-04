'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Booking {
  id: string
  booking_id: string
  van_type: string
  pickup_date: string
  return_date: string
  total_amount: number
  payment_status: string
  created_at: string
}

export default function ProfileClient() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const res = await fetch('/api/users/bookings')
        const data = await res.json()
        if (data.success) setBookings(data.data)
      } finally {
        setLoading(false)
      }
    }
    loadBookings()
  }, [])

  if (loading) return <div className="p-6 text-warm-600">Loading...</div>

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4 text-charcoal-500 dark:text-white">Welcome{session?.user?.name ? `, ${session.user.name}` : ''}</h1>
        <h2 className="text-lg font-medium mb-3 text-charcoal-500 dark:text-gray-200">Your bookings</h2>
        {bookings.length === 0 ? (
          <div className="text-warm-600 dark:text-gray-400">No bookings found.</div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div key={b.id} className="bg-white dark:bg-gray-800 border border-warm-200 dark:border-gray-700 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-charcoal-500 dark:text-white">{b.van_type}</div>
                  <div className="text-sm text-warm-600 dark:text-gray-400">{new Date(b.pickup_date).toLocaleDateString()} - {new Date(b.return_date).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-primary-700 dark:text-primary-300">${b.total_amount.toFixed(2)}</div>
                  <div className="text-sm text-warm-600 dark:text-gray-400">{b.payment_status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
