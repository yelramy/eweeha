import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircleIcon } from '@heroicons/react/24/solid'

export const metadata: Metadata = {
  title: 'Thank You | Eweeha',
  description: 'Thanks for your review.',
  robots: { index: false, follow: false },
}

export default function ReviewThankYouPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4">
      <div className="max-w-xl w-full text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <Image
            src="/logo.svg"
            alt="Eweeha"
            width={56}
            height={56}
            className="rounded-full"
          />
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-warm-100 dark:border-gray-700 p-8 sm:p-10">
          <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl sm:text-3xl font-bold text-charcoal-500 dark:text-white mb-3">
            Thank you for your review
          </h1>
          <p className="text-warm-600 dark:text-gray-400 mb-6">
            We really appreciate you taking the time. Your feedback helps future travelers and helps us keep improving.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="bg-gradient-to-br from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-3 rounded-md font-medium transition-all border border-primary-700"
            >
              Back to home
            </Link>
            <a
              href="https://wa.me/96176103365"
              className="px-6 py-3 rounded-md font-medium border border-warm-200 dark:border-gray-600 text-charcoal-500 dark:text-white hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
            >
              Chat with us on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
