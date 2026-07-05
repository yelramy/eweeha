'use client'

import { useState } from 'react'
import {
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import type { QuoteResponse } from '@/app/api/ai/booking/interpret/route'
import { WEDDING_ADD_ONS } from '@/lib/weddingAddOns'

interface AvailableVehicle {
  id: string
  name: string
  image: string
  maxPassengers?: number
  maxLuggage?: number
}

interface QuoteCardProps {
  quote: QuoteResponse
  onUpdate: (quote: QuoteResponse) => void
  availableVehicles?: AvailableVehicle[]
}

function formatDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return dateStr
  }
}

/**
 * Wedding-day plan card: one date, the cars, and add-ons.
 * No prices — the exact quote is confirmed on WhatsApp.
 */
export default function QuoteCard({ quote, onUpdate, availableVehicles = [] }: QuoteCardProps) {
  const [editingDate, setEditingDate] = useState(false)
  const [editDate, setEditDate] = useState('')
  const [changingVehicleIndex, setChangingVehicleIndex] = useState<number | null>(null)

  const today = new Date().toISOString().split('T')[0]
  const weddingDate = quote.interpretation.weddingDate

  const saveDate = () => {
    if (!editDate) return
    onUpdate({
      ...quote,
      interpretation: { ...quote.interpretation, weddingDate: editDate },
    })
    setEditingDate(false)
  }

  const toggleAddOn = (id: string) => {
    const current = quote.interpretation.addOns
    const addOns = current.includes(id) ? current.filter(a => a !== id) : [...current, id]
    onUpdate({ ...quote, interpretation: { ...quote.interpretation, addOns } })
  }

  return (
    <div className="space-y-4">
      {/* Clarifications */}
      {quote.interpretation.clarifications.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 sm:p-4">
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              {quote.interpretation.clarifications.map((c, i) => (
                <p key={i} className="text-sm text-amber-800 dark:text-amber-200">{c}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Wedding day */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4" />
            Your Wedding Day
          </h3>
        </div>
        <div className="px-4 py-3">
          {editingDate ? (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                min={today}
                className="flex-1 min-w-0 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-[#742F38] dark:bg-gray-800 dark:text-white"
              />
              <button onClick={saveDate} className="p-1.5 text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded">
                <CheckIcon className="w-4 h-4" />
              </button>
              <button onClick={() => setEditingDate(false)} className="p-1.5 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${weddingDate ? 'text-gray-900 dark:text-white' : 'text-amber-700 dark:text-amber-300'}`}>
                {weddingDate ? formatDate(weddingDate) : 'Date not set yet — tap to pick it'}
              </span>
              <button
                onClick={() => { setEditDate(weddingDate || today); setEditingDate(true) }}
                className="p-1.5 text-gray-400 hover:text-[#742F38] hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                aria-label="Edit wedding date"
              >
                <PencilIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cars */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Your Cars</h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {quote.vehicles.map((v, i) => (
            <div key={i} className="p-4">
              <div className="flex items-start gap-3">
                {v.image && (
                  <div className="w-16 h-12 sm:w-20 sm:h-14 rounded-md overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-700">
                    <img src={v.image} alt={v.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{v.name}</span>
                      {v.quantity > 1 && (
                        <span className="inline-flex px-1.5 py-0.5 text-[10px] font-bold rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                          x{v.quantity}
                        </span>
                      )}
                    </div>
                    {availableVehicles.length > 1 && (
                      <button
                        onClick={() => setChangingVehicleIndex(changingVehicleIndex === i ? null : i)}
                        className="text-[11px] text-[#742F38] dark:text-primary-300 hover:text-[#5C262D] font-medium flex-shrink-0 ml-2"
                      >
                        {changingVehicleIndex === i ? 'Cancel' : 'Change'}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{v.reason}</p>
                  {v.maxPassengers ? (
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                      <span className="flex items-center gap-0.5">
                        <UsersIcon className="w-3 h-3" /> {v.maxPassengers} pax
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Vehicle picker */}
              {changingVehicleIndex === i && (
                <div className="mt-3 grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  {availableVehicles
                    .filter(av => av.id !== v.id)
                    .map(av => (
                      <button
                        key={av.id}
                        onClick={() => {
                          const updatedVehicles = [...quote.vehicles]
                          updatedVehicles[i] = {
                            ...updatedVehicles[i],
                            id: av.id,
                            name: av.name,
                            image: av.image,
                            maxPassengers: av.maxPassengers,
                            reason: 'Selected by customer',
                          }
                          const updatedRecs = [...quote.interpretation.vehicleRecommendations]
                          if (updatedRecs[i]) {
                            updatedRecs[i] = { ...updatedRecs[i], vehicleId: av.id, vehicleName: av.name, reason: 'Selected by customer' }
                          }
                          onUpdate({
                            ...quote,
                            vehicles: updatedVehicles,
                            interpretation: { ...quote.interpretation, vehicleRecommendations: updatedRecs },
                          })
                          setChangingVehicleIndex(null)
                        }}
                        className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-[#742F38] dark:hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-colors text-left"
                      >
                        {av.image && (
                          <div className="w-12 h-9 rounded overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-700">
                            <img src={av.image} alt={av.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{av.name}</span>
                          <div className="text-[11px] text-gray-400 dark:text-gray-500">
                            {av.maxPassengers && <span>{av.maxPassengers} pax</span>}
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add-ons */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
            <SparklesIcon className="w-4 h-4" />
            Add-ons <span className="font-normal text-gray-400">(optional)</span>
          </h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {WEDDING_ADD_ONS.map((addOn) => {
            const active = quote.interpretation.addOns.includes(addOn.id)
            return (
              <button
                key={addOn.id}
                type="button"
                onClick={() => toggleAddOn(addOn.id)}
                aria-pressed={active}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
              >
                <span
                  className={`mt-0.5 w-[18px] h-[18px] rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                    active
                      ? 'bg-[#742F38] border-[#742F38] text-white'
                      : 'border-gray-300 dark:border-gray-600 text-transparent'
                  }`}
                >
                  <CheckIcon className="w-3 h-3" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-gray-900 dark:text-white">{addOn.name}</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">{addOn.blurb}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Locations & passengers */}
      {(quote.interpretation.startingLocation || quote.interpretation.venue || quote.interpretation.passengers) && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-wrap gap-4">
          {quote.interpretation.startingLocation && (
            <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
              <MapPinIcon className="w-4 h-4 text-gray-400" />
              <span>Starts: {quote.interpretation.startingLocation}</span>
            </div>
          )}
          {quote.interpretation.venue && (
            <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
              <MapPinIcon className="w-4 h-4 text-gray-400" />
              <span>Venue: {quote.interpretation.venue}</span>
            </div>
          )}
          {quote.interpretation.passengers && (
            <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
              <UsersIcon className="w-4 h-4 text-gray-400" />
              <span>{quote.interpretation.passengers} passengers</span>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {quote.interpretation.notes && (
        <p className="text-xs text-gray-500 dark:text-gray-400 px-1 leading-relaxed">
          {quote.interpretation.notes}
        </p>
      )}
    </div>
  )
}
