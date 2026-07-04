'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useNotification } from '@/contexts/NotificationContext'

interface AdminLayoutProps {
  children: ReactNode
}

const navigation = [
  { name: 'Bookings', href: '/admin/bookings' },
  { name: 'Requests', href: '/admin/rental-requests' },
  { name: 'Payments', href: '/admin/payment-links' },
  { name: 'Invoices', href: '/admin/invoices' },
  { name: 'Fleet', href: '/admin/fleet' },
  { name: 'Reviews', href: '/admin/reviews' },
  { name: 'Blog', href: '/admin/blog' },
  { name: 'Content', href: '/admin/content' },
  { name: 'AI & SEO', href: '/admin/ai-seo' },
  { name: 'Analytics', href: '/admin/analytics' },
  { name: 'Settings', href: '/admin/settings' },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const notification = useNotification()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      const toastId = notification.loading('Signing out...')
      await fetch('/api/admin/auth', { method: 'DELETE' })
      notification.dismiss(toastId)
      notification.success('Signed out successfully')
      router.push('/admin/login')
    } catch {
      notification.error('Failed to sign out')
    }
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="border-b border-gray-200 sticky top-0 bg-white z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/admin/bookings" className="text-base font-semibold text-gray-900">
              Eweeha
            </Link>
          </div>

          {/* Desktop nav */}
          <nav className="hidden lg:flex flex-wrap gap-1 text-sm">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`rounded px-2 py-1 ${
                    isActive ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Desktop actions */}
          <div className="hidden lg:flex items-center gap-2 text-sm">
            <Link
              href="/"
              className="rounded border border-gray-200 px-3 py-1.5 text-gray-700 hover:border-gray-300"
            >
              View Site
            </Link>
            <button
              onClick={handleLogout}
              className="rounded bg-gray-900 px-3 py-1.5 font-medium text-white hover:bg-gray-800"
            >
              Sign Out
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-gray-600"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <nav className="flex flex-col px-4 py-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`rounded px-3 py-2 text-sm ${
                      isActive ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600'
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              })}
            </nav>
            <div className="border-t border-gray-200 px-4 py-3 flex gap-2">
              <Link
                href="/"
                className="flex-1 text-center rounded border border-gray-200 px-3 py-2 text-sm text-gray-700"
              >
                View Site
              </Link>
              <button
                onClick={handleLogout}
                className="flex-1 rounded bg-gray-900 px-3 py-2 text-sm font-medium text-white"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-4 sm:py-6">
        {children}
      </main>
    </div>
  )
}
