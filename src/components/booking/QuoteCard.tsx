'use client'

import { useState } from 'react'
import {
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  PencilIcon,
  PlusIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import type { QuoteResponse, QuoteDayPricing } from '@/app/api/ai/booking/interpret/route'

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

const serviceLabels: Record<string, string> = {
  'airport': 'Airport',
  '6h': 'Half Day (6h)',
  '10h': 'Full Day (10h)',
  'full-day': '24 Hours',
}

function formatDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

export default function QuoteCard({ quote, onUpdate, availableVehicles = [] }: QuoteCardProps) {
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editService, setEditService] = useState<'airport' | '6h' | '10h' | 'full-day'>('10h')
  const [changingVehicleIndex, setChangingVehicleIndex] = useState<number | null>(null)

  const today = new Date().toISOString().split('T')[0]

  const startEditDay = (index: number) => {
    const day = quote.interpretation.days[index]
    setEditDate(day.date)
    setEditService(day.serviceType)
    setEditingDayIndex(index)
  }

  const saveEditDay = () => {
    if (editingDayIndex === null) return
    const updated = { ...quote }
    const days = [...updated.interpretation.days]
    days[editingDayIndex] = { ...days[editingDayIndex], date: editDate, serviceType: editService }
    updated.interpretation = { ...updated.interpretation, days }
    onUpdate(updated)
    setEditingDayIndex(null)
  }

  const removeDay = (index: number) => {
    const updated = { ...quote }
    const days = [...updated.interpretation.days]
    days.splice(index, 1)
    updated.interpretation = { ...updated.interpretation, days }
    onUpdate(updated)
  }

  const addDay = () => {
    const updated = { ...quote }
    const days = [...updated.interpretation.days]
    let nextDate = today
    if (days.length > 0) {
      const lastDate = days[days.length - 1].date
      const [y, m, d] = lastDate.split('-').map(Number)
      const next = new Date(y, m - 1, d + 1)
      nextDate = next.toISOString().split('T')[0]
    }
    days.push({ date: nextDate, serviceType: '10h', label: 'Additional day' })
    updated.interpretation = { ...updated.interpretation, days }
    onUpdate(updated)
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

      {/* Trip Summary */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4" />
            Your Schedule
          </h3>
          <button
            onClick={addDay}
            className="text-xs text-[#0B6B3A] dark:text-green-400 hover:text-[#095c31] font-medium flex items-center gap-1"
          >
            <PlusIcon className="w-3.5 h-3.5" /> Add Day
          </button>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {quote.interpretation.days.map((day, i) => (
            <div key={i} className="px-4 py-3">
              {editingDayIndex === i ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    min={today}
                    className="flex-1 min-w-0 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-[#0B6B3A] dark:bg-gray-800 dark:text-white"
                  />
                  <div className="flex gap-1 flex-wrap">
                    {(['airport', '6h', '10h', 'full-day'] as const).map(st => (
                      <button
                        key={st}
                        onClick={() => setEditService(st)}
                        className={`px-2 py-1 text-xs rounded-md transition-all ${
                          editService === st
                            ? 'bg-[#0B6B3A] text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {st === 'airport' ? 'Airport' : st === 'full-day' ? '24h' : st}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={saveEditDay} className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded">
                      <CheckIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingDayIndex(null)} className="p-1.5 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(day.date)}</span>
                      <span className="inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                        {serviceLabels[day.serviceType] || day.serviceType}
                      </span>
                    </div>
                    {day.label && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{day.label}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <button
                      onClick={() => startEditDay(i)}
                      className="p-1.5 text-gray-400 hover:text-[#0B6B3A] hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                      aria-label="Edit day"
                    >
                      <PencilIcon className="w-3.5 h-3.5" />
                    </button>
                    {quote.interpretation.days.length > 1 && (
                      <button
                        onClick={() => removeDay(i)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                        aria-label="Remove day"
                      >
                        <XMarkIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Vehicle Recommendations */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recommended Vehicles</h3>
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
                        className="text-[11px] text-[#0B6B3A] dark:text-emerald-400 hover:text-[#095c31] font-medium flex-shrink-0 ml-2"
                      >
                        {changingVehicleIndex === i ? 'Cancel' : 'Change'}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{v.reason}</p>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                    {v.maxPassengers && (
                      <span className="flex items-center gap-0.5">
                        <UsersIcon className="w-3 h-3" /> {v.maxPassengers} pax
                      </span>
                    )}
                    {v.maxLuggage && (
                      <span>{v.maxLuggage} luggage</span>
                    )}
                  </div>
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
                            maxLuggage: av.maxLuggage,
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
                        className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-[#0B6B3A] dark:hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors text-left"
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

      {/* Location & Passengers */}
      {(quote.interpretation.startingLocation || quote.interpretation.passengers) && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-wrap gap-4">
          {quote.interpretation.startingLocation && (
            <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
              <MapPinIcon className="w-4 h-4 text-gray-400" />
              <span>{quote.interpretation.startingLocation}</span>
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

      {/* Pricing Breakdown */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Price Breakdown</h3>
        </div>
        <div className="p-4 space-y-2">
          {quote.pricing.days.map((day, i) => (
            <div key={i}>
              <div className="flex justify-between items-start text-sm">
                <div className="flex-1 min-w-0">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{formatDate(day.date)}</span>
                  <span className="text-gray-400 dark:text-gray-500 text-xs ml-1">({serviceLabels[day.serviceType]})</span>
                </div>
                <span className="text-gray-900 dark:text-white font-medium ml-2">${day.dayTotal.toFixed(2)}</span>
              </div>
              {day.vehiclePricing && day.vehiclePricing.length > 0 && (
                <div className="ml-3 mt-0.5 space-y-0.5">
                  {day.vehiclePricing.map((vp, j) => {
                    const vehicleIdx = quote.vehicles.findIndex(v => v.id === vp.vehicleId)
                    return (
                      <div key={j} className="flex justify-between text-[11px] text-gray-400 dark:text-gray-500">
                        <button
                          onClick={() => { if (vehicleIdx >= 0 && availableVehicles.length > 1) setChangingVehicleIndex(vehicleIdx) }}
                          className={`text-left ${availableVehicles.length > 1 ? 'underline decoration-dotted hover:text-[#0B6B3A] dark:hover:text-emerald-400 cursor-pointer' : ''}`}
                        >
                          {vp.vehicleName}{vp.quantity > 1 ? ` x${vp.quantity}` : ''}
                        </button>
                        <span>${vp.ratePerUnit.toFixed(2)}{vp.quantity > 1 ? ` x${vp.quantity} = $${vp.subtotal.toFixed(2)}` : ''}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}

          {quote.pricing.extrasBreakdown.length > 0 && (
            <>
              <div className="border-t border-gray-100 dark:border-gray-700 pt-2 mt-2">
                {quote.pricing.extrasBreakdown.map((extra, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{extra.name}</span>
                    <span className="text-gray-900 dark:text-white font-medium">${extra.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3 space-y-1.5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-700 dark:text-gray-300 font-medium">Total</span>
              <span className="text-gray-900 dark:text-white font-bold text-base">${quote.pricing.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">Pay online & save 10%</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold text-base">${quote.pricing.onlineTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {quote.interpretation.notes && (
        <p className="text-xs text-gray-500 dark:text-gray-400 px-1 leading-relaxed">
          {quote.interpretation.notes}
        </p>
      )}
    </div>
  )
}
