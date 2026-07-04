'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import {
  MapPinIcon,
  CalendarIcon,
  UsersIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import PhoneInput from '@/components/PhoneInput'
import { useConfig } from '@/hooks/useConfig'
import { events } from '@/lib/posthog'

type ServiceType = '6h' | '10h' | 'full-day'

interface DayService {
  id: string
  date: string
  serviceType: ServiceType
}

interface RentalRequestFormProps {
  className?: string
}

export default function RentalRequestForm({ className = '' }: RentalRequestFormProps) {
  const { appConfig } = useConfig()

  // Form state
  const [dayServices, setDayServices] = useState<DayService[]>([])
  const [startingLocation, setStartingLocation] = useState('')
  const [passengers, setPassengers] = useState<number | ''>('')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')

  // Set minimum date to today
  const today = format(new Date(), 'yyyy-MM-dd')

  // Add a new day
  const addDay = () => {
    const newId = `day-${Date.now()}`
    // Default to tomorrow or the day after the last selected date
    let defaultDate = format(new Date(), 'yyyy-MM-dd') // Use fresh today
    
    if (dayServices.length > 0) {
      const lastDate = dayServices[dayServices.length - 1].date
      if (lastDate) {
        // Parse date parts to avoid timezone issues
        const [year, month, day] = lastDate.split('-').map(Number)
        const next = new Date(year, month - 1, day + 1) // month is 0-indexed
        defaultDate = format(next, 'yyyy-MM-dd')
      }
    } else {
      // First day: default to tomorrow
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      defaultDate = format(tomorrow, 'yyyy-MM-dd')
    }
    
    setDayServices(prev => [...prev, { id: newId, date: defaultDate, serviceType: '10h' }])
  }

  // Remove a day
  const removeDay = (id: string) => {
    setDayServices(prev => prev.filter(d => d.id !== id))
  }

  // Update a day's date
  const updateDayDate = (id: string, date: string) => {
    setDayServices(prev => 
      prev.map(d => d.id === id ? { ...d, date } : d)
    )
  }

  // Update a day's service type
  const updateDayService = (id: string, serviceType: ServiceType) => {
    setDayServices(prev => 
      prev.map(d => d.id === id ? { ...d, serviceType } : d)
    )
  }

  // Check for duplicate dates
  const hasDuplicates = () => {
    const dates = dayServices.map(d => d.date).filter(d => d)
    return new Set(dates).size !== dates.length
  }

  // Format schedule for display/messages
  const formatScheduleSummary = () => {
    if (dayServices.length === 0) return ''
    
    const serviceLabels: Record<ServiceType, string> = {
      '6h': '6h',
      '10h': '10h',
      'full-day': 'Full Day'
    }
    
    // Sort by date and format
    const sorted = [...dayServices].sort((a, b) => a.date.localeCompare(b.date))
    return sorted.map(d => {
      try {
        return `${format(parseISO(d.date), 'MMM d')}: ${serviceLabels[d.serviceType]}`
      } catch {
        return `${d.date}: ${serviceLabels[d.serviceType]}`
      }
    }).join(', ')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (dayServices.length === 0) {
      toast.error('Please add at least one day')
      return
    }
    
    const emptyDates = dayServices.some(d => !d.date)
    if (emptyDates) {
      toast.error('Please select a date for all days')
      return
    }
    
    if (hasDuplicates()) {
      toast.error('Please remove duplicate dates')
      return
    }
    
    if (!startingLocation) {
      toast.error('Please enter your starting location')
      return
    }
    if (!phone) {
      toast.error('Please enter your phone number')
      return
    }
    if (!passengers || passengers < 1) {
      toast.error('Please enter number of passengers')
      return
    }

    // Sort days by date for submission
    const sortedDays = [...dayServices].sort((a, b) => a.date.localeCompare(b.date))

    // Prepare data
    const requestData = {
      dayServices: sortedDays.map(d => ({ date: d.date, serviceType: d.serviceType })),
      schedule: formatScheduleSummary(),
      startingLocation,
      passengers: Number(passengers),
      customerName: customerName.trim() || undefined,
      customerEmail: customerEmail.trim() || undefined,
      phone,
      notes: notes || 'No additional notes',
      status: 'pending',
      requestedAt: new Date().toISOString()
    }

    // Show toast immediately (optimistic UI)
    const whatsappNumber = appConfig?.contact?.whatsapp || '96170971841'
    const scheduleSummary = formatScheduleSummary()
    const message = `Hi, I just submitted a wedding car rental request:\n\nSchedule: ${scheduleSummary}\nStarting from: ${startingLocation}\nPassengers: ${passengers}\n\nCan you send me a quote?`
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    
    toast.custom(
      (t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden max-w-sm`}>
          {/* Success header */}
          <div className="bg-gradient-to-r from-primary-700 to-primary-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-sm">Request Received!</p>
                <p className="text-xs text-white/80">We&apos;ll contact you within 30 minutes</p>
              </div>
            </div>
          </div>
          
          {/* WhatsApp CTA */}
          <div className="p-4">
            <p className="text-gray-700 text-sm mb-3">
              💬 Need a faster response? Chat with us directly!
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  events.whatsappClicked('quote_form')
                  window.open(whatsappUrl, '_blank')
                  toast.dismiss(t.id)
                }}
                className="flex-1 bg-[#25D366] hover:bg-[#1da851] text-white text-sm font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Chat on WhatsApp
              </button>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="px-4 py-2.5 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      ),
      {
        duration: 8000,
        position: 'top-center',
      }
    )

    // Track event
    events.quoteRequested(
      `${dayServices.length} day rental`,
      Number(passengers),
      startingLocation,
      sortedDays[0]?.date || ''
    )

    // Reset form immediately
    setDayServices([])
    setStartingLocation('')
    setPassengers('')
    setPhone('')
    setNotes('')

    // Send to backend in background (don't await)
    fetch('/api/bookings/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    }).catch(error => {
      console.error('Background request submission error:', error)
    })
  }

  const handleWhatsAppDirect = () => {
    const whatsappNumber = appConfig?.contact?.whatsapp || '96170971841'
    const message = dayServices.length > 0 && startingLocation
      ? `Hi, I need a wedding car rental:\n\nSchedule: ${formatScheduleSummary()}\nStarting from: ${startingLocation}\nPassengers: ${passengers}\n\nCan you send me a quote?`
      : `Hi, I need a wedding car rental. Can you help me with pricing and availability?`
    
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const handleBookOnline = () => {
    // Build URL params from current form state
    const params = new URLSearchParams()
    
    if (dayServices.length > 0) {
      // Sort days by date
      const sortedDays = [...dayServices].sort((a, b) => a.date.localeCompare(b.date))
      
      // Set start and end dates
      const firstDate = sortedDays[0]?.date
      const lastDate = sortedDays[sortedDays.length - 1]?.date
      
      if (firstDate) params.set('startDate', firstDate)
      if (lastDate) params.set('endDate', lastDate)
      
      // Always pass hours - use the most common service type
      const hoursMap: Record<ServiceType, string> = { '6h': '6', '10h': '10', 'full-day': '24' }
      const serviceCounts = sortedDays.reduce((acc, d) => {
        acc[d.serviceType] = (acc[d.serviceType] || 0) + 1
        return acc
      }, {} as Record<ServiceType, number>)
      const dominantService = (Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '10h') as ServiceType
      params.set('hours', hoursMap[dominantService])
      
      // Check if all days have the same service type
      const allSameService = sortedDays.every(d => d.serviceType === sortedDays[0].serviceType)
      if (!allSameService) {
        params.set('mixedHours', 'true')
      }
      
      // Pass the full schedule for reference
      params.set('schedule', JSON.stringify(sortedDays.map(d => ({ date: d.date, serviceType: d.serviceType }))))
    }
    
    if (passengers && passengers > 0) {
      params.set('passengers', String(passengers))
    }
    
    if (startingLocation) {
      params.set('location', startingLocation)
    }
    
    if (phone) {
      params.set('phone', phone)
    }
    
    // Navigate to booking page with params
    const url = `/booking${params.toString() ? '?' + params.toString() : ''}`
    window.location.href = url
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header - Compact */}
      <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border-b border-gray-100 dark:border-gray-700 p-4">
        <h2 className="text-xl sm:text-2xl font-normal mb-1 text-gray-900 dark:text-white">Request a Wedding Car Rental</h2>
        <p className="text-xs opacity-80 leading-relaxed font-light text-gray-700 dark:text-gray-300">
          Get a quote within 15 minutes
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-3">
        {/* Days Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            <CalendarIcon className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
            Select Your Days *
          </label>
          
          {/* Day rows */}
          <div className="space-y-2">
            {dayServices.map((day) => (
              <div key={day.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                {/* Date picker */}
                <input
                  type="date"
                  value={day.date}
                  onChange={(e) => updateDayDate(day.id, e.target.value)}
                  min={today}
                  className="flex-1 min-w-0 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-[#742F38] focus:border-[#742F38] transition-all dark:bg-gray-800 dark:text-white"
                  required
                />
                
                {/* Service type buttons */}
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => updateDayService(day.id, '6h')}
                    className={`px-2 py-1.5 text-xs rounded-md transition-all ${
                      day.serviceType === '6h'
                        ? 'bg-[#742F38] text-white dark:bg-primary-600'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    6h
                  </button>
                  <button
                    type="button"
                    onClick={() => updateDayService(day.id, '10h')}
                    className={`px-2 py-1.5 text-xs rounded-md transition-all ${
                      day.serviceType === '10h'
                        ? 'bg-[#742F38] text-white dark:bg-primary-600'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    10h
                  </button>
                  <button
                    type="button"
                    onClick={() => updateDayService(day.id, 'full-day')}
                    className={`px-2 py-1.5 text-xs rounded-md transition-all ${
                      day.serviceType === 'full-day'
                        ? 'bg-[#742F38] text-white dark:bg-primary-600'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    Full
                  </button>
                </div>
                
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeDay(day.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0"
                  title="Remove day"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add day button */}
          <button
            type="button"
            onClick={addDay}
            className="mt-2 w-full py-2 px-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-600 dark:text-gray-300 hover:border-[#742F38] hover:text-[#742F38] dark:hover:border-primary-400 dark:hover:text-primary-300 transition-colors flex items-center justify-center gap-1"
          >
            <PlusIcon className="w-4 h-4" />
            Add a day
          </button>
          
          {/* Duplicate warning */}
          {hasDuplicates() && (
            <p className="mt-1 text-xs text-red-500 dark:text-red-400">
              Warning: You have duplicate dates selected
            </p>
          )}
        </div>

        {/* Starting Location - Compact */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
            <MapPinIcon className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
            Starting Location *
          </label>
          <input
            type="text"
            value={startingLocation}
            onChange={(e) => setStartingLocation(e.target.value)}
            placeholder="e.g. Hamra, Airport, Jounieh"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-[#742F38] focus:border-[#742F38] transition-all dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            required
          />
        </div>

        {/* Passengers - Full width for clarity */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
              <UsersIcon className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
              Number of Passengers *
            </label>
            <input
              type="number"
              value={passengers}
              onChange={(e) => {
                const val = e.target.value
                setPassengers(val === '' ? '' : parseInt(val))
              }}
              onFocus={(e) => e.target.select()}
              placeholder="1"
              min="1"
              max="28"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-[#742F38] focus:border-[#742F38] transition-all dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

        {/* Contact details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
              Your name (optional)
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Full name"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-[#742F38] focus:border-[#742F38] transition-all dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
              Email (optional)
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="For quote by email"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-[#742F38] focus:border-[#742F38] transition-all dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Phone - Full width for country selector */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
            <PhoneIcon className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
            Phone or WhatsApp *
          </label>
          <PhoneInput
            value={phone}
            onChange={setPhone}
            placeholder="+961 XX XXX XXX"
            required
          />
        </div>

        {/* Trip Notes (Optional) - Compact */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
            Trip Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Planned stops (e.g. Byblos, Batroun)"
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-[#742F38] focus:border-[#742F38] transition-all resize-none dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          />
        </div>

        {/* Submit Buttons - Compact with 3 options */}
        <div className="space-y-2 pt-1">
          <button
            type="submit"
            className="w-full bg-gradient-to-br from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-light py-2.5 px-5 rounded-md transition-all duration-200 hover:shadow-sm flex items-center justify-center gap-2 text-sm tracking-wider border border-primary-700"
          >
            <span>Get My Quote</span>
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleBookOnline}
              className="bg-transparent hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-light py-2.5 px-4 rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 text-xs tracking-wider border border-primary-400 dark:border-primary-500"
            >
              <span>Book & Pay Online</span>
            </button>
            <button
              type="button"
              onClick={handleWhatsAppDirect}
              className="bg-transparent hover:bg-[#25D366]/10 dark:hover:bg-[#25D366]/20 text-[#128C7E] dark:text-[#25D366] font-light py-2.5 px-4 rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 text-xs tracking-wider border border-[#25D366] dark:border-[#25D366]"
            >
              <ChatBubbleLeftRightIcon className="w-3 h-3" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>

        <p className="text-[10px] text-center text-gray-500 dark:text-gray-400 mt-2">
          We respond within 15 minutes. Changes welcomed.
        </p>
      </form>
    </div>
  )
}

