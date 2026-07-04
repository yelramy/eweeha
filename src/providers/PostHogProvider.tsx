'use client'

import posthog from 'posthog-js'
import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST
    
    if (typeof window !== 'undefined' && posthogKey) {
      // Only disable on localhost
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      
      console.log('[PostHog] Initializing with:', {
        key: posthogKey.substring(0, 10) + '...',
        host: posthogHost || 'NOT SET - will fail',
        hostname: window.location.hostname
      })
      
      posthog.init(posthogKey, {
        api_host: posthogHost,
        person_profiles: 'identified_only',
        capture_pageview: false,
        capture_pageleave: true,
        loaded: (posthog) => {
          if (isLocalhost) {
            posthog.opt_out_capturing()
            console.log('[PostHog] Tracking disabled on localhost')
          } else {
            console.log('[PostHog] Tracking enabled - ready to capture events')
          }
        }
      })
    } else {
      console.error('[PostHog] Configuration error:', {
        hasKey: !!posthogKey,
        hasHost: !!posthogHost,
        key: posthogKey || 'MISSING',
        host: posthogHost || 'MISSING'
      })
    }
  }, [])

  return <>{children}</>
}

export function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (pathname && typeof window !== 'undefined') {
      let url = window.origin + pathname
      if (searchParams.toString()) {
        url = url + `?${searchParams.toString()}`
      }
      posthog.capture('$pageview', {
        $current_url: url,
      })
      console.log('[PostHog] Page view tracked:', url)
    }
  }, [pathname, searchParams])

  return null
}

