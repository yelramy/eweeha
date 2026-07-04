import Link from 'next/link'
import Footer from '@/components/Footer'
import BackToTop from '@/components/BackToTop'
import { Metadata } from 'next'
import { generateMetadata as generateSeoMetadata } from '@/lib/seoManager'

// ISR: Revalidate every 24 hours
export const revalidate = 86400

export const metadata: Metadata = generateSeoMetadata({
  title: 'Privacy Policy | Eweeha',
  description: 'Understand how Eweeha collects, stores, and protects your personal information when booking wedding cars in Lebanon.',
  path: '/privacy',
})

export default function PrivacyPage() {
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
              <h1 className="text-3xl md:text-4xl font-bold text-charcoal-500 dark:text-white mb-2">Privacy Policy</h1>
              <p className="text-warm-600 dark:text-gray-400">Last updated: {lastUpdated}</p>
            </div>

            {/* Content */}
            <div className="prose prose-slate max-w-none space-y-6 text-charcoal-500 dark:text-gray-300">
              <section>
                <h2 className="text-2xl font-bold text-charcoal-500 dark:text-white mb-4">Introduction</h2>
                <p className="dark:text-gray-300">
                  At Eweeha, we respect your privacy and are committed to protecting your personal data. 
                  This privacy policy explains how we collect, use, and safeguard your information when you use our services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-charcoal-500 dark:text-white mb-4">Information We Collect</h2>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">Personal Information</h3>
                <ul className="list-disc list-inside space-y-2 ml-4 dark:text-gray-300">
                  <li>Name and contact details (email, phone number)</li>
                  <li>Booking preferences and rental history</li>
                  <li>Payment information (processed securely by third-party providers)</li>
                  <li>Communication history with our support team</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-6">Technical Information</h3>
                <ul className="list-disc list-inside space-y-2 ml-4 dark:text-gray-300">
                  <li>IP address and browser information</li>
                  <li>Device type and operating system</li>
                  <li>Pages visited and time spent on our website</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-charcoal-500 dark:text-white mb-4">How We Use Your Information</h2>
                <ul className="list-disc list-inside space-y-2 ml-4 dark:text-gray-300">
                  <li><strong>Process bookings:</strong> To confirm reservations and manage rentals</li>
                  <li><strong>Customer support:</strong> To respond to inquiries and provide assistance</li>
                  <li><strong>Payment processing:</strong> To securely handle transactions</li>
                  <li><strong>Service improvement:</strong> To analyze and enhance our services</li>
                  <li><strong>Legal compliance:</strong> To meet regulatory requirements</li>
                  <li><strong>Marketing:</strong> To send updates and offers (with your consent)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-charcoal-500 dark:text-white mb-4">Data Security</h2>
                <p className="dark:text-gray-300">
                  We implement industry-standard security measures to protect your personal data:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 dark:text-gray-300">
                  <li>SSL/TLS encryption for all data transmission</li>
                  <li>Secure database storage with encrypted credentials</li>
                  <li>Regular security audits and updates</li>
                  <li>Limited access to personal data (need-to-know basis)</li>
                  <li>Secure payment processing through certified providers</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-charcoal-500 dark:text-white mb-4">Data Sharing</h2>
                <p className="mb-4 dark:text-gray-300">
                  We do NOT sell your personal information. We may share data only with:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 dark:text-gray-300">
                  <li><strong>Payment processors:</strong> To complete transactions (Stripe, OMT, etc.)</li>
                  <li><strong>Service providers:</strong> For email notifications and cloud storage</li>
                  <li><strong>Legal authorities:</strong> When required by law or court order</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-charcoal-500 dark:text-white mb-4">Your Rights</h2>
                <p className="mb-4 dark:text-gray-300">You have the right to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4 dark:text-gray-300">
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your data (subject to legal requirements)</li>
                  <li><strong>Object:</strong> Opt-out of marketing communications at any time</li>
                </ul>
                <p className="mt-4 dark:text-gray-300">
                  To exercise any of these rights, please contact us using the details below. We aim to respond within a reasonable timeframe.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-charcoal-500 dark:text-white mb-4">Cookies</h2>
                <p className="dark:text-gray-300">
                  We use cookies to enhance your experience. Essential cookies are required for the site to function. 
                  Analytics cookies help us understand how you use our site. You can control cookies through your browser settings.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-charcoal-500 dark:text-white mb-4">Data Retention</h2>
                <p className="dark:text-gray-300">
                  We retain your personal data only as long as necessary for the purposes outlined in this policy 
                  or as required by law. Booking records are typically kept for 7 years for accounting and legal purposes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-charcoal-500 dark:text-white mb-4">Contact Us</h2>
                <p className="mb-4 dark:text-gray-300">
                  If you have questions about this privacy policy or want to exercise your rights, please reach out to us:
                </p>
                <div className="bg-cream-50 dark:bg-gray-700 rounded-lg p-4 dark:text-gray-300">
                  <p><strong>Email:</strong> <a href="mailto:info@eweeha.com" className="text-primary-600 dark:text-primary-400 hover:underline">info@eweeha.com</a></p>
                  <p><strong>Phone:</strong> <a href="tel:+96176103365" className="text-primary-600 dark:text-primary-400 hover:underline">+961-76-103-365</a></p>
                  <p><strong>WhatsApp:</strong> <a href="https://wa.me/96176103365" className="text-primary-600 dark:text-primary-400 hover:underline">+961-76-103-365</a></p>
                  <p><strong>Address:</strong> Beirut, Lebanon</p>
                </div>
                <p className="mt-4 text-sm dark:text-gray-400">
                  <em>Arabic language support available upon request.</em>
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-charcoal-500 dark:text-white mb-4">Updates to This Policy</h2>
                <p className="dark:text-gray-300">
                  We may update this privacy policy from time to time to reflect changes in our practices or legal requirements. 
                  We will notify you of significant changes via email or a prominent notice on our website. Your continued use 
                  of our services after changes constitutes acceptance of the updated policy.
                </p>
              </section>

              {/* Footer Links */}
              <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/terms" className="text-charcoal-500 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white font-medium underline">
                    Terms of Service
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
