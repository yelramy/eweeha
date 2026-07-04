'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon } from '@heroicons/react/24/outline'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console in development
    console.error('Error boundary caught:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-white flex items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <div className="mb-8">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Oops! Something went wrong
          </h1>
        </div>
        
        <p className="text-lg text-gray-600 mb-8">
          We're sorry for the inconvenience. An unexpected error occurred while processing your request.
        </p>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
            <p className="text-sm font-mono text-red-800">{error.message}</p>
            {error.digest && (
              <p className="text-xs text-red-600 mt-2">Error ID: {error.digest}</p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center px-6 py-3 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-900 transition-colors"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-white border-2 border-warm-300 text-charcoal-600 rounded-lg font-semibold hover:border-slate-400 transition-colors"
          >
            <HomeIcon className="h-5 w-5 mr-2" />
            Go Home
          </Link>
        </div>

        <div className="mt-12">
          <p className="text-sm text-gray-500">
            If this problem persists, please{' '}
            <Link href="/contact" className="text-charcoal-500 underline hover:text-slate-900">
              contact our support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

