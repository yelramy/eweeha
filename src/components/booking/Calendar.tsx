'use client'

import { useState, useMemo, useEffect } from 'react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths,
  isAfter,
  isBefore,
  startOfDay
} from 'date-fns'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface CalendarProps {
  selectedDate: string
  onSelectDate: (date: string) => void
  minDate?: string
  maxDate?: string
  className?: string
}

// Helper function to safely parse YYYY-MM-DD date strings to local Date objects
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

// Helper function to format Date to YYYY-MM-DD string
function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function Calendar({
  selectedDate,
  onSelectDate,
  minDate,
  maxDate,
  className = ''
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (selectedDate) {
      return parseLocalDate(selectedDate)
    }
    return new Date()
  })

  const minDateObj = minDate ? parseLocalDate(minDate) : undefined
  const maxDateObj = maxDate ? parseLocalDate(maxDate) : undefined

  // Update currentMonth when selectedDate changes from outside
  useEffect(() => {
    if (selectedDate) {
      const selectedDateObj = parseLocalDate(selectedDate)
      // Only update if it's a different month
      if (selectedDateObj.getMonth() !== currentMonth.getMonth() || 
          selectedDateObj.getFullYear() !== currentMonth.getFullYear()) {
        setCurrentMonth(selectedDateObj)
      }
    }
  }, [selectedDate, currentMonth])

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const firstDayOfMonth = startOfMonth(currentMonth).getDay()

  const handlePrevMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1))
  }

  const handleDateClick = (day: Date) => {
    // Format using local date components to avoid timezone issues
    const dateStr = formatLocalDate(day)
    onSelectDate(dateStr)
  }

  const isDateDisabled = (day: Date) => {
    const dayStart = startOfDay(day)
    
    if (minDateObj && isBefore(dayStart, startOfDay(minDateObj))) {
      return true
    }
    
    if (maxDateObj && isAfter(dayStart, startOfDay(maxDateObj))) {
      return true
    }
    
    return false
  }

  const isSelected = (day: Date) => {
    if (!selectedDate || !selectedDate.trim()) return false
    // Compare date strings directly to avoid timezone issues
    const dayStr = formatLocalDate(day)
    const trimmedSelected = selectedDate.trim()
    return dayStr === trimmedSelected
  }

  const isToday = (day: Date) => {
    return isSameDay(day, new Date())
  }

  return (
    <div className={`bg-white dark:bg-gray-800 border border-warm-200 dark:border-gray-700 rounded-lg p-4 ${className}`}>
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-2 hover:bg-warm-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeftIcon className="h-5 w-5 text-charcoal-500 dark:text-gray-300" />
        </button>
        
        <h3 className="text-base font-semibold text-charcoal-500 dark:text-white">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-2 hover:bg-warm-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          aria-label="Next month"
        >
          <ChevronRightIcon className="h-5 w-5 text-charcoal-500 dark:text-gray-300" />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-warm-600 dark:text-gray-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before month starts */}
        {Array.from({ length: firstDayOfMonth }).map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}
        
        {/* Calendar days */}
        {days.map((day) => {
          const disabled = isDateDisabled(day)
          const selected = isSelected(day)
          const today = isToday(day)
          
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => !disabled && handleDateClick(day)}
              disabled={disabled}
              style={selected ? { backgroundColor: '#742F38', color: '#ffffff', borderColor: '#742F38' } : {}}
              className={`
                aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all
                ${selected 
                  ? 'ring-2 ring-primary-600 dark:ring-primary-500' 
                  : today
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-300 dark:border-primary-700'
                  : disabled
                  ? 'bg-warm-50 dark:bg-gray-800 text-warm-300 dark:text-gray-600 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-700 text-charcoal-500 dark:text-gray-200 hover:bg-warm-50 dark:hover:bg-gray-600 border border-warm-200 dark:border-gray-600'
                }
              `}
              aria-label={format(day, 'MMMM d, yyyy')}
              aria-current={today ? 'date' : undefined}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-warm-200 dark:border-gray-700 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-primary-600 dark:bg-primary-500"></div>
          <span className="text-warm-600 dark:text-gray-400">Selected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-primary-50 dark:bg-primary-900/30 border border-primary-300 dark:border-primary-700"></div>
          <span className="text-warm-600 dark:text-gray-400">Today</span>
        </div>
      </div>
    </div>
  )
}

