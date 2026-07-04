'use client'

import { format, parse } from 'date-fns'
import { 
  CalendarDaysIcon, 
  ClockIcon, 
  UserIcon, 
  PhoneIcon, 
  EnvelopeIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  TruckIcon
} from '@heroicons/react/24/outline'
import Image from 'next/image'
import { BookingFormData, PricingBreakdown } from '@/types/booking'
import { formatBookingDuration, calculateBookingPeriod } from '@/utils/bookingUtils'

interface BookingSummaryProps {
  bookingData: BookingFormData
  pricing?: PricingBreakdown
  className?: string
  showPricing?: boolean
  compact?: boolean
  onEditStep?: (step: number) => void
}

export default function BookingSummary({
  bookingData,
  pricing,
  className = '',
  showPricing = true,
  compact = false,
  onEditStep
}: BookingSummaryProps) {
  const { selectedVehicle, pickupDate, pickupTime, returnDate, returnTime, customer } = bookingData

  if (!selectedVehicle) {
    return null
  }

  // Calculate period and duration only if we have all date info
  const hasDates = pickupDate && pickupTime && returnDate && returnTime
  const period = hasDates ? calculateBookingPeriod(pickupDate, pickupTime, returnDate, returnTime) : null
  const duration = period ? formatBookingDuration(period) : null

  const formatDateTime = (date: string, time: string) => {
    try {
      const dateObj = new Date(date)
      const timeObj = parse(time, 'HH:mm', new Date())
      return {
        date: format(dateObj, 'EEE, MMM dd, yyyy'),
        time: format(timeObj, 'h:mm a')
      }
    } catch {
      return { date: 'Not selected', time: '' }
    }
  }

  const pickup = hasDates ? formatDateTime(pickupDate, pickupTime) : { date: 'Select dates', time: '' }
  const returnInfo = hasDates ? formatDateTime(returnDate, returnTime) : { date: 'Select dates', time: '' }

  if (compact) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg border border-warm-200 dark:border-gray-700 p-4 ${className}`}>
        <div className="flex items-center space-x-3 mb-3">
          <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-warm-100 dark:bg-gray-700 flex-shrink-0">
            <Image
              src={selectedVehicle.images.main}
              alt={selectedVehicle.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-charcoal-500 dark:text-white truncate">{selectedVehicle.name}</h4>
            <p className="text-sm text-warm-500 dark:text-gray-400">{duration || 'Select dates to see duration'}</p>
          </div>
          {showPricing && pricing && (
            <div className="text-right">
              <p className="text-lg font-bold text-primary-600 dark:text-primary-400">${pricing.total}</p>
              <p className="text-xs text-warm-500 dark:text-gray-400">Total</p>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center text-warm-600 dark:text-gray-400">
            <CalendarDaysIcon className="h-4 w-4 mr-1.5 text-green-700 dark:text-green-300" />
            <span>{pickup.date}</span>
          </div>
          <div className="flex items-center text-warm-600 dark:text-gray-400">
            <CalendarDaysIcon className="h-4 w-4 mr-1.5 text-red-600 dark:text-red-400" />
            <span>{returnInfo.date}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-warm-200 dark:border-gray-700 shadow-sm ${className}`}>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-charcoal-500 dark:text-white mb-4">Booking Summary</h3>

        {/* Vehicle Details */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start space-x-4 flex-1">
              <div className="relative w-20 h-16 rounded-lg overflow-hidden bg-warm-100 flex-shrink-0">
                <Image
                  src={selectedVehicle.images.main}
                  alt={selectedVehicle.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-charcoal-500 dark:text-white">{selectedVehicle.name}</h4>
                <p className="text-warm-600 dark:text-gray-400 text-sm">
                  {selectedVehicle.model && selectedVehicle.year ? `${selectedVehicle.model} ${selectedVehicle.year}` : selectedVehicle.model || selectedVehicle.year || ''}
                </p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-warm-500 dark:text-gray-400">
                  <span className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-1" />
                    {selectedVehicle.specifications.seating}
                  </span>
                  <span className="flex items-center">
                    <TruckIcon className="h-4 w-4 mr-1" />
                    {selectedVehicle.specifications.luggage}
                  </span>
                </div>
              </div>
            </div>
            {onEditStep && (
              <button
                type="button"
                onClick={() => onEditStep(0)}
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium whitespace-nowrap"
              >
                Change
              </button>
            )}
          </div>
        </div>

        {/* Booking Period */}
        <div className="border-t border-warm-200 dark:border-gray-700 pt-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-charcoal-500 dark:text-white">Booking Period</h4>
            {onEditStep && (
              <button
                type="button"
                onClick={() => onEditStep(1)}
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
              >
                Edit
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pickup */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <MapPinIcon className="h-5 w-5 text-green-700 dark:text-green-300 mr-2" />
                <span className="font-medium text-green-900 dark:text-green-300">Pickup</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center text-sm">
                  <CalendarDaysIcon className="h-4 w-4 text-green-700 dark:text-green-300 mr-2" />
                  <span className={hasDates ? "text-green-800 dark:text-green-300" : "text-green-700 dark:text-green-300 italic"}>{pickup.date}</span>
                </div>
                {pickup.time && (
                  <div className="flex items-center text-sm">
                    <ClockIcon className="h-4 w-4 text-green-700 dark:text-green-300 mr-2" />
                    <span className="text-green-800 dark:text-green-300">{pickup.time}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Return */}
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <MapPinIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                <span className="font-medium text-red-900 dark:text-red-300">Return</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center text-sm">
                  <CalendarDaysIcon className="h-4 w-4 text-red-600 dark:text-red-400 mr-2" />
                  <span className={hasDates ? "text-red-800 dark:text-red-300" : "text-red-600 dark:text-red-400 italic"}>{returnInfo.date}</span>
                </div>
                {returnInfo.time && (
                  <div className="flex items-center text-sm">
                    <ClockIcon className="h-4 w-4 text-red-600 dark:text-red-400 mr-2" />
                    <span className="text-red-800 dark:text-red-300">{returnInfo.time}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Duration */}
          {duration && (
            <div className="mt-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-2" />
                  <span className="font-medium text-primary-900 dark:text-primary-300">Total Duration</span>
                </div>
                <span className="font-semibold text-primary-900 dark:text-primary-300">{duration}</span>
              </div>
            </div>
          )}
        </div>

        {/* Customer Info */}
        {customer.name && (
          <div className="border-t border-warm-200 dark:border-gray-700 pt-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-charcoal-500 dark:text-white">Customer Information</h4>
              {onEditStep && (
                <button
                  type="button"
                  onClick={() => onEditStep(2)}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                >
                  Edit
                </button>
              )}
            </div>
            <div className="space-y-2">
              {customer.name && (
                <div className="flex items-center text-sm">
                  <UserIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-3" />
                  <span className="text-charcoal-500 dark:text-gray-300">{customer.name}</span>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center text-sm">
                  <EnvelopeIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-3" />
                  <span className="text-charcoal-500 dark:text-gray-300">{customer.email}</span>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center text-sm">
                  <PhoneIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-3" />
                  <span className="text-charcoal-500 dark:text-gray-300">{customer.phone}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pricing Breakdown */}
        {showPricing && pricing && (
          <div className="border-t border-warm-200 dark:border-gray-700 pt-4">
            <div className="flex items-center mb-3">
              <CurrencyDollarIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
              <h4 className="font-medium text-charcoal-500 dark:text-white">Pricing Breakdown</h4>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-warm-600 dark:text-gray-400">
                  {pricing.totalDays > 1 
                    ? `${pricing.totalDays} days @ $${pricing.dailyRate}/day`
                    : `${pricing.totalHours} hours @ $${pricing.hourlyRate}/hour`
                  }
                </span>
                <span className="text-charcoal-500 dark:text-gray-300">${pricing.subtotal}</span>
              </div>

              {pricing.discounts.map((discount, index) => (
                <div key={index} className="flex justify-between text-sm text-green-700 dark:text-green-300">
                  <span>{discount.description}</span>
                  <span>-${discount.amount}</span>
                </div>
              ))}

              {pricing.fees.map((fee, index) => (
                <div key={index} className="flex justify-between text-sm text-warm-600 dark:text-gray-400">
                  <span>{fee.description}</span>
                  <span>${fee.amount}</span>
                </div>
              ))}

              {pricing.taxes.map((tax, index) => (
                <div key={index} className="flex justify-between text-sm text-warm-600 dark:text-gray-400">
                  <span>{tax.description} ({(tax.rate * 100).toFixed(1)}%)</span>
                  <span>${tax.amount}</span>
                </div>
              ))}

              <div className="border-t border-warm-200 dark:border-gray-700 pt-2 mt-3">
                <div className="flex justify-between font-semibold text-lg">
                  <span className="text-charcoal-500 dark:text-white">Total</span>
                  <span className="text-primary-600 dark:text-primary-400">${pricing.total} {pricing.currency}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
