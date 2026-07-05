import { Metadata } from 'next'
import Link from 'next/link'
import { generateMetadata as generateSeoMetadata } from '@/lib/seoManager'
import { ServiceSchema, FAQSchema } from '@/components/StructuredDataEnhanced'
import { FAQAccordion } from '@/components/Accordion'

export const metadata: Metadata = generateSeoMetadata({
  title: 'Wedding Convoy in Lebanon - Full Wedding Car Convoy',
  description: 'Book a full wedding convoy in Lebanon: decorated bridal car, family cars, and groomsmen vehicles moving as one convoy with suited chauffeurs. Route planning, zaffe timing, and ceremony arrivals handled across all Lebanon.',
  path: '/services/wedding-convoy',
})

export default function WeddingConvoyPage() {
  const faqs = [
    {
      question: "What exactly is included in a wedding convoy booking?",
      answer: "A decorated lead car for the couple plus as many matching convoy cars as you need for parents, bridesmaids, and groomsmen. Every car comes with a suited chauffeur and fuel included. We brief all drivers on the route, order, and timing before the day."
    },
    {
      question: "How many cars can the convoy include?",
      answer: "From a single bridal car up to convoys of 10+ vehicles for big family weddings. We match the cars so the convoy looks unified in your photos and videos."
    },
    {
      question: "How do you keep the convoy together in Lebanese traffic?",
      answer: "Every chauffeur gets the route in advance, drives in an agreed order with set spacing, and stays connected on a group channel. If a light splits the convoy, the lead car adjusts pace so the convoy regroups before the arrival."
    },
    {
      question: "Do you coordinate with the zaffe and the videographer?",
      answer: "Yes — that's the heart of the service. We time the departure around the zaffe at the house, and we agree the arrival angle and stopping mark with your videographer so the grand entrance is captured perfectly."
    },
    {
      question: "Can the convoy do the traditional honking celebration?",
      answer: "Of course — it wouldn't be a Lebanese wedding without it. We do it proudly and safely: the celebration happens on suitable roads, with spacing and speed agreed in advance."
    },
    {
      question: "How far in advance should we book?",
      answer: "For summer weddings (June to September), we recommend 2-3 months ahead — Saturdays go fast. Off-season weddings can usually be arranged within a few weeks. Your date is locked with a deposit."
    }
  ]

  return (
    <>
      {/* Structured Data */}
      <ServiceSchema
        service={{
          name: "Wedding Convoy",
          description: "Full wedding car convoy service in Lebanon: decorated bridal car, matching family cars, suited chauffeurs, route planning, and zaffe-coordinated timing",
          provider: "Eweeha",
          areaServed: "Lebanon",
          priceRange: "$250-$1500"
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
              <p className="script-accent text-3xl text-primary-100 mb-4">el convoy jeye…</p>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                The Wedding Convoy
              </h1>
              <p className="text-xl md:text-2xl text-white mb-8">
                Your whole wedding moving as one — from the family home to the ceremony to the venue
              </p>
              <Link
                href="/booking"
                className="inline-block bg-white text-primary-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-cream-100 transition-colors"
              >
                Plan My Convoy
              </Link>
            </div>
          </div>
        </section>

        {/* Service Overview */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-black dark:text-white mb-6">
              The Convoy Is the Celebration
            </h2>
            <div className="max-w-none">
              <p className="text-black dark:text-gray-300 text-lg leading-relaxed mb-4">
                In Lebanon, the wedding doesn&apos;t start at the ceremony — it starts the moment the convoy pulls up at the family
                home. The decorated lead car, the convoy of family and friends behind it, the horns, the zalghouta from the
                balcony: it&apos;s the most Lebanese moment of the whole day. Eweeha exists to make that moment perfect.
              </p>
              <p className="text-black dark:text-gray-300 text-lg leading-relaxed mb-4">
                We provide the decorated bridal car and matching convoy cars, each with a professional chauffeur in a suit.
                Before the day, we scout your route — home, ceremony, photo stop, venue — and build a timeline around your
                ceremony slot, your zaffe, and your photographer&apos;s plan. On the day, the convoy moves in formation, arrives
                on time, and stages itself for the photos without anyone having to think about it.
              </p>
              <p className="text-black dark:text-gray-300 text-lg leading-relaxed">
                We run convoys everywhere in Lebanon: through Beirut&apos;s streets to <Link href="/routes/wedding-cars-beirut" className="underline hover:text-primary-600">Achrafieh and downtown Beirut</Link>,
                up the hill to <Link href="/routes/wedding-cars-jounieh-harissa" className="underline hover:text-primary-600">Harissa</Link>, along the coast to
                {' '}<Link href="/routes/wedding-cars-byblos-batroun" className="underline hover:text-primary-600">Byblos and Batroun</Link>, and into the mountains from
                {' '}<Link href="/routes/wedding-cars-broummana-metn" className="underline hover:text-primary-600">Broummana</Link> to
                {' '}<Link href="/routes/wedding-cars-faraya-faqra" className="underline hover:text-primary-600">Faqra</Link>.
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
                  Decorated Lead Car
                </h3>
                <p className="text-warm-600 dark:text-gray-400 leading-relaxed">
                  The bridal car dressed with ribbons and fresh flowers matched to your bouquet and color theme — spotless, photographed-ready.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-warm-200 dark:border-gray-700">
                <h3 className="font-semibold text-lg text-black dark:text-white mb-2">
                  Matching Convoy Cars
                </h3>
                <p className="text-warm-600 dark:text-gray-400 leading-relaxed">
                  Family and groomsmen cars selected to match the lead car, so the convoy looks unified in every drone shot and video frame.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-warm-200 dark:border-gray-700">
                <h3 className="font-semibold text-lg text-black dark:text-white mb-2">
                  Route Scouting &amp; Timing
                </h3>
                <p className="text-warm-600 dark:text-gray-400 leading-relaxed">
                  We drive your route in advance, plan for traffic and roadworks, and build buffers around the ceremony slot. You will not be late.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-warm-200 dark:border-gray-700">
                <h3 className="font-semibold text-lg text-black dark:text-white mb-2">
                  Zaffe Coordination
                </h3>
                <p className="text-warm-600 dark:text-gray-400 leading-relaxed">
                  Departure timed around the zaffe at the house, so the drums, the goodbyes, and the convoy roll-out hit the same beat.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-warm-200 dark:border-gray-700">
                <h3 className="font-semibold text-lg text-black dark:text-white mb-2">
                  Suited Chauffeurs
                </h3>
                <p className="text-warm-600 dark:text-gray-400 leading-relaxed">
                  Every car driven by a professional in a suit who knows wedding days: doors held, dress protected, calm under pressure.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-warm-200 dark:border-gray-700">
                <h3 className="font-semibold text-lg text-black dark:text-white mb-2">
                  The Grand Arrival
                </h3>
                <p className="text-warm-600 dark:text-gray-400 leading-relaxed">
                  Arrival angle, speed, and stopping mark agreed with your videographer — the venue entrance becomes a scene, not a drop-off.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-16 bg-cream-100 dark:bg-gray-800">
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
              Your Date Is Getting Booked
            </h2>
            <p className="text-xl text-white mb-8">
              Summer Saturdays go first — check availability for your wedding date now
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/booking"
                className="inline-block bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold hover:bg-cream-100 transition-colors"
              >
                Check My Date
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
