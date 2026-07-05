import { Metadata } from 'next'
import Link from 'next/link'
import { generateMetadata as generateSeoMetadata } from '@/lib/seoManager'
import { LocalBusinessSchema } from '@/components/StructuredDataEnhanced'

export const metadata: Metadata = generateSeoMetadata({
  title: 'About Us - Wedding Car Rental in Lebanon',
  description: "Eweeha is Lebanon's wedding car specialist — decorated bridal cars, classics, convertibles, and full wedding convoys with suited chauffeurs, everywhere in Lebanon.",
  path: '/about',
})

export default function AboutPage() {
  return (
    <>
      {/* Structured Data for Local Business */}
      <LocalBusinessSchema
        name="Eweeha"
        description="Wedding car rental in Lebanon with suited chauffeurs — bridal cars, classics, convertibles, and full wedding convoys"
        telephone="+96170971841"
        address="Beirut, Lebanon"
        rating={4.8}
        reviewCount={127}
        priceRange="$250-$1500"
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
        <section className="py-20 bg-gray-100 dark:bg-gray-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800 dark:text-white">
              About Eweeha
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300">
              Lebanon&apos;s wedding car specialists — named after the tradition itself
            </p>
          </div>
        </section>

        {/* Our Story - White Background */}
        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-800 dark:text-white mb-8">
              Our Story
            </h2>
            <div className="space-y-6">
              <p className="text-lg text-gray-700 dark:text-gray-200 leading-relaxed">
                In Lebanon, the moment the bride steps out and the crowd erupts has a sound: <em>eweeha!</em> The decorated
                car at the family door, the convoy of loved ones behind it, the horns down the road, the zalghouta from the
                balconies — it&apos;s the moment the wedding truly begins. We named our company after it, because it&apos;s
                exactly what we deliver.
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-200 leading-relaxed">
                Eweeha was built by drivers and coordinators who have spent years on Lebanon&apos;s wedding roads — driving
                couples, families, and guests to ceremonies and venues in every region. We turned that
                experience into a dedicated wedding operation: decorated bridal cars, classics and convertibles for the
                photos, matching wedding convoys, and guest shuttles — all under one coordinator.
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-200 leading-relaxed">
                Today Eweeha serves weddings everywhere in Lebanon — Beirut ballrooms, Harissa ceremonies, Batroun&apos;s
                seaside weddings, mountain venues in Faqra and Broummana, vineyard weddings in the Bekaa, and the great summer
                weddings of the North and the South. One team, one timeline, zero stress on the biggest day of your life.
              </p>
            </div>
          </div>
        </section>

        {/* Why Choose Us - Gray Background */}
        <section className="py-16 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
              Why Choose Eweeha
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-2">
                  Wedding-Only Focus
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  This isn&apos;t a taxi company that also does weddings. Decoration, dress logistics, zaffe timing, photo staging — weddings are the whole job.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-2">
                  Suited Chauffeurs
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Experienced, licensed professionals in suits who know every wedding road in Lebanon — and how to hold a door for a wedding dress.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-2">
                  Transparent Pricing
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Clear per-car pricing with chauffeur and fuel included. The quote you approve is the price you pay — no wedding-day surprises.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-2">
                  One Coordinator
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Bridal car, convoy, photoshoot classic, and guest shuttles managed by one person on one timeline — yours.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-2">
                  Backup Guarantee
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Insured vehicles, maintained fleet, and a standby plan behind every booking. Whatever happens, you get to your ceremony on time.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-2">
                  Every Road in Lebanon
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Thousands of rides behind us — coastal highways, mountain switchbacks, and village lanes. If there&apos;s a wedding at the end of it, we&apos;ve driven it.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Service Areas - White Background */}
        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
              Service Coverage
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              Eweeha serves weddings in every region of Lebanon — each area with its own dedicated page, routes, and venues:
            </p>
            <div className="grid md:grid-cols-2 gap-4 text-gray-700 dark:text-gray-300">
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="mr-2 text-primary-600 dark:text-primary-400">✓</span>
                  <Link href="/routes/wedding-cars-beirut" className="hover:underline">Beirut &amp; Greater Beirut</Link>
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-primary-600 dark:text-primary-400">✓</span>
                  <Link href="/routes/wedding-cars-jounieh-harissa" className="hover:underline">Jounieh, Kaslik &amp; Harissa</Link>
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-primary-600 dark:text-primary-400">✓</span>
                  <Link href="/routes/wedding-cars-byblos-batroun" className="hover:underline">Byblos (Jbeil) &amp; Batroun</Link>
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-primary-600 dark:text-primary-400">✓</span>
                  <Link href="/routes/wedding-cars-broummana-metn" className="hover:underline">Broummana &amp; the Metn</Link>
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-primary-600 dark:text-primary-400">✓</span>
                  <Link href="/routes/wedding-cars-aley-bhamdoun" className="hover:underline">Aley, Bhamdoun &amp; Sawfar</Link>
                </li>
              </ul>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="mr-2 text-primary-600 dark:text-primary-400">✓</span>
                  <Link href="/routes/wedding-cars-faraya-faqra" className="hover:underline">Faraya, Faqra &amp; Kfardebian</Link>
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-primary-600 dark:text-primary-400">✓</span>
                  <Link href="/routes/wedding-cars-chouf-deir-el-qamar" className="hover:underline">The Chouf &amp; Deir el Qamar</Link>
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-primary-600 dark:text-primary-400">✓</span>
                  <Link href="/routes/wedding-cars-zahle-bekaa" className="hover:underline">Zahle, Baalbek &amp; the Bekaa</Link>
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-primary-600 dark:text-primary-400">✓</span>
                  <Link href="/routes/wedding-cars-north-lebanon" className="hover:underline">The North, up to Akkar</Link>
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-primary-600 dark:text-primary-400">✓</span>
                  <Link href="/routes/wedding-cars-saida-south" className="hover:underline">The South, down to Tyre</Link>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <section className="text-center rounded-xl p-12 bg-gray-50 dark:bg-gray-800">
            <h2 className="text-3xl font-bold mb-4 text-gray-800 dark:text-white">
              Ready to Book Your Wedding Car?
            </h2>
            <p className="text-xl mb-8 text-gray-600 dark:text-gray-300">
              Check your wedding date and get a quote in minutes
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/booking"
                className="inline-block px-8 py-3 rounded-md font-light transition-all hover:shadow-sm tracking-wider bg-gradient-to-br from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white border border-primary-700"
              >
                Book Now
              </Link>
              <Link
                href="/"
                className="inline-block px-8 py-3 rounded-md font-light transition-colors tracking-wider bg-transparent text-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 hover:border-gray-500"
              >
                View Our Fleet
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}

