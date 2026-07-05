import type { Metadata, Viewport } from "next";
import { Kaushan_Script, Outfit, Cormorant_Garamond } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { generateMetadata, generateStructuredData, generateWebSiteStructuredData, siteConfig } from '@/lib/seoManager';
import { getOverallRating } from '@/lib/reviews';
import AuthProvider from '@/components/AuthProvider';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Toaster } from 'react-hot-toast';
import ContactButtons from '@/components/ContactButtons';
import { TrackingProvider } from '@/components/TrackingProvider';
import { PostHogProvider, PostHogPageView } from '@/providers/PostHogProvider';

// Celebratory brush script for the Eweeha wordmark and accents — energetic
// and festive, legible at every size (single 400 weight)
const scriptFont = Kaushan_Script({
  variable: "--font-script",
  subsets: ["latin"],
  display: 'swap',
  weight: '400',
});

// Clean geometric sans for body text
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

// Editorial garamond for headings — wedding invitation feel
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: 'Wedding Car Rental in Lebanon',
    template: '%s | Eweeha',
  },
  ...generateMetadata({
    description:
      'Wedding cars in Lebanon with chauffeur: bridal cars, classic & convertible cars, and full wedding convoys. Serving every ceremony and venue across Beirut, Jounieh, Byblos, the Metn, Chouf & all Lebanon. Book online or on WhatsApp.',
    path: '/',
    omitTitle: true,
  }),
  icons: [
    {
      rel: 'icon',
      type: 'image/x-icon',
      url: '/favicon.ico',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      url: '/favicon-32x32.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '192x192',
      url: '/icon-192.png',
    },
    {
      rel: 'apple-touch-icon',
      sizes: '180x180',
      url: '/apple-touch-icon.png',
    },
  ],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#742F38' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' },
  ],
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [organizationData, ratingStats] = await Promise.all([
    generateStructuredData({}),
    getOverallRating(),
  ]);

  // Single source of truth for the business entity: one @graph with the
  // organization + website nodes, instead of multiple competing entities.
  const orgNode = organizationData as Record<string, unknown>
  delete orgNode['@context']
  if (ratingStats.totalReviews > 0) {
    orgNode.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Math.round(ratingStats.averageRating * 10) / 10,
      reviewCount: ratingStats.totalReviews,
      bestRating: 5,
      worstRating: 1,
    }
  }

  const rootSchemaGraph = {
    '@context': 'https://schema.org',
    '@graph': [orgNode, generateWebSiteStructuredData()],
  }

  return (
    <html lang="en" dir="ltr" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(rootSchemaGraph),
          }}
        />

        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://connect.facebook.net" crossOrigin="anonymous" />

        {/* Mobile Web App Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Eweeha" />

        {/* Geo Meta Tags for Local SEO */}
        <meta name="geo.region" content="LB-BA" />
        <meta name="geo.placename" content="Beirut" />
        <meta name="geo.position" content="33.8938;35.5018" />
        <meta name="ICBM" content="33.8938, 35.5018" />

        {/* Additional SEO */}
        <meta name="format-detection" content="telephone=no" />
        <link rel="logo" type="image/png" href="/logo.png" />
        <meta name="application-name" content="Eweeha" />
      </head>
      <body
        className={`${scriptFont.variable} ${outfit.variable} ${cormorant.variable} antialiased`}
      >
        <PostHogProvider>
          <Suspense fallback={null}>
            <PostHogPageView />
          </Suspense>
          <AuthProvider>
            {children}
          </AuthProvider>
        </PostHogProvider>

        {/* Global Toast Notifications - Mobile Optimized */}
        <Toaster
          position="bottom-center"
          gutter={8}
          containerStyle={{
            bottom: 96, // Above mobile contact bar (80px bar + 16px spacing)
          }}
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1F2937',
              color: '#fff',
              padding: '16px 24px',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '500',
              maxWidth: 'calc(100vw - 32px)',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
            },
            success: {
              duration: 3000,
              style: {
                background: '#10B981',
              },
            },
            error: {
              duration: 4000,
              style: {
                background: '#EF4444',
              },
            },
          }}
        />

        {/* Analytics - only in production on Vercel */}
        {process.env.VERCEL_ENV === 'production' && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}

        {/* Custom Tracking Scripts (Google Analytics & Facebook Pixel) */}
        <TrackingProvider />

        {/* Contact buttons (WhatsApp & Mobile Bar) - Hidden on admin pages */}
        <ContactButtons />
      </body>
    </html>
  );
}
