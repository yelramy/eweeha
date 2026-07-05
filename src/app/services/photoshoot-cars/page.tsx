import { Metadata } from 'next'
import Link from 'next/link'
import { generateMetadata as generateSeoMetadata } from '@/lib/seoManager'
import { ServiceSchema, FAQSchema } from '@/components/StructuredDataEnhanced'
import { FAQAccordion } from '@/components/Accordion'

export const metadata: Metadata = generateSeoMetadata({
  title: 'Classic & Convertible Wedding Cars in Lebanon - Photoshoot Rentals',
  description: 'Rent classic and convertible cars for your Lebanese wedding and photoshoot. Vintage classics with chauffeur for ceremony exits, old souk sessions, and coastal golden-hour photos in Byblos, Batroun, Beirut & beyond.',
  path: '/services/photoshoot-cars',
})

export default function PhotoshootCarsPage() {
  const faqs = [
    {
      question: "Can we book a classic car just for the photo session?",
      answer: "Yes — that's the most popular way to do it. A short booking around your photoshoot, standalone or added to your wedding-day cars. The classic appears exactly where the photographer wants it, when the light is right."
    },
    {
      question: "Do the classic cars come with a driver?",
      answer: "Always — our classics are chauffeur-driven. It protects the car and your schedule, and during the session the chauffeur doubles as a car handler, positioning and re-positioning for the photographer."
    },
    {
      question: "Which locations work best with a classic car?",
      answer: "The old souks and harbor of Byblos, Batroun's stone alleys and seafront, Beirut's heritage streets in Achrafieh and Gemmayzeh, and mountain village squares like Deir el Qamar. We know the parking and permission realities at each."
    },
    {
      question: "What about a convertible for the convoy?",
      answer: "The open-top convoy is its own experience — standing in the car, waving, horns singing. We run the top down for the moments and up for the highway so hair and veil survive. See the convertible convoy experience page for details."
    },
    {
      question: "What if it rains on a convertible booking?",
      answer: "The top goes up and the day continues. If the forecast turns bad in advance, we swap to a classic or luxury sedan at no penalty."
    },
    {
      question: "Which exact cars do you currently have?",
      answer: "The lineup changes by season. Check the fleet page for what's live now, or message us on WhatsApp — we'll send current photos and availability for your date."
    }
  ]

  return (
    <>
      {/* Structured Data */}
      <ServiceSchema
        service={{
          name: "Classic & Convertible Wedding Cars",
          description: "Classic and convertible car rental with chauffeur for weddings and wedding photoshoots across Lebanon",
          provider: "Eweeha",
          areaServed: "Lebanon",
          priceRange: "$250-$800"
        }}
      />
      <FAQSchema faqs={faqs} />

      <div className="min-h-screen bg-white dark:bg-gray-900">
        {/* Simple Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-warm-200 dark:border-gray-700 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="script-accent text-3xl text-primary-100 mb-4">the frame-worthy ones…</p>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Classic &amp; Convertible Cars
              </h1>
              <p className="text-xl md:text-2xl text-white mb-8">
                Vintage chrome, white ribbons, golden light — the photos that outlive the wedding
              </p>
              <Link
                href="/booking"
                className="inline-block bg-white text-primary-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-cream-100 transition-colors"
              >
                Book a Classic
              </Link>
            </div>
          </div>
        </section>

        {/* Service Overview */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-black dark:text-white mb-6">
              Some Cars Are for Transport. These Are for the Album.
            </h2>
            <div className="max-w-none">
              <p className="text-black dark:text-gray-300 text-lg leading-relaxed mb-4">
                Every Lebanese salon has one: the framed photo of the couple leaning on a beautiful old car, sea or stone
                behind them, everything golden. That photo doesn&apos;t happen by accident — it happens because the right car was
                in the right alley at the right hour, with someone who knew how to place it.
              </p>
              <p className="text-black dark:text-gray-300 text-lg leading-relaxed mb-4">
                Our classics and convertibles come chauffeur-driven and camera-ready: polished the morning of, ribboned or
                bare per your photographer&apos;s taste, positioned and repositioned throughout the session. We plan the route with
                your photographer beforehand — old Byblos, Batroun&apos;s alleys, Beirut&apos;s heritage streets, a coastal viewpoint at
                golden hour — and we handle the parking-and-permissions reality of each spot.
              </p>
              <p className="text-black dark:text-gray-300 text-lg leading-relaxed">
                Book a classic as your <Link href="/services/bridal-car" className="underline hover:text-primary-600">bridal car</Link>, add one to the
                {' '}<Link href="/services/wedding-convoy" className="underline hover:text-primary-600">convoy</Link> just for the session, or go open-top with the
                {' '}<Link href="/routes/convertible-convoy" className="underline hover:text-primary-600">convertible convoy experience</Link>.
              </p>
            </div>
          </section>
        </div>

        {/* Key Features */}
        <section className="py-16 bg-cream-100 dark:bg-gray-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-black dark:text-white mb-6">
              What&apos;s Included
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-warm-200 dark:border-gray-700">
                <h3 className="font-semibold text-lg text-black dark:text-white mb-2">
                  Chauffeur / Car Handler
                </h3>
                <p className="text-warm-600 dark:text-gray-400 leading-relaxed">
                  Drives you between locations and works with the photographer during the session — angles, repositions, headlights on cue.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-warm-200 dark:border-gray-700">
                <h3 className="font-semibold text-lg text-black dark:text-white mb-2">
                  Pre-Planned Photo Route
                </h3>
                <p className="text-warm-600 dark:text-gray-400 leading-relaxed">
                  A call with your photographer before the day settles locations, order, and light — no wedding-day improvising.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-warm-200 dark:border-gray-700">
                <h3 className="font-semibold text-lg text-black dark:text-white mb-2">
                  Polished &amp; Photo-Ready
                </h3>
                <p className="text-warm-600 dark:text-gray-400 leading-relaxed">
                  Polished the same morning — no stickers or ads on the car. Ribbon and florals can be added with the flower-decoration add-on, or left off for a clean look.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-warm-200 dark:border-gray-700">
                <h3 className="font-semibold text-lg text-black dark:text-white mb-2">
                  Flexible Booking Windows
                </h3>
                <p className="text-warm-600 dark:text-gray-400 leading-relaxed">
                  Photoshoot-only sessions or part of the wedding day — the classic works around your timeline.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-black dark:text-white mb-6">
              Frequently Asked Questions
            </h2>
            <FAQAccordion items={faqs} />
          </div>
        </section>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <section className="text-center bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl p-12 text-white">
            <h2 className="text-3xl font-bold text-white mb-4">
              One Car. One Golden Hour. Forever on the Wall.
            </h2>
            <p className="text-xl text-white mb-8">
              Ask which classics are available on your date
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/booking"
                className="inline-block bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold hover:bg-cream-100 transition-colors"
              >
                Check Availability
              </Link>
              <a
                href="https://wa.me/96170971841"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-[#25D366] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#1DA851] transition-colors"
              >
                WhatsApp Us
              </a>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
