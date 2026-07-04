'use client'

import { useState } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import Footer from '@/components/Footer'
import BackToTop from '@/components/BackToTop'
import Link from 'next/link'

interface FAQ {
  question: string
  answer: string
  category: string
}

interface FAQClientProps {
  faqs: FAQ[]
}

export default function FAQClient({ faqs }: FAQClientProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const categories = ['All', ...Array.from(new Set(faqs.map(f => f.category)))]

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // FAQPage JSON-LD is emitted once by the server page (faq/page.tsx) —
  // duplicating it here would ship two identical FAQPage entities.
  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-cream-50 to-white dark:from-gray-900 dark:to-gray-900">
        {/* Simple Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-warm-200 dark:border-gray-700 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-charcoal-500 dark:text-white mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-warm-600 dark:text-gray-400">
              Find answers to common questions about our wedding car service
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-3 mb-8">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-primary-700 dark:bg-primary-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:border-slate-400 dark:hover:border-gray-500'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* FAQ List */}
          <div className="space-y-4">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-soft overflow-hidden border border-transparent dark:border-gray-700">
                  <button
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-1 pr-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-semibold px-2 py-1 bg-warm-100 dark:bg-gray-700 text-charcoal-500 dark:text-gray-300 rounded">
                          {faq.category}
                        </span>
                      </div>
                      <h3 className="font-semibold text-charcoal-500 dark:text-white mt-2">{faq.question}</h3>
                    </div>
                    <ChevronDownIcon 
                      className={`h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform ${
                        openIndex === index ? 'rotate-180' : ''
                      }`} 
                    />
                  </button>
                  {/* Answer always in HTML for crawlers, visibility controlled by CSS/state */}
                  <div 
                    className={`px-6 pb-4 text-charcoal-500 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700 pt-4 ${
                      openIndex === index ? '' : 'hidden'
                    }`}
                  >
                      {faq.answer}
                    </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No questions found matching your search.</p>
              </div>
            )}
          </div>

          {/* Still Have Questions CTA */}
          <div className="mt-16 bg-gray-100 dark:bg-gray-800 rounded-md shadow-soft p-8 text-center border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Still have questions?</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Our team is here to help! Get in touch and we'll respond within 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="px-8 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors border border-gray-300 dark:border-gray-600"
              >
                Contact Us
              </Link>
              <a
                href="https://wa.me/96170971841"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 bg-[#25D366] text-white rounded-lg font-semibold hover:bg-[#1DA851] transition-colors"
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <BackToTop />
    </>
  )
}

