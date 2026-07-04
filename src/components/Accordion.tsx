'use client'

import { useState } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

export interface AccordionItem {
  id: string
  title: string
  content: React.ReactNode
}

interface AccordionProps {
  items: AccordionItem[]
  defaultOpen?: string
  className?: string
}

export default function Accordion({ items, defaultOpen, className = '' }: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(
    defaultOpen ? new Set([defaultOpen]) : new Set()
  )

  const toggleItem = (id: string) => {
    setOpenItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((item) => {
        const isOpen = openItems.has(item.id)
        
        return (
          <div
            key={item.id}
            className="border border-warm-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 transition-all"
          >
            <button
              onClick={() => toggleItem(item.id)}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-warm-50 dark:hover:bg-gray-700 transition-colors"
              aria-expanded={isOpen}
            >
              <span className="font-semibold text-charcoal-500 dark:text-white pr-4">
                {item.title}
              </span>
              <ChevronDownIcon
                className={`w-5 h-5 text-warm-500 dark:text-gray-400 flex-shrink-0 transition-transform duration-200 ${
                  isOpen ? 'transform rotate-180' : ''
                }`}
              />
            </button>
            
            <div
              className={`overflow-hidden transition-all duration-200 ${
                isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="px-6 py-4 border-t border-warm-200 dark:border-gray-700 text-warm-700 dark:text-gray-300 leading-relaxed">
                {item.content}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Simple FAQ-specific accordion component
 */
interface FAQAccordionProps {
  items: Array<{
    question: string
    answer: string | React.ReactNode
  }>
  className?: string
}

export function FAQAccordion({ items, className = '' }: FAQAccordionProps) {
  const accordionItems: AccordionItem[] = items.map((item, index) => ({
    id: `faq-${index}`,
    title: item.question,
    content: typeof item.answer === 'string' ? <p>{item.answer}</p> : item.answer
  }))

  return <Accordion items={accordionItems} className={className} />
}

