'use client'

/**
 * Analytics and Tracking Components
 * Renders Google Analytics and Facebook Pixel based on SEO settings
 */

import { useEffect } from 'react'
import Script from 'next/script'

// Facebook Pixel and Google Analytics types
interface FbqFunction {
  (...args: unknown[]): void
  queue?: unknown[]
  loaded?: boolean
  version?: string
}

declare global {
  interface Window {
    fbq?: FbqFunction
    _fbq?: FbqFunction
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

interface AnalyticsProps {
  googleAnalyticsId?: string
  facebookPixelId?: string
}

export function GoogleAnalytics({ googleAnalyticsId }: { googleAnalyticsId: string }) {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${googleAnalyticsId}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  )
}

export function FacebookPixel({ facebookPixelId }: { facebookPixelId: string }) {
  useEffect(() => {
    // Initialize Facebook Pixel
    if (typeof window !== 'undefined' && !window.fbq) {
      // Load Facebook Pixel SDK
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      const firstScript = document.getElementsByTagName('script')[0];
      firstScript.parentNode?.insertBefore(script, firstScript);

      // Initialize fbq function with proper type
      const fbq: FbqFunction = function(...args: unknown[]) {
        fbq.queue = fbq.queue || [];
        fbq.queue.push(args);
      };
      fbq.loaded = true;
      fbq.version = '2.0';
      fbq.queue = [];
      
      window.fbq = fbq;
      window._fbq = fbq;
      
      // Initialize Facebook Pixel
      window.fbq('init', facebookPixelId);
      window.fbq('track', 'PageView');
    } else if (window.fbq) {
      window.fbq('init', facebookPixelId);
      window.fbq('track', 'PageView');
    }
  }, [facebookPixelId])

  return (
    <noscript>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        height="1"
        width="1"
        style={{ display: 'none' }}
        src={`https://www.facebook.com/tr?id=${facebookPixelId}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  )
}

export function TrackingScripts({ googleAnalyticsId, facebookPixelId }: AnalyticsProps) {
  return (
    <>
      {googleAnalyticsId && <GoogleAnalytics googleAnalyticsId={googleAnalyticsId} />}
      {facebookPixelId && <FacebookPixel facebookPixelId={facebookPixelId} />}
    </>
  )
}

// Track custom events
export function trackEvent(eventName: string, eventParams?: Record<string, unknown>) {
  // Google Analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams)
  }

  // Facebook Pixel
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, eventParams)
  }
}

// Track page views
export function trackPageView(url: string) {
  // Google Analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
      page_path: url,
    })
  }

  // Facebook Pixel
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'PageView')
  }
}

