'use client'

import { useState, useEffect } from 'react'
import { ChevronUpIcon } from '@heroicons/react/24/outline'

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 500) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility, { passive: true })
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  if (!isVisible) return null

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-20 right-4 z-30 p-4 rounded-full shadow-lg hover:scale-110 focus:outline-none transition-all duration-300"
      style={{ backgroundColor: '#3D3935', color: '#ffffff', cursor: 'pointer' }}
      aria-label="Back to top"
    >
      <ChevronUpIcon className="h-6 w-6" />
    </button>
  )
}

