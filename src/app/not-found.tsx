import Link from 'next/link'
import { HomeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-white flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-slate-200">404</h1>
          <div className="relative -mt-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Page Not Found
            </h2>
          </div>
        </div>
        
        <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
          Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-900 transition-colors"
          >
            <HomeIcon className="h-5 w-5 mr-2" />
            Go Home
          </Link>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-white border-2 border-warm-300 text-charcoal-600 rounded-lg font-semibold hover:border-slate-400 transition-colors"
          >
            <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
            Browse Fleet
          </Link>
        </div>

        <div className="mt-12">
          <p className="text-sm text-gray-500">
            Need help?{' '}
            <Link href="/contact" className="text-charcoal-500 underline hover:text-slate-900">
              Contact our support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

