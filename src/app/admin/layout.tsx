'use client'

import { NotificationProvider } from '@/contexts/NotificationContext'

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Admin is intentionally light-only. The public site auto-switches to dark
  // via prefers-color-scheme, but the admin pages are built with hardcoded
  // light surfaces (bg-white / bg-gray-50) and almost no dark: variants, so on
  // an OS in dark mode they would otherwise show the dark body bleeding through
  // gaps and dark native controls (date pickers, scrollbars). Forcing the
  // color scheme + an opaque light canvas here keeps admin consistent.
  return (
    <NotificationProvider>
      <div
        className="admin-shell min-h-screen bg-gray-50 text-gray-900"
        style={{ colorScheme: 'light' }}
      >
        {children}
      </div>
    </NotificationProvider>
  )
}