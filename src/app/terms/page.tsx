import { Metadata } from 'next'
import { generateMetadata as generateSeoMetadata } from '@/lib/seoManager'

// ISR: Revalidate every 24 hours
export const revalidate = 86400

export const metadata: Metadata = generateSeoMetadata({
  title: 'Terms & Conditions for Eweeha Wedding Cars',
  description: 'Review the legal terms and booking policies that govern Eweeha wedding car services across Lebanon.',
  path: '/terms',
})

import Link from 'next/link'
import Footer from '@/components/Footer'
import BackToTop from '@/components/BackToTop'

export default function TermsPage() {
  const lastUpdated = 'January 2025'

  return (
    <>
      <div className="min-h-screen bg-cream-50 dark:bg-gray-900">
        {/* Simple Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-warm-200 dark:border-gray-700 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white dark:bg-gray-800 rounded-md shadow-lg p-8 md:p-12">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-charcoal-500 dark:text-white mb-2">Terms of Service</h1>
              <p className="text-warm-600 dark:text-gray-400">Last updated: {lastUpdated}</p>
            </div>

            {/* Content */}
            <div className="prose prose-slate max-w-none space-y-6 text-charcoal-500 dark:text-gray-300">
              <section>
                <h2 className="text-2xl font-bold text-charcoal-500 dark:text-white mb-4">Agreement to Terms</h2>
                <p className="dark:text-gray-300">
                  By accessing and using Eweeha' services, you agree to be bound by these Terms of Service. 
                  If you do not agree to these terms, please do not use our services. We strive to provide flexible, professional service while maintaining clear policies.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-charcoal-500 dark:text-white mb-4">Service Description</h2>
                <p className="dark:text-gray-300">
                  Eweeha provides wedding car services with professional drivers throughout Lebanon. 
                  Our services include vehicle rental with driver, transportation services, and related offerings as displayed on our website. We aim to accommodate reasonable requests and customize services to meet your needs.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-charcoal-500 dark:text-white mb-4">Booking and Reservation</h2>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">Confirmation</h3>
                <ul className="list-disc list-inside space-y-2 ml-4 dark:text-gray-300">
                  <li>Bookings are confirmed upon receipt of payment or deposit</li>
                  <li>You will receive a confirmation email and WhatsApp message with booking details</li>
                  <li>Booking ID must be provided for any changes or inquiries</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-4">Requirements</h3>
                <ul className="list-disc list-inside space-y-2 ml-4 dark:text-gray-300">
                  <li>Minimum booking duration: 4 hours</li>
                  <li>Advance booking recommended: 24-48 hours (we often accommodate last-minute requests)</li>
                  <li>Valid contact information required (phone and WhatsApp preferred)</li>
                  <li>Age requirement: 18+ for booking</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-charcoal-500 dark:text-white mb-4">Payment Terms</h2>
                <ul className="list-disc list-inside space-y-2 ml-4 dark:text-gray-300">
                  <li>Payment in full required at time of booking</li>
                  <li>Accepted methods: Credit/debit cards, OMT, bank transfer, Whish Money, or cash (USD)</li>
                  <li>All prices quoted in USD</li>
                  <li>Prices include: vehicle, driver, fuel, insurance, and standard equipment</li>
                  <li>Additional charges may apply for: extra hours beyond booking, Lebanese public holiday surcharges</li>
                </ul>
                <p className="mt-4 text-sm dark:text-gray-400">
                  <em>Note: Holiday surcharges may apply during major Lebanese holidays including Eid al-Fitr, Eid al-Adha, Christmas, Easter, and Independence Day.</em>
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-charcoal-500 dark:text-white mb-4">Cancellation and Refund Policy</h2>
                <div className="bg-primary-50 dark:bg-primary-900/30 border-l-4 border-primary-500 dark:border-primary-400 p-4 mb-4">
                  <p className="font-semibold dark:text-gray-200">Cancellation Timeline:</p>
                </div>
                <ul className="list-disc list-inside space-y-2 ml-4 dark:text-gray-300">
                  <li><strong>48+ hours before:</strong> Full refund (100%)</li>
                  <li><strong>24-48 hours before:</strong> Partial refund (50%)</li>
                  <li><strong>Less than 24 hours:</strong> No refund</li>
                  <li><strong>No-show:</strong> Full charge, no refund</li>
                </ul>
                <p className="mt-4 dark:text-gray-300">
                  Refunds are processed within 5-7 business days to the original payment method. We understand plans can change and aim to be as flexible as possible within these guidelines.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-charcoal-500 dark:text-white mb-4">Vehicle Use and Responsibilities</h2>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">Driver Services</h3>
                <ul className="list-disc list-inside space-y-2 ml-4 dark:text-gray-300">
                  <li>All rentals include a professional, licensed driver</li>
                  <li>Driver is responsible for vehicle operation and safety</li>
                  <li>Customers must not attempt to drive the vehicle</li>
                  <li>Driver follows all traffic laws and safety regulations</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-4">Passenger Conduct</h3>
                <ul className="list-disc list-inside space-y-2 ml-4 dark:text-gray-300">
                  <li>No smoking in vehicles</li>
                  <li>No illegal substances or activities</li>
                  <li>Please respect vehicle cleanliness and property</li>
                  <li>Follow driver's safety instructions and recommendations</li>
                  <li>Cleaning fee applies for excessive mess or damage</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-charcoal-500 dark:text-white mb-4">Insurance and Liability</h2>
                <ul className="list-disc list-inside space-y-2 ml-4 dark:text-gray-300">
                  <li>All vehicles are fully insured with comprehensive coverage</li>
                  <li>Passenger insurance included in rental price</li>
                  <li>Driver responsible for vehicle operation</li>
                  <li>Customers liable for intentional damage or misuse</li>
                  <li>Personal belongings are customer's responsibility</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-charcoal-500 dark:text-white mb-4">Modification and Cancellation by Eweeha</h2>
                <p className="dark:text-gray-300">
                  We reserve the right to cancel or modify bookings due to circumstances beyond our control, including:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 dark:text-gray-300">
                  <li>Vehicle breakdown or maintenance issues</li>
                  <li>Severe weather or unsafe road conditions</li>
                  <li>Political instability or security situations</li>
                  <li>Fuel shortages or supply disruptions</li>
                  <li>Road closures, checkpoints, or access restrictions</li>
                  <li>Bank closures or currency restrictions</li>
                  <li>National emergencies or force majeure events</li>
                  <li>Safety concerns for passengers or drivers</li>
                </ul>
                <p className="mt-3 dark:text-gray-300">
                  In such cases, we will offer a full refund or alternative vehicle at no additional cost. We aim to provide reasonable notice when possible and work with you to find suitable alternatives.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-charcoal-500 dark:text-white mb-4">Limitation of Liability</h2>
                <p className="dark:text-gray-300">
                  While we strive for punctual, reliable service, Eweeha is not liable for:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 dark:text-gray-300">
                  <li>Delays due to traffic, weather, checkpoints, or unforeseen circumstances</li>
                  <li>Lost or stolen personal belongings</li>
                  <li>Indirect or consequential damages</li>
                  <li>Third-party actions or services</li>
                </ul>
                <p className="mt-3 dark:text-gray-300">
                  Our total liability is limited to the amount paid for the rental.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-charcoal-500 dark:text-white mb-4">Governing Law and Disputes</h2>
                <p className="dark:text-gray-300">
                  These terms are governed by the laws of Lebanon. Any disputes arising from these terms or our services will be resolved in the Courts of Beirut, Lebanon.
                </p>
                <p className="mt-3 dark:text-gray-300">
                  We encourage open communication to resolve any concerns. Please contact us directly before pursuing legal action, as we aim to find amicable solutions to any issues.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-charcoal-500 dark:text-white mb-4">Contact Information</h2>
                <p className="mb-4 dark:text-gray-300">
                  For questions about these terms or any service inquiries, please reach out:
                </p>
                <div className="bg-cream-50 dark:bg-gray-700 rounded-lg p-4 dark:text-gray-300">
                  <p><strong>Email:</strong> <a href="mailto:info@eweeha.com" className="text-primary-600 dark:text-primary-400 hover:underline">info@eweeha.com</a></p>
                  <p><strong>Phone:</strong> <a href="tel:+96176103365" className="text-primary-600 dark:text-primary-400 hover:underline">+961-76-103-365</a></p>
                  <p><strong>WhatsApp:</strong> <a href="https://wa.me/96176103365" className="text-primary-600 dark:text-primary-400 hover:underline" target="_blank" rel="noopener noreferrer">+961-76-103-365</a></p>
                  <p><strong>Address:</strong> Beirut, Lebanon</p>
                </div>
                <p className="mt-4 text-sm dark:text-gray-400">
                  <em>WhatsApp is our preferred contact method for quick responses. Arabic language support available upon request.</em>
                </p>
              </section>

              {/* Footer Links */}
              <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/privacy" className="text-charcoal-500 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white font-medium underline">
                    Privacy Policy
                  </Link>
                  <Link href="/contact" className="text-charcoal-500 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white font-medium underline">
                    Contact Us
                  </Link>
                  <Link href="/" className="text-charcoal-500 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white font-medium underline">
                    Back to Home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <BackToTop />
    </>
  )
}
