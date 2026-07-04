import { Metadata } from 'next'
import Link from 'next/link'
import { generateMetadata as generateSeoMetadata } from '@/lib/seoManager'
import { ServiceSchema } from '@/components/StructuredDataEnhanced'
import { FAQAccordion } from '@/components/Accordion'

export const metadata: Metadata = generateSeoMetadata({
  title: 'Wedding Guest Shuttle in Lebanon - Vans & Minibuses for Guests',
  description: 'Wedding guest shuttle service in Lebanon: air-conditioned vans and minibuses moving guests between hotels, ceremony, and venue. Mountain venue transfers, late-night returns, and multi-pickup plans — one coordinator with your convoy.',
  path: '/services/guest-shuttle',
})

export default function GuestShuttlePage() {
  const faqs = [
    {
      question: "Why book a guest shuttle for a wedding?",
      answer: "Because half your guests don't know the mountain road, parking at Lebanese venues is a battle, and nobody should drive home after an open bar. Shuttles fix all three — guests arrive together, on time, and get home safely."
    },
    {
      question: "How many guests can you move?",
      answer: "From a single 10-seater van to a coordinated fleet of minibuses moving 200+ guests in waves. We plan pickup points (usually 1-3 hotels or meeting spots) and a return schedule that matches how Lebanese weddings actually end — late."
    },
    {
      question: "Who runs the shuttles on the day?",
      answer: "The same Eweeha team that runs your bridal car and convoy. One coordinator handles all of it, so the whole wedding moves as one plan — no juggling separate vendors."
    },
    {
      question: "Can shuttles run multiple rounds?",
      answer: "Yes — ceremony-to-venue waves right after, and staggered return departures at night (an early round for older guests, a late one for the dance floor survivors)."
    },
    {
      question: "Do you handle out-of-town and diaspora guests?",
      answer: "All the time. Airport pickups for arriving relatives, hotel-to-venue shuttles during the wedding weekend, and airport drop-offs after — we can quote the whole guest logistics package in one go."
    },
    {
      question: "How is pricing calculated?",
      answer: "Per vehicle, not per person — a van with driver and fuel included, priced by hours and route. Tell us guest count, hotels, ceremony, and venue, and we'll send a shuttle plan with exact pricing."
    }
  ]

  return (
    <>
      {/* Structured Data */}
      <ServiceSchema
        service={{
          name: "Wedding Guest Shuttle",
          description: "Wedding guest shuttle vans and minibuses in Lebanon, moving guests between hotels, ceremonies, and venues with coordinated timing",
          provider: "Eweeha",
          areaServed: "Lebanon",
          priceRange: "$200-$800"
        }}
      />

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
              <p className="script-accent text-3xl text-primary-100 mb-4">everyone makes it…</p>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Wedding Guest Shuttle
              </h1>
              <p className="text-xl md:text-2xl text-white mb-8">
                Vans and minibuses that move your guests between hotels, ceremony, and venue — and home safely at 3 a.m.
              </p>
              <Link
                href="/booking"
                className="inline-block bg-white text-primary-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-cream-100 transition-colors"
              >
                Plan Guest Transport
              </Link>
            </div>
          </div>
        </section>

        {/* Service Overview */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-black dark:text-white mb-6">
              The Unsung Hero of Every Great Wedding
            </h2>
            <div className="max-w-none">
              <p className="text-black dark:text-gray-300 text-lg leading-relaxed mb-4">
                The couple gets the convoy — but the wedding lives or dies on whether two hundred guests find the venue,
                park, and get home. Mountain venues with one narrow road, coastal venues with no parking, aunties who
                &quot;know a shortcut&quot;: Lebanese wedding logistics are real. Guest shuttles make them disappear.
              </p>
              <p className="text-black dark:text-gray-300 text-lg leading-relaxed mb-4">
                We run air-conditioned vans and minibuses in coordinated waves: hotel pickups before the ceremony,
                ceremony-to-venue transfers after, and staggered late-night returns so early leavers and dance-floor
                survivors each get their ride. Every vehicle has a professional driver who knows the route — because we
                drove it in advance.
              </p>
              <p className="text-black dark:text-gray-300 text-lg leading-relaxed">
                Shuttles run under the same roof as your
                {' '}<Link href="/services/wedding-convoy" className="underline hover:text-primary-600">convoy</Link> and
                {' '}<Link href="/services/bridal-car" className="underline hover:text-primary-600">bridal car</Link>.
                One coordinator, one timeline, one wedding that moves like clockwork.
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
                  Multi-Pickup Planning
                </h3>
                <p className="text-warm-600 dark:text-gray-400 leading-relaxed">
                  We map guest hotels and meeting points into an efficient pickup plan, with WhatsApp-ready schedule cards you can forward to guests.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-warm-200 dark:border-gray-700">
                <h3 className="font-semibold text-lg text-black dark:text-white mb-2">
                  Ceremony-to-Venue Waves
                </h3>
                <p className="text-warm-600 dark:text-gray-400 leading-relaxed">
                  Shuttles stage nearby during the ceremony and move guests to the venue in quick waves — cocktail hour starts full.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-warm-200 dark:border-gray-700">
                <h3 className="font-semibold text-lg text-black dark:text-white mb-2">
                  Late-Night Returns
                </h3>
                <p className="text-warm-600 dark:text-gray-400 leading-relaxed">
                  Staggered departures until the party ends. Nobody drives the mountain road at 3 a.m., and nobody gets stranded.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-warm-200 dark:border-gray-700">
                <h3 className="font-semibold text-lg text-black dark:text-white mb-2">
                  10 to 28 Seats per Vehicle
                </h3>
                <p className="text-warm-600 dark:text-gray-400 leading-relaxed">
                  Vans and minibuses sized to your guest list, all air-conditioned, all with professional drivers, fuel and tolls included.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Partner fleet */}
        <section className="py-12 bg-white dark:bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-cream-50 dark:bg-gray-800 border border-gold-400/50 rounded-xl p-8">
              <p className="text-[11px] tracking-[0.2em] uppercase text-gold-700 dark:text-gold-300 mb-2">
                Powered by our sister fleet
              </p>
              <h2 className="text-2xl font-bold text-black dark:text-white mb-3">
                Guest Shuttles Run with Beirut Vans
              </h2>
              <p className="text-warm-700 dark:text-gray-300 leading-relaxed mb-4">
                Our shuttle vans and minibuses are operated with{' '}
                <a
                  href="https://beirutvans.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline underline-offset-2 text-primary-700 dark:text-primary-300 hover:text-primary-800"
                >
                  Beirut Vans
                </a>
                , our sister company and Lebanon&apos;s van &amp; group-transport specialists. Their fleet moves
                groups across the country every day of the year — which means real capacity on any wedding
                date, drivers who already know every venue road, and one Eweeha coordinator connecting the
                shuttles to your convoy and bridal car.
              </p>
              <p className="text-warm-700 dark:text-gray-300 leading-relaxed">
                <span className="font-semibold text-primary-700 dark:text-primary-300">Bundle &amp; save:</span>{' '}
                book your wedding cars and guest shuttles together and the combined package costs less than
                booking them separately — ask us for a bundled quote on WhatsApp.
              </p>
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
              Get a Guest Transport Plan
            </h2>
            <p className="text-xl text-white mb-8">
              Send us guest count, hotels, ceremony, and venue — we&apos;ll reply with a full shuttle plan and price
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/booking"
                className="inline-block bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold hover:bg-cream-100 transition-colors"
              >
                Request a Plan
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
