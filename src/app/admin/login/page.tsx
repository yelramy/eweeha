'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import Button from '@/components/Button'
import toast from 'react-hot-toast'

export default function AdminLogin() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Welcome to admin panel!')
        // Full page navigation (not router.push) so the freshly set
        // admin-token cookie is guaranteed to be sent with the request.
        window.location.assign('/admin/bookings')
        return
      } else {
        toast.error(result.error || 'Invalid credentials')
      }
    } catch {
      toast.error('Login failed. Please try again.')
    }
    setLoading(false)
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="mx-auto h-16 w-16 mb-4">
                <Image src="/logo.png" alt="Eweeha" width={64} height={64} priority />
              </div>
              <h2 className="text-3xl font-bold text-charcoal-500">
                <span className="script-accent text-primary-700">Eweeha</span> Admin
              </h2>
              <p className="mt-2 text-warm-700">Sign in to manage your wedding fleet</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-charcoal-500 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full px-4 py-3 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal-500 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-4 py-3 pr-12 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-warm-700"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-6 w-6" />
                    ) : (
                      <EyeIcon className="h-6 w-6" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full"
                size="lg"
                variant="primary"
              >
                Sign In
              </Button>
            </form>
          </div>

          <div className="text-center">
            <Link href="/" className="text-primary-600 hover:text-primary-800 text-sm font-medium">
              ← Back to Website
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
