import Link from 'next/link'
import Footer from '@/components/Footer'

export default function BookingSSRFallback() {
  return (
    <div className="min-h-screen bg-cream-50 dark:bg-gray-900">
      <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-charcoal-500 dark:text-white">
            Book Your Wedding Car
          </h1>
          <p className="text-warm-600 dark:text-gray-400 mt-2">
            Wedding cars in Lebanon with suited chauffeur included
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-6 md:p-8 mb-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-charcoal-500 dark:text-white mb-4">
                Online Booking Form
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Book your wedding car rental in 7 easy steps:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Select your rental dates (start and end date)</li>
                <li>Enter number of passengers and luggage</li>
                <li>Choose from our fleet of wedding cars</li>
                <li>Select service duration (10 or 24 hours per day)</li>
                <li>Customize with optional extras</li>
                <li>Provide your contact details</li>
                <li>Choose payment method and confirm</li>
              </ol>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-bold text-charcoal-500 dark:text-white mb-3">
                Our Fleet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Choose from our wedding fleet:
              </p>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Decorated bridal sedans for the couple</li>
                <li>• Classic &amp; convertible cars for the photos and the grand exit</li>
                <li>• Luxury sedans &amp; SUVs for family and convoy cars</li>
                <li>• Guest shuttle vans and minibuses for your guests</li>
                <li>• All cars include a suited chauffeur and fuel</li>
              </ul>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-bold text-charcoal-500 dark:text-white mb-3">
                Payment Methods
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                We accept multiple payment options:
              </p>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• International Credit/Debit Cards (Visa, Mastercard)</li>
                <li>• OMT Money Transfer</li>
                <li>• Whish Money</li>
                <li>• Bank Transfer</li>
              </ul>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-bold text-charcoal-500 dark:text-white mb-3">
                Service Coverage
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Weddings everywhere in Lebanon: Beirut, Jounieh &amp; Harissa, Byblos &amp; Batroun, Broummana,
                Aley &amp; Bhamdoun, Faraya &amp; Faqra, the Chouf, Zahle &amp; the Bekaa, the South and the North.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-charcoal-500 dark:text-white mb-4">
            Need Help Booking?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Contact us directly and we'll help you with your reservation:
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="tel:+96170971841"
              className="px-6 py-3 bg-charcoal-500 text-white rounded-lg font-semibold text-center hover:bg-charcoal-600 transition-colors"
            >
              Call Us: +961 70 971 841
            </a>
            <a
              href="https://wa.me/96170971841"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-gradient-to-br from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-md font-light text-center transition-all border border-primary-700 tracking-wider"
            >
              WhatsApp Chat
            </a>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="inline-block text-primary-600 dark:text-primary-400 hover:underline"
          >
            ← Back to Fleet
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  )
}

