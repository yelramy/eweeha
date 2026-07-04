'use client'

import { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  CalendarDaysIcon,
  UserIcon,
  CreditCardIcon,
  ChevronLeftIcon,
  TruckIcon,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import Footer from '@/components/Footer'
import PhoneInput from '@/components/PhoneInput'
import { events } from '@/lib/posthog'
import Breadcrumbs from '@/components/Breadcrumbs'
import { Vehicle, VehicleVariant } from '@/types/vehicle'
import {
  calculateRentalPricing,
  calculateRentalDays,
  recommendVehiclesByCapacity,
  DEFAULT_BOOKING_CONFIG
} from '@/utils/bookingUtils'
import { PricingBreakdown } from '@/types/booking'
import BookingSSRFallback from './BookingSSRFallback'

const STEPS = [
  { id: 'dates', title: 'Select Dates', icon: CalendarDaysIcon },
  { id: 'passengers', title: 'Passengers & Luggage', icon: UsersIcon },
  { id: 'vehicle', title: 'Choose Vehicle', icon: TruckIcon },
  { id: 'hours', title: 'Hours per Day', icon: ClockIcon },
  { id: 'extras', title: 'Extras', icon: CheckCircleIcon },
  { id: 'details', title: 'Your Details', icon: UserIcon },
  { id: 'payment', title: 'Payment', icon: CreditCardIcon }
]

function SimplifiedBookingPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Schedule type for per-day pricing
  type DaySchedule = { date: string; serviceType: '6h' | '10h' | 'full-day' }
  
  // Form state
  const [currentStep, setCurrentStep] = useState(0)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [hoursPerDay, setHoursPerDay] = useState<6 | 10 | 24 | null>(null)
  const [daySchedule, setDaySchedule] = useState<DaySchedule[]>([]) // Per-day schedule from form
  const [passengerCount, setPassengerCount] = useState(1)
  const [luggageCount, setLuggageCount] = useState(0)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<VehicleVariant | null>(null)
  const [selectedExtras, setSelectedExtras] = useState<string[]>([])
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '' })
  const [emailError, setEmailError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)

  // Data
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [recommendedVehicles, setRecommendedVehicles] = useState<Vehicle[]>([])
  const [pricing, setPricing] = useState<PricingBreakdown | null>(null)
  const [loading, setLoading] = useState(true)
  const [showStartOverModal, setShowStartOverModal] = useState(false)
  const [urlParamsProcessed, setUrlParamsProcessed] = useState(false)
  const [skipVehicleStep, setSkipVehicleStep] = useState(false)

  // Calculate rental days (use daySchedule length if available)
  const rentalDays = daySchedule.length > 0 ? daySchedule.length : (startDate && endDate ? calculateRentalDays(startDate, endDate) : 0)

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Handle email change with validation
  const handleEmailChange = (email: string) => {
    setCustomer({ ...customer, email })
    if (email && !validateEmail(email)) {
      setEmailError('Please enter a valid email address')
    } else {
      setEmailError('')
    }
  }

  // Fetch vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await fetch('/api/vehicles')
        const data = await res.json()
        if (data.success) {
          setVehicles(data.data.filter((v: Vehicle) => v.available))
        }
      } catch (error) {
        console.error('Failed to fetch vehicles:', error)
        toast.error('Failed to load vehicles')
      } finally {
        setLoading(false)
      }
    }
    fetchVehicles()
  }, [])

  // Track if we should skip hours step
  const [skipHoursStep, setSkipHoursStep] = useState(false)

  // Process URL parameters immediately (non-vehicle params)
  useEffect(() => {
    if (urlParamsProcessed) return

    const urlStartDate = searchParams.get('startDate')
    const urlEndDate = searchParams.get('endDate')
    const urlHours = searchParams.get('hours')
    const urlPassengers = searchParams.get('passengers')
    const urlPhone = searchParams.get('phone')
    const urlVehicle = searchParams.get('vehicle')
    const urlSchedule = searchParams.get('schedule')
    
    const prefilledFields: string[] = []
    let shouldProcess = false
    
    // Parse schedule if available (for per-day pricing)
    if (urlSchedule) {
      try {
        const schedule = JSON.parse(urlSchedule) as DaySchedule[]
        if (Array.isArray(schedule) && schedule.length > 0) {
          setDaySchedule(schedule)
          prefilledFields.push('schedule')
          shouldProcess = true
        }
      } catch (e) {
        console.error('Failed to parse schedule:', e)
      }
    }

    // Pre-fill dates immediately
    if (urlStartDate && urlEndDate) {
      setStartDate(urlStartDate)
      setEndDate(urlEndDate)
      prefilledFields.push('dates')
      shouldProcess = true
    }

    // Pre-fill passengers if provided
    if (urlPassengers) {
      const passengers = parseInt(urlPassengers)
      if (passengers > 0) {
        setPassengerCount(passengers)
        prefilledFields.push('passengers')
        shouldProcess = true
      }
    }

    // Pre-fill hours per day if provided
    if (urlHours) {
      const hours = parseInt(urlHours)
      if (hours === 6 || hours === 10 || hours === 24) {
        setHoursPerDay(hours)
        // Only skip hours step if all days had same hours (no mixed)
        const mixedHours = searchParams.get('mixedHours') === 'true'
        if (!mixedHours) {
          setSkipHoursStep(true) // Mark to skip hours step
        }
        prefilledFields.push('hours')
        shouldProcess = true
      }
    }

    // Pre-fill phone if provided
    if (urlPhone) {
      setCustomer(prev => ({ ...prev, phone: urlPhone }))
      prefilledFields.push('phone')
      shouldProcess = true
    }

    // Set initial step based on what was pre-filled
    if (urlStartDate && urlEndDate && !urlVehicle) {
      // Have dates, no vehicle - go to passengers step
      setCurrentStep(1)
      if (prefilledFields.length > 0) {
        toast.success(`Pre-filled: ${prefilledFields.join(', ')}. Choose your vehicle.`)
      }
    }

    // Mark as processed if no vehicle param (vehicle handling needs vehicles loaded)
    if (shouldProcess && !urlVehicle) {
      setUrlParamsProcessed(true)
    }
  }, [searchParams, urlParamsProcessed])

  // Process vehicle-related URL params after vehicles load
  useEffect(() => {
    if (urlParamsProcessed || vehicles.length === 0) return

    const urlVehicle = searchParams.get('vehicle')
    const urlStartDate = searchParams.get('startDate')
    const urlEndDate = searchParams.get('endDate')

    if (urlVehicle) {
      const vehicle = vehicles.find(v => v.id === urlVehicle)
      if (vehicle) {
        setSelectedVehicle(vehicle)
        if (vehicle.variants && vehicle.variants.length > 0) {
          setSelectedVariant(vehicle.variants[0])
        }
        setSkipVehicleStep(true)
        
        if (urlStartDate && urlEndDate) {
          // Have dates and vehicle - skip to hours (or beyond if hours pre-filled)
          setCurrentStep(skipHoursStep ? 4 : 3)
          toast.success(`Pre-filled with ${vehicle.name}`)
        } else {
          // Have vehicle but no dates
          setCurrentStep(0)
          toast.success(`${vehicle.name} selected. Choose your dates to continue.`)
        }
      } else {
        toast.error('Selected vehicle not available anymore. Please choose another car.')
      }
      setUrlParamsProcessed(true)
    }
  }, [searchParams, vehicles, urlParamsProcessed, skipHoursStep])

  // Skip passengers (step 1) and vehicle (step 2) when vehicle is pre-selected
  useEffect(() => {
    if (skipVehicleStep && selectedVehicle) {
      if (currentStep === 1 || currentStep === 2) {
        setCurrentStep(3)
      }
    }
  }, [skipVehicleStep, currentStep, selectedVehicle])

  // Update recommendations when passenger/luggage changes
  useEffect(() => {
    if (passengerCount > 0 && vehicles.length > 0) {
      const recommended = recommendVehiclesByCapacity(vehicles, passengerCount, luggageCount)
      setRecommendedVehicles(recommended)
    }
  }, [passengerCount, luggageCount, vehicles])

  // Helper to calculate per-day pricing with mixed hours
  const calculatePerDayPricing = (vehicle: Vehicle, schedule: DaySchedule[], extras: string[], payment: string) => {
    let baseTotal = 0
    
    for (const day of schedule) {
      if (day.serviceType === '6h' && vehicle.price6h) {
        baseTotal += vehicle.price6h
      } else if (day.serviceType === '10h' && vehicle.price10h) {
        baseTotal += vehicle.price10h
      } else if (day.serviceType === 'full-day' && vehicle.price24h) {
        baseTotal += vehicle.price24h
      }
    }
    
    // Calculate extras
    let extrasTotal = 0
    const extrasBreakdown: { name: string; price: number; quantity: number }[] = []
    if (vehicle.availableExtras && extras.length > 0) {
      for (const extraId of extras) {
        const extra = vehicle.availableExtras.find(e => e.id === extraId)
        if (extra) {
          const extraPrice = extra.perDay ? extra.price * schedule.length : extra.price
          extrasTotal += extraPrice
          extrasBreakdown.push({
            name: extra.name,
            price: extraPrice,
            quantity: extra.perDay ? schedule.length : 1
          })
        }
      }
    }
    
    const subtotal = baseTotal + extrasTotal
    
    // Calculate fees (5% credit card processing fee for Stripe)
    const fees: { type: string; description: string; amount: number }[] = []
    if (payment === 'stripe') {
      const processingFee = subtotal * 0.05
      fees.push({
        type: 'processing',
        description: 'Credit Card Processing Fee (5%)',
        amount: processingFee
      })
    }
    
    const totalFees = fees.reduce((sum, fee) => sum + fee.amount, 0)
    const total = subtotal + totalFees
    
    return {
      basePrice: baseTotal,
      dailyRate: baseTotal / schedule.length,
      hourlyRate: 0,
      totalDays: schedule.length,
      totalHours: schedule.length * 10,
      subtotal,
      discounts: [],
      fees,
      taxes: [],
      total,
      currency: 'USD',
      rentalDays: schedule.length,
      hoursPerDay: 10
    }
  }

  // Calculate pricing when relevant fields change
  useEffect(() => {
    if (selectedVehicle && startDate && endDate && (selectedVehicle.price6h || selectedVehicle.price10h || selectedVehicle.price24h)) {
      try {
        // If we have a per-day schedule, use per-day calculation
        if (daySchedule.length > 0) {
          const perDayPricing = calculatePerDayPricing(selectedVehicle, daySchedule, selectedExtras, paymentMethod)
          setPricing(perDayPricing as PricingBreakdown)
        } else if (hoursPerDay) {
          // Standard calculation for uniform hours
          const pricing = calculateRentalPricing(
            selectedVehicle,
            rentalDays,
            hoursPerDay,
            selectedExtras,
            DEFAULT_BOOKING_CONFIG,
            paymentMethod
          )
          setPricing(pricing)
        } else {
          setPricing(null)
        }
      } catch (error) {
        console.error('Pricing calculation failed:', error)
        setPricing(null)
      }
    } else {
      setPricing(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVehicle, startDate, endDate, hoursPerDay, selectedExtras, rentalDays, paymentMethod, daySchedule])

  const nextStep = () => {
    // Check if vehicle has extras available
    const hasExtras = selectedVehicle?.availableExtras && selectedVehicle.availableExtras.length > 0

    // Validation
    if (currentStep === 0 && (!startDate || !endDate)) {
      toast.error('Please select start and end dates')
      events.formValidationError('booking', 'dates', 'Dates not selected')
      return
    }
    if (currentStep === 1 && passengerCount < 1) {
      toast.error('Please enter number of passengers')
      events.formValidationError('booking', 'passengers', 'Invalid passenger count')
      return
    }
    if (currentStep === 2 && !selectedVehicle) {
      toast.error('Please select a vehicle')
      events.formValidationError('booking', 'vehicle', 'No vehicle selected')
      return
    }
    if (currentStep === 3 && !hoursPerDay && daySchedule.length === 0) {
      toast.error('Please select hours per day')
      events.formValidationError('booking', 'hours_per_day', 'Hours not selected')
      return
    }
    if (currentStep === 5) {
      if (!customer.name || !customer.email || !customer.phone) {
        toast.error('Please fill in all customer details')
        events.formValidationError('booking', 'customer_details', 'Missing customer information')
        return
      }
      if (!validateEmail(customer.email)) {
        toast.error('Please enter a valid email address')
        setEmailError('Please enter a valid email address')
        events.formValidationError('booking', 'customer_details', 'Invalid email format')
        return
      }
    }
    if (currentStep === 6 && (!paymentMethod || !termsAccepted)) {
      toast.error('Please select payment method and accept terms')
      events.formValidationError('booking', 'payment_terms', 'Payment method or terms not accepted')
      return
    }

    // Track step completion
    const stepNames = ['dates', 'passengers', 'vehicle', 'hours', 'extras', 'customer', 'payment']
    const stepData: Record<string, unknown> = {}
    
    if (currentStep === 0) {
      events.bookingStarted(selectedVehicle?.id)
      stepData.start_date = startDate
      stepData.end_date = endDate
      stepData.rental_days = rentalDays
    } else if (currentStep === 1) {
      stepData.passengers = passengerCount
      stepData.luggage = luggageCount
    } else if (currentStep === 3) {
      stepData.hours_per_day = hoursPerDay
    } else if (currentStep === 4) {
      stepData.extras_count = selectedExtras.length
    }
    
    events.bookingStepCompleted(currentStep, stepNames[currentStep], stepData)

    // Skip passengers (step 1) and vehicle (step 2) if vehicle pre-selected
    if (currentStep === 0 && skipVehicleStep && selectedVehicle) {
      // Check if we should also skip hours (based on URL params)
      const urlHours = searchParams.get('hours')
      
      if (urlHours) {
        const hours = parseInt(urlHours)
        if (hours === 6 || hours === 10 || hours === 24) {
          setHoursPerDay(hours)
        }
      }
      
      const nextStep = urlHours ? (hasExtras ? 4 : 5) : 3
      setCurrentStep(nextStep)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    // Skip hours step (step 3) if hours already pre-filled from URL
    // Always skip when hours param exists - customer already chose hours in request form
    const urlHoursParam = searchParams.get('hours')
    
    if (currentStep === 2 && urlHoursParam) {
      // Ensure hoursPerDay is set from URL param
      const hours = parseInt(urlHoursParam)
      if (hours === 6 || hours === 10 || hours === 24) {
        if (!hoursPerDay) {
          setHoursPerDay(hours)
        }
        setCurrentStep(hasExtras ? 4 : 5) // Skip to extras or customer details
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
    }

    // Skip extras step (step 4) if vehicle has no extras
    if (currentStep === 3 && !hasExtras) {
      setCurrentStep(5) // Skip to customer details
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const prevStep = () => {
    // Check if vehicle has extras available
    const hasExtras = selectedVehicle?.availableExtras && selectedVehicle.availableExtras.length > 0
    
    // Check if hours should be skipped (URL param or daySchedule exists)
    const urlHoursParam = searchParams.get('hours')
    const shouldSkipHours = skipHoursStep || urlHoursParam || daySchedule.length > 0
    
    // Check if came from homepage (has URL params for dates)
    const cameFromHomepage = searchParams.get('startDate') && searchParams.get('endDate')

    if (currentStep > 0) {
      // From payment (step 6) - always go to details
      if (currentStep === 6) {
        setCurrentStep(5)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      // From details (step 5)
      else if (currentStep === 5) {
        if (hasExtras) {
          setCurrentStep(4) // Go to extras
        } else if (shouldSkipHours) {
          setCurrentStep(2) // Go to vehicle, skip hours
        } else {
          setCurrentStep(3) // Go to hours
        }
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      // From extras (step 4)
      else if (currentStep === 4) {
        if (shouldSkipHours) {
          setCurrentStep(2) // Go to vehicle, skip hours
        } else {
          setCurrentStep(3) // Go to hours
        }
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      // From hours (step 3)
      else if (currentStep === 3) {
        if (skipVehicleStep && selectedVehicle) {
          // Don't go back to dates if came from homepage
          if (cameFromHomepage) {
            return // Can't go back further
          }
          setCurrentStep(0) // Go to dates if vehicle was pre-selected
        } else {
          setCurrentStep(2) // Go to vehicle
        }
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      // From vehicle (step 2) - can always go back to passengers
      else if (currentStep === 2) {
        setCurrentStep(1) // Go to passengers
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      // From passengers (step 1)
      else if (currentStep === 1) {
        if (cameFromHomepage) {
          return // Can't go back to dates if came from homepage
        }
        setCurrentStep(0) // Go to dates
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      // Default: go back one step
      else {
        setCurrentStep(currentStep - 1)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }

  const confirmStartOver = () => {
    setCurrentStep(0)
    setStartDate('')
    setEndDate('')
    setHoursPerDay(null)
    setPassengerCount(1)
    setLuggageCount(0)
    setSelectedVehicle(null)
    setSelectedVariant(null)
    setSelectedExtras([])
    setCustomer({ name: '', email: '', phone: '' })
    setEmailError('')
    setPaymentMethod('')
    setTermsAccepted(false)
    setPricing(null)
    setShowStartOverModal(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    toast.success('Booking reset. Starting fresh!')
  }

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    // More specific validation messages
    if (!selectedVehicle) {
      toast.error('Please select a vehicle')
      events.errorOccurred('booking_validation', 'No vehicle selected')
      return
    }
    if (!startDate || !endDate) {
      toast.error('Please select dates')
      events.errorOccurred('booking_validation', 'Dates not selected')
      return
    }
    if (!hoursPerDay && daySchedule.length === 0) {
      toast.error('Please select hours per day')
      events.errorOccurred('booking_validation', 'Hours per day not selected')
      return
    }
    if (!paymentMethod) {
      toast.error('Please select a payment method')
      events.errorOccurred('booking_validation', 'Payment method not selected')
      return
    }
    if (!termsAccepted) {
      toast.error('Please accept the terms and conditions')
      events.errorOccurred('booking_validation', 'Terms not accepted')
      return
    }
    if (!pricing) {
      toast.error('Unable to calculate pricing. Please go back and review your selections.')
      events.errorOccurred('booking_validation', 'Pricing calculation failed')
      return
    }

    setIsSubmitting(true)
    const loadingToast = toast.loading('Processing your booking...')

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customer.name,
          customerEmail: customer.email || '',
          customerPhone: customer.phone,
          vanType: selectedVehicle.id,
          pickupDate: startDate,
          returnDate: endDate,
          totalAmount: pricing.total,
          paymentMethod,
          rentalDays,
          hoursPerDay,
          passengerCount,
          luggageCount,
          selectedExtras,
          selectedVariant,
          pricingBreakdown: pricing
        })
      })

      const data = await response.json()
      toast.dismiss(loadingToast)

      if (data.success && data.data) {
        const bookingId = data.data.booking_id
        // Track successful booking
        events.bookingCompleted(
          bookingId,
          pricing.total,
          paymentMethod,
          selectedVehicle.id
        )
        toast.success('Booking created successfully!')
        router.push(`/booking/confirmation?bookingId=${bookingId}`)
      } else {
        console.error('Booking failed:', data)
        events.errorOccurred('booking_submission', data.error || 'Unknown error', {
          vehicle_id: selectedVehicle.id,
          amount: pricing.total
        })
        toast.error(data.error || 'Booking failed')
        setIsSubmitting(false)
      }
    } catch (error) {
      toast.dismiss(loadingToast)
      console.error('Booking submission failed:', error)
      events.errorOccurred('booking_submission', (error as Error).message, {
        vehicle_id: selectedVehicle.id,
        amount: pricing?.total
      })
      toast.error('Failed to submit booking. Please try again.')
      setIsSubmitting(false)
    }
  }

  // Calculate actual step number and total steps (excluding extras step if no extras available)
  const hasExtras = selectedVehicle?.availableExtras && selectedVehicle.availableExtras.length > 0
  const totalSteps = hasExtras ? STEPS.length : STEPS.length - 1
  const displayStep = currentStep >= 5 && !hasExtras ? currentStep : currentStep + 1

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-gray-900">
      <Breadcrumbs />

      <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-8 overflow-x-hidden">
        {/* Progress indicator - mobile optimized */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-charcoal-500 dark:text-white">
              Book Your Wedding Car
            </h1>
            <div className="flex items-center gap-3">
              {currentStep > 0 && (
                <button
                  onClick={() => setShowStartOverModal(true)}
                  type="button"
                  className="text-sm text-red-600 dark:text-red-400 hover:underline font-medium"
                >
                  Start Over
                </button>
              )}
              <span className="text-sm text-warm-600 dark:text-gray-400">
                Step {displayStep} of {totalSteps}
              </span>
            </div>
          </div>
          <div className="flex gap-1 sm:gap-2 mt-4">
            {STEPS.filter((step, idx) => hasExtras || idx !== 4).map((step, idx) => {
              const actualIdx = hasExtras ? idx : (idx < 4 ? idx : idx + 1)
              return (
                <div
                  key={step.id}
                  className={`flex-1 h-1.5 sm:h-2 rounded-full transition-colors ${actualIdx <= currentStep
                      ? 'bg-primary-600 dark:bg-primary-500'
                      : 'bg-warm-200 dark:bg-gray-700'
                    }`}
                />
              )
            })}
          </div>
        </div>

        {/* Step content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-6 md:p-8 mb-6 overflow-hidden w-full">
          {/* Step 0: Date Selection */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-charcoal-500 dark:text-white mb-2">
                  When do you need the car?
                </h2>
                <p className="text-warm-600 dark:text-gray-400 text-sm sm:text-base">
                  Select your rental start and end dates
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
                <div className="w-full">
                  <label className="block text-sm font-medium text-charcoal-500 dark:text-gray-300 mb-2">
                    Start Date
                  </label>
                  <div className="w-full rounded-lg overflow-hidden">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      className="px-3 sm:px-4 py-2.5 sm:py-3 border border-warm-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                      style={{ width: '100%', maxWidth: '100%', minWidth: '0', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                <div className="w-full">
                  <label className="block text-sm font-medium text-charcoal-500 dark:text-gray-300 mb-2">
                    End Date
                  </label>
                  <div className="w-full rounded-lg overflow-hidden">
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || format(new Date(), 'yyyy-MM-dd')}
                      className="px-3 sm:px-4 py-2.5 sm:py-3 border border-warm-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                      style={{ width: '100%', maxWidth: '100%', minWidth: '0', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              </div>

              {rentalDays > 0 && (
                <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
                  <p className="text-primary-800 dark:text-primary-200 font-medium">
                    {rentalDays} day{rentalDays !== 1 ? 's' : ''} selected
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Hours per Day */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-charcoal-500 dark:text-white mb-2">
                  How many hours per day?
                </h2>
                <p className="text-warm-600 dark:text-gray-400 text-sm sm:text-base">
                  Choose your service duration per day
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setHoursPerDay(6)}
                  disabled={!selectedVehicle?.price6h}
                  className={`p-6 rounded-xl border-4 transition-all ${hoursPerDay === 6
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 shadow-lg'
                      : 'border-gray-200 dark:border-gray-600 hover:border-primary-400'
                    } ${!selectedVehicle?.price6h ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={hoursPerDay === 6 ? { borderColor: '#742F38', backgroundColor: '#FBF3F4' } : {}}
                >
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2" style={{ color: hoursPerDay === 6 ? '#742F38' : '#3D3935' }}>6</div>
                    <div className="text-base font-semibold mb-1" style={{ color: hoursPerDay === 6 ? '#742F38' : '#6B5D50' }}>Hours</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Half day</div>
                    {selectedVehicle?.price6h && rentalDays > 0 && (
                      <div className="text-lg font-bold mt-3" style={{ color: '#742F38' }}>
                        ${selectedVehicle.price6h}/day
                      </div>
                    )}
                    {!selectedVehicle?.price6h && (
                      <div className="text-sm text-gray-400 mt-3">Not available</div>
                    )}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setHoursPerDay(10)}
                  disabled={!selectedVehicle?.price10h}
                  className={`p-6 rounded-xl border-4 transition-all ${hoursPerDay === 10
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 shadow-lg'
                      : 'border-gray-200 dark:border-gray-600 hover:border-primary-400'
                    } ${!selectedVehicle?.price10h ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={hoursPerDay === 10 ? { borderColor: '#742F38', backgroundColor: '#FBF3F4' } : {}}
                >
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2" style={{ color: hoursPerDay === 10 ? '#742F38' : '#3D3935' }}>10</div>
                    <div className="text-base font-semibold mb-1" style={{ color: hoursPerDay === 10 ? '#742F38' : '#6B5D50' }}>Hours</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Standard day</div>
                    {selectedVehicle?.price10h && rentalDays > 0 && (
                      <div className="text-lg font-bold mt-3" style={{ color: '#742F38' }}>
                        ${selectedVehicle.price10h}/day
                      </div>
                    )}
                    {!selectedVehicle?.price10h && (
                      <div className="text-sm text-gray-400 mt-3">Not available</div>
                    )}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setHoursPerDay(24)}
                  disabled={!selectedVehicle?.price24h}
                  className={`p-6 rounded-xl border-4 transition-all ${hoursPerDay === 24
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 shadow-lg'
                      : 'border-gray-200 dark:border-gray-600 hover:border-primary-400'
                    } ${!selectedVehicle?.price24h ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={hoursPerDay === 24 ? { borderColor: '#742F38', backgroundColor: '#FBF3F4' } : {}}
                >
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2" style={{ color: hoursPerDay === 24 ? '#742F38' : '#3D3935' }}>24</div>
                    <div className="text-base font-semibold mb-1" style={{ color: hoursPerDay === 24 ? '#742F38' : '#6B5D50' }}>Hours</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Full day</div>
                    {selectedVehicle?.price24h && rentalDays > 0 && (
                      <div className="text-lg font-bold mt-3" style={{ color: '#742F38' }}>
                        ${selectedVehicle.price24h}/day
                      </div>
                    )}
                    {!selectedVehicle?.price24h && (
                      <div className="text-sm text-gray-400 mt-3">Not available</div>
                    )}
                  </div>
                </button>
              </div>

              {selectedVehicle && hoursPerDay && rentalDays > 0 && (
                (() => {
                  const selectedPrice = hoursPerDay === 6 ? selectedVehicle.price6h : hoursPerDay === 10 ? selectedVehicle.price10h : selectedVehicle.price24h
                  return selectedPrice ? (
                    <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-primary-800 dark:text-primary-200 font-medium">Estimated Total</span>
                        <span className="text-2xl font-bold text-primary-900 dark:text-primary-100">
                          ${selectedPrice * rentalDays}
                        </span>
                      </div>
                      <p className="text-sm text-primary-700 dark:text-primary-300 mt-1">
                        ${selectedPrice}/day × {rentalDays} day{rentalDays !== 1 ? 's' : ''} ({hoursPerDay}h/day)
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gold-50 dark:bg-gold-900/20 border border-gold-200 dark:border-gold-800 rounded-lg p-4">
                      <p className="text-gold-800 dark:text-gold-200 text-sm">
                        💡 Price not configured for this vehicle. Contact us for a quote via WhatsApp.
                      </p>
                    </div>
                  )
                })()
              )}
            </div>
          )}

          {/* Step 1: Passengers & Luggage */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-charcoal-500 dark:text-white mb-2">
                  How many passengers?
                </h2>
                <p className="text-warm-600 dark:text-gray-400 text-sm sm:text-base">
                  We'll recommend the best vehicles for your group
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal-500 dark:text-gray-300 mb-2">
                    Number of Passengers
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setPassengerCount(Math.max(1, passengerCount - 1))}
                      className="w-12 h-12 rounded-lg border-2 border-warm-300 dark:border-gray-600 flex items-center justify-center text-xl font-bold text-charcoal-500 dark:text-white hover:bg-warm-50 dark:hover:bg-gray-700"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={passengerCount}
                      onChange={(e) => setPassengerCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                      className="flex-1 text-center text-2xl font-bold text-charcoal-500 dark:text-white border-0 focus:ring-0 bg-transparent"
                    />
                    <button
                      onClick={() => setPassengerCount(Math.min(100, passengerCount + 1))}
                      className="w-12 h-12 rounded-lg border-2 border-warm-300 dark:border-gray-600 flex items-center justify-center text-xl font-bold text-charcoal-500 dark:text-white hover:bg-warm-50 dark:hover:bg-gray-700"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal-500 dark:text-gray-300 mb-2">
                    Number of Luggage Pieces
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setLuggageCount(Math.max(0, luggageCount - 1))}
                      className="w-12 h-12 rounded-lg border-2 border-warm-300 dark:border-gray-600 flex items-center justify-center text-xl font-bold text-charcoal-500 dark:text-white hover:bg-warm-50 dark:hover:bg-gray-700"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={luggageCount}
                      onChange={(e) => setLuggageCount(Math.max(0, Math.min(20, parseInt(e.target.value) || 0)))}
                      className="flex-1 text-center text-2xl font-bold text-charcoal-500 dark:text-white border-0 focus:ring-0 bg-transparent"
                    />
                    <button
                      onClick={() => setLuggageCount(Math.min(20, luggageCount + 1))}
                      className="w-12 h-12 rounded-lg border-2 border-warm-300 dark:border-gray-600 flex items-center justify-center text-xl font-bold text-charcoal-500 dark:text-white hover:bg-warm-50 dark:hover:bg-gray-700"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {recommendedVehicles.length > 0 && (
                <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
                  <p className="text-sm text-primary-800 dark:text-primary-200">
                    We found {recommendedVehicles.length} vehicle{recommendedVehicles.length !== 1 ? 's' : ''} that fit your group
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Vehicle Selection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-charcoal-500 dark:text-white mb-2">
                  Choose Your Vehicle
                </h2>
                <p className="text-warm-600 dark:text-gray-400 text-sm sm:text-base">
                  {recommendedVehicles.length > 0 ? 'Recommended vehicles for your group' : 'Select from available vehicles'}
                </p>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {(recommendedVehicles.length > 0 ? recommendedVehicles : vehicles).map((vehicle) => {
                    // Calculate price based on per-day schedule if available
                    let totalPrice = 0
                    let priceDisplay = ''
                    
                    if (daySchedule.length > 0) {
                      // Calculate total from per-day schedule
                      for (const day of daySchedule) {
                        if (day.serviceType === '6h' && vehicle.price6h) {
                          totalPrice += vehicle.price6h
                        } else if (day.serviceType === '10h' && vehicle.price10h) {
                          totalPrice += vehicle.price10h
                        } else if (day.serviceType === 'full-day' && vehicle.price24h) {
                          totalPrice += vehicle.price24h
                        }
                      }
                      priceDisplay = `${rentalDays} day${rentalDays !== 1 ? 's' : ''} (mixed hours)`
                    } else if (hoursPerDay) {
                      // Standard calculation
                      const price = hoursPerDay === 6 ? vehicle.price6h : hoursPerDay === 10 ? vehicle.price10h : vehicle.price24h
                      totalPrice = price ? price * rentalDays : 0
                      priceDisplay = `$${price}/day × ${rentalDays} day${rentalDays !== 1 ? 's' : ''}`
                    }

                    return (
                      <div key={vehicle.id} className="space-y-3">
                        <button
                          onClick={() => {
                            setSelectedVehicle(vehicle)
                            // Track vehicle selection
                            const price = hoursPerDay === 6 ? vehicle.price6h : hoursPerDay === 10 ? vehicle.price10h : vehicle.price24h
                            events.vehicleSelected(vehicle.id, vehicle.name, price || 0, hoursPerDay || 10)
                            // Auto-select first variant if available
                            if (vehicle.variants && vehicle.variants.length > 0) {
                              setSelectedVariant(vehicle.variants[0])
                            } else {
                              setSelectedVariant(null)
                            }
                          }}
                          className={`w-full text-left p-4 sm:p-6 rounded-xl border-2 transition-all ${selectedVehicle?.id === vehicle.id
                              ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 dark:border-primary-500'
                              : 'border-warm-200 dark:border-gray-600 hover:border-primary-400'
                            }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Small vehicle image */}
                            {vehicle.images?.main && (
                              <div className="relative w-16 h-12 sm:w-20 sm:h-14 rounded-md overflow-hidden flex-shrink-0">
                                <Image
                                  src={vehicle.images.main}
                                  alt={vehicle.name}
                                  fill
                                  sizes="(max-width: 640px) 64px, 80px"
                                  className="object-cover"
                                />
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <h3 className="text-base sm:text-lg font-bold text-charcoal-500 dark:text-white mb-1">
                                {vehicle.name}
                              </h3>
                              <p className="text-xs sm:text-sm text-warm-600 dark:text-gray-400 mb-1">
                                {vehicle.maxPassengers || vehicle.capacity} • {vehicle.specifications.luggage}
                              </p>
                              {/* Show per-day total if schedule exists */}
                              {totalPrice > 0 && rentalDays > 0 && (
                                <p className="text-sm sm:text-base font-semibold text-[#742F38] dark:text-primary-300 tracking-wide">
                                  {priceDisplay} = ${totalPrice.toFixed(2)}
                                </p>
                              )}
                              {/* Show price options when no schedule (direct booking) */}
                              {daySchedule.length === 0 && !hoursPerDay && (
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {vehicle.price6h && (
                                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                                      6h: ${vehicle.price6h}
                                    </span>
                                  )}
                                  {vehicle.price10h && (
                                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                                      10h: ${vehicle.price10h}
                                    </span>
                                  )}
                                  {vehicle.price24h && (
                                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                                      24h: ${vehicle.price24h}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {selectedVehicle?.id === vehicle.id && (
                              <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-1" />
                            )}
                          </div>
                        </button>

                        {/* Variant selection - shown only if this vehicle is selected and has variants */}
                        {selectedVehicle?.id === vehicle.id && vehicle.variants && vehicle.variants.length > 0 && (
                          <div className="pl-4 space-y-2">
                            <p className="text-sm font-medium text-charcoal-500 dark:text-gray-300">
                              Choose seating configuration:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {vehicle.variants.map((variant) => (
                                <button
                                  key={variant.id}
                                  onClick={() => setSelectedVariant(variant)}
                                  className={`p-3 rounded-lg border-2 text-left transition-all ${selectedVariant?.id === variant.id
                                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 dark:border-primary-500'
                                      : 'border-warm-200 dark:border-gray-600 hover:border-primary-400'
                                    }`}
                                >
                                  <div className="font-medium text-sm text-charcoal-500 dark:text-white">
                                    {variant.name}
                                  </div>
                                  <div className="text-xs text-warm-600 dark:text-gray-400 mt-1">
                                    {variant.seating} • Max {variant.maxPassengers} passengers
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Extras */}
          {currentStep === 4 && selectedVehicle && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-charcoal-500 dark:text-white mb-2">
                  Extras
                </h2>
                <p className="text-warm-600 dark:text-gray-400 text-sm sm:text-base">
                  Customize your rental with optional extras
                </p>
              </div>

              <div className="space-y-4">
                {selectedVehicle.availableExtras && selectedVehicle.availableExtras.length > 0 ? (
                  <div className="space-y-2">
                    <div className="font-medium text-charcoal-500 dark:text-white mb-2">Optional Extras</div>
                    {selectedVehicle.availableExtras.map((extra) => (
                      <label
                        key={extra.id}
                        className="flex items-center justify-between p-4 rounded-xl border-2 border-warm-200 dark:border-gray-600 cursor-pointer hover:border-primary-400"
                      >
                        <div>
                          <div className="font-medium text-charcoal-500 dark:text-white">{extra.name}</div>
                          <div className="text-sm text-warm-600 dark:text-gray-400">
                            ${extra.price}{extra.perDay ? '/day' : ''}
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedExtras.includes(extra.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedExtras([...selectedExtras, extra.id])
                            } else {
                              setSelectedExtras(selectedExtras.filter(id => id !== extra.id))
                            }
                          }}
                          className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                        />
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-warm-600 dark:text-gray-400">
                    No extras available for this vehicle. Continue to the next step.
                  </div>
                )}
              </div>

              {pricing && (
                <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-charcoal-500 dark:text-white font-medium">Total</span>
                    <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      ${pricing.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Customer Details */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-charcoal-500 dark:text-white mb-2">
                  Your Details
                </h2>
                <p className="text-warm-600 dark:text-gray-400 text-sm sm:text-base">
                  We'll use this to confirm your booking
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal-500 dark:text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    className="w-full px-4 py-3 border border-warm-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-base"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal-500 dark:text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={customer.email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-base ${
                      emailError 
                        ? 'border-red-500 dark:border-red-500' 
                        : 'border-warm-300 dark:border-gray-600'
                    }`}
                    placeholder="your.email@example.com"
                    required
                  />
                  {emailError && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                      {emailError}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal-500 dark:text-gray-300 mb-2">
                    Phone *
                  </label>
                  <PhoneInput
                    value={customer.phone}
                    onChange={(value) => setCustomer({ ...customer, phone: value })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Payment */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-charcoal-500 dark:text-white mb-2">
                  Payment Method
                </h2>
                <p className="text-warm-600 dark:text-gray-400 text-sm sm:text-base">
                  Choose how you'd like to pay
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { id: 'stripe', label: 'Credit/Debit Card', description: 'Pay securely with your card (5% processing fee applies)' },
                  { id: 'omt', label: 'OMT', description: 'Pay through OMT' },
                  { id: 'whish-money', label: 'Whish Money', description: 'Pay via Whish Money' },
                  { id: 'bank-transfer', label: 'Bank Transfer', description: 'Direct bank transfer' }
                ].map((method) => {
                  const selected = paymentMethod === method.id
                  return (
                    <label
                      key={method.id}
                      className={`block w-full rounded-xl border-2 p-4 cursor-pointer transition-all ${selected
                          ? 'border-primary-600 ring-2 ring-primary-100 bg-primary-50 shadow-md dark:bg-primary-900/30 dark:border-primary-500 dark:ring-primary-800/60'
                          : 'border-warm-200 dark:border-gray-600 hover:border-primary-300'
                        }`}
                      aria-checked={selected}
                      role="radio"
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={selected}
                        onChange={() => {
                          setPaymentMethod(method.id)
                          events.paymentMethodSelected(method.id, pricing?.total || 0)
                        }}
                        className="sr-only"
                      />
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-medium text-charcoal-500 dark:text-white">
                            {method.label}
                          </div>
                          <div className="text-sm text-warm-600 dark:text-gray-400 mt-1">
                            {method.description}
                          </div>
                        </div>
                        <div
                          className={`flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all ${selected
                              ? 'bg-primary-600 border-primary-600 text-white'
                              : 'border-warm-300 text-transparent'
                            }`}
                          aria-hidden="true"
                        >
                          <CheckIcon className="h-4 w-4" />
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>

              <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-warm-200 dark:border-gray-600">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                  required
                />
                <span className="text-sm text-charcoal-500 dark:text-white">
                  I accept the terms and conditions *
                </span>
              </label>

              {pricing && (
                <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
                  <div className="space-y-2">
                    {/* Per-day breakdown if available */}
                    {daySchedule.length > 0 && (
                      <div className="mb-3 pb-3 border-b border-primary-200 dark:border-primary-700">
                        <div className="text-sm font-medium text-charcoal-500 dark:text-gray-300 mb-2">Schedule Breakdown:</div>
                        {daySchedule.map((day, idx) => {
                          const price = day.serviceType === '6h' ? selectedVehicle?.price6h : 
                                       day.serviceType === '10h' ? selectedVehicle?.price10h : 
                                       selectedVehicle?.price24h
                          return (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-charcoal-500 dark:text-gray-300">
                                {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ({day.serviceType === 'full-day' ? '24h' : day.serviceType})
                              </span>
                              <span className="text-charcoal-500 dark:text-white">${price?.toFixed(2) || '0.00'}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-charcoal-500 dark:text-gray-300">Subtotal</span>
                      <span className="text-charcoal-500 dark:text-white">${pricing.subtotal.toFixed(2)}</span>
                    </div>
                    {pricing.taxes?.filter(tax => tax.amount > 0).map((tax) => (
                      <div key={tax.type} className="flex justify-between text-sm">
                        <span className="text-charcoal-500 dark:text-gray-300">{tax.description}</span>
                        <span className="text-charcoal-500 dark:text-white">${tax.amount.toFixed(2)}</span>
                      </div>
                    ))}
                    {pricing.fees?.filter(fee => fee.amount > 0).map((fee) => (
                      <div key={fee.type} className="flex justify-between text-sm">
                        <span className="text-charcoal-500 dark:text-gray-300">{fee.description}</span>
                        <span className="text-charcoal-500 dark:text-white">${fee.amount.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-2 border-t border-primary-200 dark:border-primary-800">
                      <span className="font-bold text-charcoal-500 dark:text-white">Total</span>
                      <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        ${pricing.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation buttons - outside content card, always visible */}
        <div className="mt-6">
          <div className="flex gap-3 sm:gap-4">
            {/* Show back button only if user can go back (hide on passenger step when came from homepage) */}
            {(() => {
              const cameFromHomepage = searchParams.get('startDate') && searchParams.get('endDate')
              const canGoBack = currentStep > 0 && !(cameFromHomepage && currentStep === 1)
              return canGoBack ? (
                <button
                  onClick={prevStep}
                  type="button"
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none sm:px-8 py-4 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                  <span>Back</span>
                </button>
              ) : null
            })()}
            <button
              onClick={currentStep === STEPS.length - 1 ? handleSubmit : nextStep}
              type="button"
              disabled={isSubmitting}
              style={{ background: 'linear-gradient(to bottom right, #F6EEDD, #DEC690)', color: '#4A1F25', borderColor: '#BA9348' }}
              className="flex-1 sm:flex-none sm:px-12 py-4 rounded-md font-light hover:opacity-90 transition-all text-base sm:text-lg border disabled:opacity-50 disabled:cursor-not-allowed tracking-wider"
            >
              {isSubmitting ? 'Processing...' : (currentStep === STEPS.length - 1 ? 'Complete Booking' : 'Continue')}
            </button>
          </div>
        </div>
      </div>

      <Footer />

      {/* Start Over Confirmation Modal */}
      {showStartOverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowStartOverModal(false)}></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-charcoal-500 dark:text-white mb-2">
              Start Over?
            </h3>
            <p className="text-warm-600 dark:text-gray-400 mb-6">
              This will reset all your selections and take you back to the first step.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowStartOverModal(false)}
                type="button"
                className="flex-1 py-3 px-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmStartOver}
                type="button"
                className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Yes, Start Over
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function BookingPageClient() {
  return (
    <Suspense fallback={<BookingSSRFallback />}>
      <SimplifiedBookingPageContent />
    </Suspense>
  )
}

