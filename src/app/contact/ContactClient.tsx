'use client'

import { useState } from 'react'
import { PhoneIcon, EnvelopeIcon, MapPinIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import Link from 'next/link'
import Footer from '@/components/Footer'

export default function ContactPageClient() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          toast.error('Too many submissions. Please wait before trying again.')
        } else {
          toast.error(data.error || 'Failed to send message')
        }
        return
      }

      if (data.success) {
        toast.success('Message sent! We\'ll get back to you within 24 hours.')
        // Reset form
        setFormData({ name: '', email: '', phone: '', message: '' })
      } else {
        toast.error('Failed to send message. Please try WhatsApp or call us directly.')
      }
    } catch (error) {
      console.error('Contact form error:', error)
      toast.error('Failed to send message. Please try WhatsApp or call us directly.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="min-h-screen bg-cream-50 dark:bg-gray-900">
        {/* Simple Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-warm-200 dark:border-gray-700 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-charcoal-500 dark:text-white mb-2">
              Get in Touch
            </h1>
            <p className="text-sm md:text-base text-warm-600 dark:text-gray-400">
              Questions? We're here to help
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white dark:bg-gray-800 border border-warm-200 dark:border-gray-700 rounded-md p-6">
              <h2 className="text-lg font-semibold text-charcoal-500 dark:text-white mb-4">Send a Message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-charcoal-500 dark:text-gray-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-warm-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm rounded focus:ring-1 focus:ring-warm-500 dark:focus:ring-primary-500 focus:border-warm-500 dark:focus:border-primary-500 transition-colors"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-charcoal-500 dark:text-gray-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-warm-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm rounded focus:ring-1 focus:ring-warm-500 dark:focus:ring-primary-500 focus:border-warm-500 dark:focus:border-primary-500 transition-colors"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-charcoal-500 dark:text-gray-300 mb-2">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-warm-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm rounded focus:ring-1 focus:ring-warm-500 dark:focus:ring-primary-500 focus:border-warm-500 dark:focus:border-primary-500 transition-colors"
                    placeholder="+961-70-971-841"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-charcoal-500 dark:text-gray-300 mb-2">
                    Your Message *
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-warm-500 dark:focus:ring-primary-500 focus:border-warm-500 dark:focus:border-primary-500 transition-all resize-none"
                    placeholder="Tell us how we can help you..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-br from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white border border-primary-700 py-4 px-6 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              {/* Contact Methods */}
              <div className="bg-white dark:bg-gray-800 rounded-md shadow-soft p-8">
                <h2 className="text-2xl font-bold text-charcoal-500 dark:text-white mb-6">Contact Information</h2>
                
                <div className="space-y-6">
                  {/* Phone */}
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-warm-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <PhoneIcon className="h-6 w-6 text-charcoal-500 dark:text-gray-300" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-charcoal-500 dark:text-white mb-1">Phone</h3>
                      <a 
                        href="tel:+96170971841" 
                        className="text-slate-600 dark:text-gray-300 hover:text-charcoal-600 dark:hover:text-white transition-colors"
                      >
                        +961-70-971-841
                      </a>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Available 24/7</p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-warm-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <EnvelopeIcon className="h-6 w-6 text-charcoal-500 dark:text-gray-300" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-charcoal-500 dark:text-white mb-1">Email</h3>
                      <a 
                        href="mailto:eweehalebanon@gmail.com" 
                        className="text-slate-600 dark:text-gray-300 hover:text-charcoal-600 dark:hover:text-white transition-colors"
                      >
                        eweehalebanon@gmail.com
                      </a>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">We respond within 24 hours</p>
                    </div>
                  </div>

                  {/* WhatsApp */}
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-[#25D366]/15 dark:bg-[#25D366]/20 rounded-lg flex items-center justify-center">
                        <ChatBubbleLeftRightIcon className="h-6 w-6 text-[#128C7E] dark:text-[#25D366]" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-charcoal-500 dark:text-white mb-1">WhatsApp</h3>
                      <a 
                        href="https://wa.me/96170971841" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-600 dark:text-gray-300 hover:text-charcoal-600 dark:hover:text-white transition-colors"
                      >
                        Chat with us instantly
                      </a>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Fastest response time</p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-warm-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <MapPinIcon className="h-6 w-6 text-charcoal-500 dark:text-gray-300" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-charcoal-500 dark:text-white mb-1">Location</h3>
                      <p className="text-slate-600 dark:text-gray-300">Beirut, Lebanon</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Serving all of Lebanon</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Operating Hours */}
              <div className="bg-gray-100 dark:bg-gray-800 rounded-md shadow-soft p-8">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Operating Hours</h2>
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-700 dark:text-gray-200">
                    <span>Monday - Friday</span>
                    <span className="font-semibold">24/7</span>
                  </div>
                  <div className="flex justify-between text-gray-700 dark:text-gray-200">
                    <span>Saturday - Sunday</span>
                    <span className="font-semibold">24/7</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      We're always available for bookings and emergencies
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-4">
                <a
                  href="https://wa.me/96170971841"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center px-6 py-4 bg-gradient-to-br from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white border border-primary-700 rounded-lg transition-all font-semibold"
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                  WhatsApp
                </a>
                <a
                  href="tel:+96170971841"
                  className="flex items-center justify-center px-6 py-4 bg-clay-400 text-white rounded-lg hover:bg-clay-500 transition-colors font-semibold"
                >
                  <PhoneIcon className="h-5 w-5 mr-2" />
                  Call Now
                </a>
              </div>
            </div>
          </div>

          {/* Map Section */}
          <div className="mt-16">
            <div className="bg-white dark:bg-gray-800 rounded-md shadow-soft overflow-hidden">
              <div className="aspect-video bg-gray-200 dark:bg-gray-700 relative">
                {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
                  <iframe
                    src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=Beirut,Lebanon&center=33.8938,35.5018&zoom=12`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Eweeha Service Area - Lebanon"
                    className="absolute inset-0"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-700 dark:to-gray-800">
                    <div className="text-center">
                      <MapPinIcon className="h-16 w-16 text-slate-400 dark:text-gray-500 mx-auto mb-4" />
                      <p className="text-warm-600 dark:text-gray-300 font-medium">Beirut, Lebanon</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Serving all regions of Lebanon</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
