import FAQClient from './FAQClient'
import { Metadata } from 'next'
import { generateMetadata as generateSeoMetadata } from '@/lib/seoManager'
import { sanitizeHtml } from '@/utils/sanitize'
import Breadcrumbs from '@/components/Breadcrumbs'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

// ISR: Revalidate every 6 hours
export const revalidate = 21600

interface FAQ {
  question: string
  answer: string
  answerHTML?: string
  category: string
}

interface FAQApiResponse {
  question: string
  answerHTML: string
  category?: string
}

async function loadFaqs(): Promise<FAQ[]> {
  const faqApiUrl = process.env.FAQ_API_URL
  
  // Try to fetch from API if configured
  if (faqApiUrl) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2000)
      
      const response = await fetch(faqApiUrl, {
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' }
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json() as FAQApiResponse[] | { faqs: FAQApiResponse[] }
        const faqs = Array.isArray(data) ? data : (data as { faqs: FAQApiResponse[] }).faqs || []
        
        if (faqs.length > 0) {
          return faqs.map(faq => ({
            question: faq.question,
            answer: sanitizeHtml(faq.answerHTML),
            category: faq.category || 'General',
          }))
        }
      }
    } catch (error) {
      console.warn('Failed to fetch FAQs from API, using fallback:', error)
    }
  }
  
  // Fallback to hardcoded FAQs
  return hardcodedFaqs
}

export async function generateMetadata(): Promise<Metadata> {
  const faqs = await loadFaqs()
  const baseMetadata = generateSeoMetadata({
    title: 'Lebanon Wedding Car Rental FAQs | Eweeha',
    description: 'Find answers to common questions about Eweeha wedding cars, driver services, pricing, and booking policies across Lebanon.',
    path: '/faq',
    noIndex: faqs.length === 0,
  })

  if (faqs.length === 0) {
    const robotsConfig = baseMetadata.robots

    if (isRecord(robotsConfig)) {
      const googleBotConfig = isRecord(robotsConfig.googleBot) ? robotsConfig.googleBot : {}

      return {
        ...baseMetadata,
        robots: {
          ...robotsConfig,
          follow: true,
          index: false,
          googleBot: {
            ...googleBotConfig,
            follow: true,
            index: false,
          },
        },
      }
    }

    return {
      ...baseMetadata,
      robots: {
        index: false,
        follow: true,
        googleBot: {
          index: false,
          follow: true,
        },
      },
    }
  }

  return baseMetadata
}

