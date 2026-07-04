'use client'

import Link from 'next/link'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

interface ServiceCardProps {
  icon: string | React.ReactNode
  title: string
  excerpt: string
  link: string
  className?: string
}

export default function ServiceCard({ 
  icon, 
  title, 
  excerpt, 
  link, 
  className = '' 
}: ServiceCardProps) {
  return (
    <Link href={link}>
      <div className={`group bg-white dark:bg-gray-800 border border-warm-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg hover:border-primary-500 dark:hover:border-primary-400 transition-all duration-300 h-full flex flex-col ${className}`}>
        <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
          {typeof icon === 'string' ? icon : icon}
        </div>
        
        <h3 className="text-xl font-semibold text-charcoal-500 dark:text-white mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {title}
        </h3>
        
        <p className="text-warm-600 dark:text-gray-400 mb-4 flex-grow leading-relaxed">
          {excerpt}
        </p>
        
        <div className="flex items-center text-primary-600 dark:text-primary-400 font-medium group-hover:translate-x-1 transition-transform">
          Learn More
          <ArrowRightIcon className="w-4 h-4 ml-2" />
        </div>
      </div>
    </Link>
  )
}

/**
 * Service cards grid container
 */
interface ServiceCardsGridProps {
  children: React.ReactNode
  className?: string
}

export function ServiceCardsGrid({ children, className = '' }: ServiceCardsGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {children}
    </div>
  )
}

