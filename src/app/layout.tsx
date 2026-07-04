import type { Metadata, Viewport } from "next";
import { Great_Vibes, Outfit, Cormorant_Garamond } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { generateMetadata, generateStructuredData } from '@/lib/seoManager';
import { getOverallRating } from '@/lib/reviews';
import AuthProvider from '@/components/AuthProvider';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Toaster } from 'react-hot-toast';
import ContactButtons from '@/components/ContactButtons';
import { TrackingProvider } from '@/components/TrackingProvider';
import { PostHogProvider, PostHogPageView } from '@/providers/PostHogProvider';

// Calligraphy script for the Eweeha wordmark and celebratory accents
const greatVibes = Great_Vibes({
  variable: "--font-greatvibes",
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
  ...generateMetadata({
    title: "Wedding Car Rental in Lebanon | Eweeha",
    description: "Wedding cars in Lebanon with chauffeur: decorated bridal cars, classic & convertible cars, and full wedding convoys. Serving every ceremony and venue across Beirut, Jounieh, Byblos, the Metn, Chouf & all Lebanon. Book online or on WhatsApp.",
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

  // Add LocalBusiness schema for better local SEO
  const localBusinessSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://eweeha.com/#business',
    name: 'Eweeha',
    alternateName: ['Eweeha', 'Eweeha Lebanon', 'Wedding Cars Lebanon'],
    image: 'https://eweeha.com/logo.png',
    logo: {
      '@type': 'ImageObject',
      url: 'https://eweeha.com/logo.png',
      width: 512,
      height: 512
    },
    description: 'Wedding car rental in Lebanon with chauffeur: decorated bridal cars, classic and convertible cars, and full wedding convoys. Serving every ceremony and venue across Beirut, Mount Lebanon, and all Lebanon.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Beirut',
      addressRegion: 'Beirut',
      addressCountry: 'LB'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 33.8938,
      longitude: 35.5018
    },
    url: 'https://eweeha.com',
    telephone: '+961-70-971-841',
    priceRange: '$$',
    openingHours: 'Mo-Su 00:00-24:00',
    knowsAbout: [
      'wedding car rental',
      'wedding convoy',
      'bridal car with chauffeur',
      'classic car rental for weddings',
      'convertible wedding cars',
      'wedding guest shuttle'
    ],
    areaServed: [
      { '@type': 'City', name: 'Beirut' },
      { '@type': 'City', name: 'Jounieh' },
      { '@type': 'City', name: 'Byblos' },
      { '@type': 'City', name: 'Batroun' },
      { '@type': 'City', name: 'Broummana' },
      { '@type': 'City', name: 'Aley' },
      { '@type': 'City', name: 'Bhamdoun' },
      { '@type': 'City', name: 'Faraya' },
      { '@type': 'City', name: 'Deir el Qamar' },
      { '@type': 'City', name: 'Zahle' },
      { '@type': 'City', name: 'Baalbek' },
      { '@type': 'City', name: 'Tripoli' },
      { '@type': 'City', name: 'Saida' },
      { '@type': 'City', name: 'Tyre' }
    ],
    makesOffer: [
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Wedding convoy' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Bridal car with chauffeur' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Classic & convertible photoshoot cars' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Wedding guest shuttle vans' } }
    ],
    paymentAccepted: ['Cash', 'Credit Card', 'Bank Transfer', 'OMT', 'Whish Money'],
    currenciesAccepted: 'USD'
  }

  if (ratingStats.totalReviews > 0) {
    localBusinessSchema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Math.round(ratingStats.averageRating * 10) / 10,
      reviewCount: ratingStats.totalReviews,
      bestRating: 5,
      worstRating: 1,
    }
  }

  return (
    <html lang="en" dir="ltr" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationData),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessSchema),
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
      </head>
      <body
        className={`${greatVibes.variable} ${outfit.variable} ${cormorant.variable} antialiased`}
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
