'use client'

import { useState, useEffect } from 'react'
import { format, isWeekend } from 'date-fns'
import { CalendarDaysIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { BookingConfig, TimeSlot } from '@/types/booking'
import { generateTimeSlots, isWithinBusinessHours, DEFAULT_BOOKING_CONFIG } from '@/utils/bookingUtils'
import Calendar from './Calendar'

// Helper function to safely parse YYYY-MM-DD date strings to local Date objects
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

// Helper function to format YYYY-MM-DD date string to readable format
function formatDateDisplay(dateStr: string): string {
  const date = parseLocalDate(dateStr)
  return format(date, 'MMMM d, yyyy')
}

interface DateTimePickerProps {
  label: string
  date: string
  time: string
  onDateChange: (date: string) => void
  onTimeChange: (time: string) => void
  minDate?: string
  maxDate?: string
  excludeDates?: string[]
  unavailableSlots?: string[]
  config?: BookingConfig
  error?: string
  className?: string
  icon?: 'calendar' | 'clock'
  showBusinessHoursWarning?: boolean
  compact?: boolean
}

export default function DateTimePicker({
  label,
  date,
  time,
  onDateChange,
  onTimeChange,
  minDate,
  maxDate,
  // excludeDates = [], // Reserved for future use
  unavailableSlots = [],
  config = DEFAULT_BOOKING_CONFIG,
  error,
  className = '',
  icon = 'calendar',
  showBusinessHoursWarning = true,
  compact = false
}: DateTimePickerProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [isBusinessHours, setIsBusinessHours] = useState(true)
  const [isWeekendDate, setIsWeekendDate] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)

  // Generate time slots when date changes
  useEffect(() => {
    if (date) {
      const slots = generateTimeSlots(date, config, unavailableSlots)
      setTimeSlots(slots)
      setIsWeekendDate(isWeekend(parseLocalDate(date)))
      
      // Check if selected time is within business hours
      if (time) {
        setIsBusinessHours(isWithinBusinessHours(date, time, config))
      }
    }
    // Only depend on date to avoid infinite loops from object/array recreations
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  // Auto-select first available time slot if current selection is unavailable
  useEffect(() => {
    if (timeSlots.length > 0 && time) {
      const selectedSlot = timeSlots.find(slot => 
        slot.label === time || format(new Date(`2000-01-01 ${slot.hour}:${slot.minute}`), 'HH:mm') === time
      )
      
      if (!selectedSlot || !selectedSlot.available) {
        const firstAvailable = timeSlots.find(slot => slot.available)
        if (firstAvailable) {
          const newTime = format(new Date(`2000-01-01 ${firstAvailable.hour}:${firstAvailable.minute}`), 'HH:mm')
          // Only update if actually different to prevent infinite loop
          if (newTime !== time) {
            onTimeChange(newTime)
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeSlots])

  const IconComponent = icon === 'calendar' ? CalendarDaysIcon : ClockIcon

  return (
    <div className={`space-y-2 sm:space-y-3 min-w-0 ${className}`}>
      <h3 className="text-sm sm:text-base font-semibold text-charcoal-500 dark:text-white flex items-center">
        <IconComponent className="h-4 w-4 mr-1.5 sm:mr-2 text-charcoal-500 dark:text-primary-400" />
        {label}
      </h3>

      {/* Date Picker */}
      <div className="min-w-0 overflow-hidden">
        <label className="block text-xs sm:text-sm font-medium text-charcoal-500 dark:text-gray-200 mb-1.5 sm:mb-2">
          Date
          {isWeekendDate && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gold-100 dark:bg-gold-900/30 text-gold-800 dark:text-gold-300">
              Weekend
            </span>
          )}
        </label>
        
        {/* Visual Calendar - Desktop */}
        <div className="hidden sm:block">
          <button
            type="button"
            onClick={() => setShowCalendar(!showCalendar)}
            className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border-2 transition-all duration-200 dark:bg-gray-700 dark:text-white text-left flex items-center justify-between ${
              error 
                ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200' 
                : 'border-warm-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-200 dark:focus:ring-primary-900'
            } focus:outline-none focus:ring-2`}
          >
            <span className={date ? 'text-charcoal-500 dark:text-white' : 'text-gray-400 dark:text-gray-500'}>
              {date ? formatDateDisplay(date) : 'Select a date'}
            </span>
            <CalendarDaysIcon className="h-5 w-5 text-warm-500 dark:text-gray-400" />
          </button>
          
          {showCalendar && (
            <div className="mt-2 relative">
              <Calendar
                key={`calendar-${date}`}
                selectedDate={date || ''}
                onSelectDate={(newDate) => {
                  onDateChange(newDate)
                  setShowCalendar(false)
                }}
                minDate={minDate || format(new Date(), 'yyyy-MM-dd')}
                maxDate={maxDate}
              />
            </div>
          )}
        </div>
        
        {/* Text Input - Mobile fallback */}
        <input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          min={minDate || format(new Date(), 'yyyy-MM-dd')}
          max={maxDate}
          className={`sm:hidden w-full px-2.5 py-1.5 text-sm rounded-md border transition-all duration-200 dark:bg-gray-700 dark:text-white ${
            error 
              ? 'border-red-300 bg-red-50 focus:border-red-500' 
              : 'border-warm-300 dark:border-gray-600 focus:border-primary-500'
          } focus:outline-none`}
          style={{ height: '38px', fontSize: '14px' }}
        />
        
        {error && (
          <p className="text-red-500 text-sm mt-1 flex items-center">
            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
            {error}
          </p>
        )}
      </div>

      {/* Time Picker */}
      <div className="min-w-0 overflow-hidden">
        <label className="block text-xs sm:text-sm font-medium text-charcoal-500 dark:text-gray-200 mb-1.5 sm:mb-2">
          Time
          {!isBusinessHours && showBusinessHoursWarning && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gold-100 dark:bg-gold-900/30 text-gold-800 dark:text-gold-300">
              After Hours
            </span>
          )}
        </label>
        
        {date ? (
          timeSlots.length > 0 ? (
            <>
              {/* Mobile: Dropdown */}
              <select
                value={time}
                onChange={(e) => onTimeChange(e.target.value)}
                className="sm:hidden w-full px-2.5 py-1.5 text-sm rounded-md border border-warm-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-charcoal-500 dark:text-white focus:border-primary-500 focus:outline-none transition-all duration-200"
                style={{ height: '38px', fontSize: '14px' }}
              >
                {timeSlots.map((slot) => {
                  const slotTime = format(new Date(`2000-01-01 ${slot.hour}:${slot.minute}`), 'HH:mm')
                  return (
                    <option key={`${slot.hour}-${slot.minute}`} value={slotTime} disabled={!slot.available}>
                      {slot.label}
                    </option>
                  )
                })}
              </select>

              {/* Desktop: Button Grid */}
              <div className="hidden sm:grid sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {timeSlots.map((slot) => {
                  const slotTime = format(new Date(`2000-01-01 ${slot.hour}:${slot.minute}`), 'HH:mm')
                  const isSelected = time === slotTime
                  
                  return (
                    <button
                      key={`${slot.hour}-${slot.minute}`}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => onTimeChange(slotTime)}
                      style={isSelected ? { backgroundColor: '#0B6B3A', color: '#ffffff', borderColor: '#0B6B3A' } : {}}
                      className={`px-2 py-2 rounded-md text-sm font-medium transition-all duration-200 border ${
                        isSelected
                          ? ''
                          : slot.available
                          ? 'bg-white dark:bg-gray-700 text-charcoal-500 dark:text-gray-300 border-warm-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
                          : 'bg-warm-100 dark:bg-gray-800 text-warm-400 dark:text-gray-600 border-warm-200 dark:border-gray-700 cursor-not-allowed'
                      }`}
                    >
                      {slot.label}
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="bg-warm-50 dark:bg-gray-700 border border-warm-300 dark:border-gray-600 rounded-lg p-3 sm:p-4 text-center">
              <ClockIcon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
              <p className="text-xs sm:text-sm text-warm-500 dark:text-gray-400">No time slots available for this date</p>
            </div>
          )
        ) : (
          <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3 sm:p-4 text-center">
            <CalendarDaysIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary-500 dark:text-primary-400 mx-auto mb-2" />
            <p className="text-xs sm:text-sm text-primary-700 dark:text-primary-300">Please select a date first</p>
          </div>
        )}
      </div>

      {/* Business Hours Info - hidden on mobile when compact */}
      {date && !compact && (
        <div className="bg-warm-50 dark:bg-gray-700 border border-warm-200 dark:border-gray-600 rounded-lg p-2.5 sm:p-3">
          <div className="flex items-start">
            <CalendarDaysIcon className="h-4 w-4 sm:h-5 sm:w-5 text-charcoal-500 dark:text-primary-400 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-xs sm:text-sm text-charcoal-600 dark:text-gray-300">
              <p className="font-medium">Business Hours</p>
              {(() => {
                const dayOfWeek = format(parseLocalDate(date), 'EEEE').toLowerCase() as keyof typeof config.businessHours
                const businessDay = config.businessHours[dayOfWeek]
                
                if (businessDay.closed) {
                  return <p>Closed on {format(parseLocalDate(date), 'EEEE')}s</p>
                }
                
                return (
                  <p>
                    {format(new Date(`2000-01-01 ${businessDay.open}`), 'h:mm a')} - {format(new Date(`2000-01-01 ${businessDay.close}`), 'h:mm a')}
                  </p>
                )
              })()}
              {isWeekendDate && (
                <p className="text-[10px] sm:text-xs mt-1 text-gold-700">
                  Weekend bookings may include additional charges
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
