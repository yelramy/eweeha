'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import Footer from '@/components/Footer'

export default function BookingLookupClient() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    bookingId: '',
    email: ''
  })
  const [isSearching, setIsSearching] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.bookingId || !formData.email) {
      toast.error('Please enter both Booking ID and Email')
      return
    }

    setIsSearching(true)

    try {
      // Call API to verify booking and get token
      const response = await fetch('/api/bookings/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        toast.error(data.error || 'Booking not found. Please check your details.')
        return
      }

      // Redirect to confirmation page with token
      router.push(`/booking/confirmation?booking=${formData.bookingId}&token=${data.token}`)
    } catch (error) {
      console.error('Lookup error:', error)
      toast.error('Failed to find booking. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white">
                Eweeha
              </Link>
              <Link 
                href="/" 
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </header>

        <div className="max-w-md mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
              <MagnifyingGlassIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Find My Booking
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Enter your booking details to view your reservation
            </p>
          </div>

          {/* Lookup Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label 
                  htmlFor="bookingId" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Booking ID *
                </label>
                <input
                  type="text"
                  id="bookingId"
                  value={formData.bookingId}
                  onChange={(e) => setFormData({ ...formData, bookingId: e.target.value.trim() })}
                  placeholder="EW-XXXXXXXXXXXXX"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-colors"
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Found in your confirmation email
                </p>
              </div>

              <div>
                <label 
                  htmlFor="email" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value.trim().toLowerCase() })}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-colors"
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Email used when booking
                </p>
              </div>

              <button
                type="submit"
                disabled={isSearching}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSearching ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Searching...
                  </>
                ) : (
                  <>
                    <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                    Find Booking
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-3">
                Need help?
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="tel:+96170971841"
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  📞 Call Us
                </a>
                <a
                  href="https://wa.me/96170971841"
                  className="inline-flex items-center justify-center px-4 py-2 border border-[#25D366] rounded-lg text-sm font-medium text-[#128C7E] dark:text-[#25D366] hover:bg-[#25D366]/10"
                >
                  💬 WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="mt-8 bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-primary-900 dark:text-primary-300 mb-2">
              💡 Tips
            </h3>
            <ul className="text-sm text-primary-800 dark:text-primary-300 space-y-1">
              <li>• Check your confirmation email for the Booking ID</li>
              <li>• Make sure to use the same email you booked with</li>
              <li>• Booking ID starts with "EW-"</li>
            </ul>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

