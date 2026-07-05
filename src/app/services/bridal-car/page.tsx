import { Metadata } from 'next'
import Link from 'next/link'
import { generateMetadata as generateSeoMetadata } from '@/lib/seoManager'
import { ServiceSchema, FAQSchema } from '@/components/StructuredDataEnhanced'
import { FAQAccordion } from '@/components/Accordion'

export const metadata: Metadata = generateSeoMetadata({
  title: 'Bridal Car with Chauffeur in Lebanon - Wedding Car for the Bride',
  description: 'Rent a bridal car with a suited chauffeur in Lebanon. Dress-friendly seating, calm punctual service from the bride\'s prep to the venue entrance, and flower décor available as an add-on. All regions covered.',
  path: '/services/bridal-car',
})

export default function BridalCarPage() {
  const faqs = [
    {
      question: "Is the decoration included in the price?",
      answer: "The basic package comes without decoration. Flower decoration is an add-on — flowers and ribbons matched to your theme, fitted on the morning of the wedding — or we coordinate directly with your wedding florist so the car matches the bouquet exactly."
    },
    {
      question: "Will the car fit the wedding dress?",
      answer: "Yes — this is our specialty. We recommend cars by dress style: princess gowns need wide rear doors and flat floors, mermaid cuts ride better in higher seats. Tell us about the dress and we'll recommend the right car, and the chauffeur is trained to assist without touching the fabric."
    },
    {
      question: "How long do we have the car for?",
      answer: "It's one booking for the wedding day: the car arrives between 1 and 3pm, covers prep, ceremony, photos, and the venue entrance, then drops you off and leaves. Want it earlier or waiting until the last dance? The early-arrival and stay-till-the-end add-ons cover that."
    },
    {
      question: "Can the chauffeur pick up the groom separately first?",
      answer: "Yes. A common flow: the car takes the groom to the ceremony, then returns for the bride's grand departure. We fit the plan to your traditions, not the other way around."
    },
    {
      question: "What does the chauffeur wear?",
      answer: "A dark suit, white shirt, and tie by default. If your wedding has a color theme or dress code, tell us — we'll match it."
    },
    {
      question: "What if the car breaks down on the wedding day?",
      answer: "In years of running fleets across Lebanon it's almost never happened — but a backup plan always exists: a standby vehicle can reach any of our wedding routes, and the convoy cars can cover the bridal car in the worst case. You will get to your ceremony."
    }
  ]

  return (
    <>
      {/* Structured Data */}
      <ServiceSchema
        service={{
          name: "Bridal Car with Chauffeur",
          description: "Bridal car rental with professional suited chauffeur in Lebanon, from bridal prep to venue entrance",
          provider: "Eweeha",
          areaServed: "Lebanon",
          priceRange: "$250-$900"
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
              <p className="script-accent text-3xl text-primary-100 mb-4">for the bride…</p>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Bridal Car &amp; Chauffeur
              </h1>
              <p className="text-xl md:text-2xl text-white mb-8">
                One elegant car and one calm professional — dedicated to the couple all day
              </p>
              <Link
                href="/booking"
                className="inline-block bg-white text-primary-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-cream-100 transition-colors"
              >
                Book the Bridal Car
              </Link>
            </div>
          </div>
        </section>

        {/* Service Overview */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-black dark:text-white mb-6">
              The Calmest Seat at the Wedding
            </h2>
            <div className="max-w-none">
              <p className="text-black dark:text-gray-300 text-lg leading-relaxed mb-4">
                Between the salon, the photographer, the ceremony, and three hundred guests, the bridal car is the only quiet
                place a couple gets all day. We treat it that way: a spotless car with climate control set before
                you step in, water waiting, and a chauffeur who knows when to talk and when to just drive.
              </p>
              <p className="text-black dark:text-gray-300 text-lg leading-relaxed mb-4">
                Want the car dressed for the day? Add the flower-decoration add-on — flowers and ribbons in your colors,
                fitted the morning of the wedding and coordinated with your florist. Your chauffeur arrives at the prep
                location, plans the dress into the seating, and keeps a steady, gentle pace so hair, veil, and nerves all
                arrive intact.
              </p>
              <p className="text-black dark:text-gray-300 text-lg leading-relaxed">
                From the ceremony exit under the rice to the golden-hour photo stop to the venue&apos;s grand entrance, the same
                car and the same person stay dedicated to you for the whole route — in Beirut, on the coast, or up
                the mountain. Add convoy cars anytime through our <Link href="/services/wedding-convoy" className="underline hover:text-primary-600">full convoy service</Link>.
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
                  Flower Décor Add-on
                </h3>
                <p className="text-warm-600 dark:text-gray-400 leading-relaxed">
                  Flowers &amp; ribbons matched to your theme, fitted the morning of the wedding — coordinated with your florist so the car matches the bouquet.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-warm-200 dark:border-gray-700">
                <h3 className="font-semibold text-lg text-black dark:text-white mb-2">
                  Dress-First Logistics
                </h3>
                <p className="text-warm-600 dark:text-gray-400 leading-relaxed">
                  Car recommended by dress style, seating planned with your stylist, and a chauffeur trained to assist without ever touching the fabric.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-warm-200 dark:border-gray-700">
                <h3 className="font-semibold text-lg text-black dark:text-white mb-2">
                  Suited Professional Chauffeur
                </h3>
                <p className="text-warm-600 dark:text-gray-400 leading-relaxed">
                  Dark suit, discreet manner, wedding-day experience. Doors held, routes rehearsed, timing owned.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-warm-200 dark:border-gray-700">
                <h3 className="font-semibold text-lg text-black dark:text-white mb-2">
                  The Whole Route
                </h3>
                <p className="text-warm-600 dark:text-gray-400 leading-relaxed">
                  Prep, ceremony, photo stop, venue entrance — one car, one chauffeur. Want it waiting till the last dance? Add the stay-till-the-end add-on.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-warm-200 dark:border-gray-700">
                <h3 className="font-semibold text-lg text-black dark:text-white mb-2">
                  Photo-Stop Planning
                </h3>
                <p className="text-warm-600 dark:text-gray-400 leading-relaxed">
                  Golden-hour viewpoints, old streets, or the corniche — the stop is planned with your photographer before the day.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-warm-200 dark:border-gray-700">
                <h3 className="font-semibold text-lg text-black dark:text-white mb-2">
                  All Lebanon Covered
                </h3>
                <p className="text-warm-600 dark:text-gray-400 leading-relaxed">
                  Beirut, Jounieh, Byblos, Broummana, Aley, Faraya, the Chouf, the Bekaa, the South, the North — same standard everywhere.
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
              Reserve the Bridal Car
            </h2>
            <p className="text-xl text-white mb-8">
              Tell us your date, ceremony, and venue — we&apos;ll recommend the perfect car
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/booking"
                className="inline-block bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold hover:bg-cream-100 transition-colors"
              >
                Book Now
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