const hardcodedFaqs: FAQ[] = [
  // Booking Questions
  { 
    category: 'Booking',
    question: 'How do I book a wedding car?', 
    answer: 'Use our online booking form or message us on WhatsApp: tell us your wedding date, ceremony, and venue, pick your car, and confirm with a deposit. You\'ll receive confirmation right away, and we finalize the timeline with you before the big day.' 
  },
  { 
    category: 'Booking',
    question: 'How far in advance should we book our wedding cars?', 
    answer: 'For summer weddings (June-September) and Saturday dates, book 2-3 months ahead — the best cars go first. Off-season and weekday weddings can usually be arranged within a few weeks, and we accommodate last-minute requests when the fleet allows.' 
  },
  { 
    category: 'Booking',
    question: 'Can I modify or cancel my booking?', 
    answer: 'Yes. Dates, cars, and convoy size can be adjusted based on availability — just message us on WhatsApp. Cancellations follow the refund policy below; wedding date changes are treated as modifications, not cancellations, whenever we can accommodate the new date.' 
  },
  { 
    category: 'Booking',
    question: 'How does the wedding day work?', 
    answer: 'It\'s one day, one booking — no hourly packages. Our cars usually arrive between 1 and 3pm, drive the wedding route (prep, ceremony, photos, venue), drop you off at the venue, and leave. Need more? Add-ons cover it: early arrival (convoy by 11am), one or more cars staying till the end of the party, flower decoration, or an extra black luxury van.' 
  },
  { 
    category: 'Booking',
    question: 'What time do the cars arrive?', 
    answer: 'Standard arrival is between 1 and 3pm, timed with your ceremony. If you need the convoy earlier — for a morning zaffe or an early church — request the early-arrival add-on and we\'ll have the cars there by 11am.' 
  },

  // Payment Questions
  { 
    category: 'Payment',
    question: 'What payment methods do you accept?', 
    answer: 'We accept international credit/debit cards (Visa, Mastercard) via Stripe, OMT money transfer, bank transfer, and Whish Money. All payments are secure and encrypted.' 
  },
  { 
    category: 'Payment',
    question: 'Do we pay everything upfront?', 
    answer: 'A deposit locks your wedding date and cars; the balance is due before or on the wedding day. The exact split is shown on your quote before you commit.' 
  },
  { 
    category: 'Payment',
    question: 'Do you offer refunds?', 
    answer: 'Cancellations made 48+ hours before the booking receive a full refund. Cancellations 24-48 hours before receive 50%. Less than 24 hours: no refund. Wedding postponements are moved to the new date free of charge when availability allows. Processing time: 5-7 business days.' 
  },

  // Cars & Service Questions
  { 
    category: 'Cars & Decoration',
    question: 'What areas do you serve?', 
    answer: 'All of Lebanon: Beirut, Jounieh & Harissa, Byblos & Batroun, Broummana & the Metn, Aley & Bhamdoun, Faraya & Faqra, the Chouf, Zahle & the Bekaa (Baalbek included), the South (Saida, Maghdouche, Jezzine, Tyre, Nabatieh) and the North (Balamand, Ehden, Zgharta, Tripoli, Akkar). Same cars, same standard, everywhere.' 
  },
  { 
    category: 'Cars & Decoration',
    question: 'What\'s included with every wedding car?', 
    answer: 'A professional chauffeur in a suit, fuel, air conditioning, and a route scouted before the day. The cars arrive between 1 and 3pm, drive the full wedding route, and drop you off at the venue. Decoration, early arrival, and staying till the end are optional add-ons.' 
  },
  { 
    category: 'Cars & Decoration',
    question: 'Is the car decoration included?', 
    answer: 'The basic package comes without decoration — that keeps it simple and affordable. Flower decoration is an add-on: flowers and ribbons matched to your theme, fitted on the morning of the wedding. We can also coordinate directly with your florist.' 
  },
  { 
    category: 'Cars & Decoration',
    question: 'Do the cars have company stickers or ads on them?', 
    answer: 'No — and that\'s a promise. None of our cars carry stickers, logos, or advertising. Your photos and videos show a clean car, nothing else.' 
  },
  { 
    category: 'Cars & Decoration',
    question: 'Can we drive the car ourselves?', 
    answer: 'Our wedding cars are chauffeur-driven — it protects the car, the dress, and most importantly your timeline. Your chauffeur also handles staging the car for photos all day.' 
  },
  { 
    category: 'Cars & Decoration',
    question: 'Are your vehicles insured?', 
    answer: 'Yes, all our vehicles are fully insured with comprehensive coverage. Both the vehicle and passengers are covered throughout the wedding day.' 
  },
  { 
    category: 'Cars & Decoration',
    question: 'Can I request a specific car?', 
    answer: 'Yes — book the exact car from our fleet page. If it ever becomes unavailable for your date, we offer a similar or upgraded option, and for bridal cars we always keep a backup plan.' 
  },

  // Policies
  { 
    category: 'Policies',
    question: 'What if the car breaks down on the wedding day?', 
    answer: 'A standby plan exists behind every wedding booking: immediate roadside response and a replacement vehicle at no additional cost. In the worst case, convoy cars cover the bridal car — you will get to your ceremony on time.' 
  },
  { 
    category: 'Policies',
    question: 'Can a car stay until the end of the party?', 
    answer: 'Yes — that\'s the stay-till-the-end add-on. Normally the cars drop you off at the venue and leave; with this add-on, one or more cars (usually the bridal car) wait and drive you home after the last dance. Book it in advance, or ask on the day and we\'ll do our best, subject to availability.' 
  },
  { 
    category: 'Policies',
    question: 'Do you coordinate with our planner, zaffe, and photographer?', 
    answer: 'Yes — that\'s standard. We build the car timeline around the zaffe at the house, agree photo stops with your photographer, and share the final schedule with your planner the week of the wedding.' 
  },
  { 
    category: 'Policies',
    question: 'Can you also transport our guests?', 
    answer: 'Yes — guest shuttle vans and minibuses are coordinated with your convoy by the same team. Hotel pickups, ceremony-to-venue waves, and late-night returns included.' 
  },
  { 
    category: 'Policies',
    question: 'Do you handle engagement parties and baptisms too?', 
    answer: 'Yes — the same cars and chauffeurs are available for engagements, baptisms, and anniversary celebrations. Message us with the occasion and we\'ll recommend the right setup.' 
  },
]

export default async function FaqPage() {
  const faqs = await loadFaqs()
  
  // Generate FAQ schema for SEO
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }
  
  // If no FAQs available, show fallback message
  if (faqs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl md:text-5xl font-bold text-charcoal-500 dark:text-white mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-warm-600 dark:text-gray-400 mb-8">
            We're updating this page. Please{' '}
            <a href="/contact" className="text-primary-600 dark:text-primary-400 hover:underline">
              contact us
            </a>{' '}
            with any questions.
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Breadcrumbs />
      <FAQClient faqs={faqs} />
    </>
  )
}
