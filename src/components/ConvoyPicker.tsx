'use client'

import { useEffect, useState } from 'react'
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'
import ImageWithFallback from '@/components/ImageWithFallback'
import { Vehicle } from '@/types/vehicle'
import { useConfig } from '@/hooks/useConfig'
import { events } from '@/lib/posthog'

interface ConvoyPickerProps {
  isOpen: boolean
  onClose: () => void
  vehicles: Vehicle[]
}

/**
 * Tap-to-pick convoy builder: select cars from the fleet, then send the
 * selection (car NAMES only, no photos) to WhatsApp to ask about availability.
 */
export default function ConvoyPicker({ isOpen, onClose, vehicles }: ConvoyPickerProps) {
  const { appConfig } = useConfig()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [date, setDate] = useState('')

  // Lock page scroll + close on Escape while open
  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const toggle = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedVehicles = vehicles.filter(v => selectedIds.has(String(v.id)))
  const whatsappNumber = appConfig?.contact?.whatsapp || '96170971841'

  const handleSend = () => {
    if (selectedVehicles.length === 0) return
    const names = selectedVehicles.map(v => `• ${v.name}`).join('\n')
    const when = date
      ? new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : ''
    const message = when
      ? `Hi! I'm building my wedding convoy. Are these cars available on ${when}?\n\n${names}`
      : `Hi! I'm building my wedding convoy. Are these cars available on my wedding date?\n\n${names}`
    events.whatsappClicked('convoy_picker')
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label="Pick your cars">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-charcoal-600/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full sm:max-w-3xl sm:mx-4 max-h-[92dvh] sm:max-h-[85vh] bg-cream-50 dark:bg-gray-900 sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-warm-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl md:text-2xl text-charcoal-600 dark:text-white">Pick Your Cars</h2>
            <p className="text-xs md:text-sm text-warm-600 dark:text-gray-400 mt-1">
              Tap one or more cars you like — we&apos;ll check availability for you on WhatsApp.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -m-1 rounded-full text-warm-600 dark:text-gray-400 hover:bg-warm-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Optional date */}
        <div className="px-5 py-3 border-b border-warm-200 dark:border-gray-700 flex items-center gap-3">
          <label htmlFor="convoy-date" className="text-sm text-warm-700 dark:text-gray-300 whitespace-nowrap">
            Wedding date <span className="text-warm-500 dark:text-gray-500">(optional)</span>
          </label>
          <input
            id="convoy-date"
            type="date"
            value={date}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1 max-w-[200px] px-3 py-2 text-sm border border-warm-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-charcoal-600 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Car grid */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {vehicles.length === 0 ? (
            <p className="text-center text-sm text-warm-600 dark:text-gray-400 py-10">
              The fleet list isn&apos;t available right now — message us on WhatsApp and we&apos;ll send you the current cars.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {vehicles.map((vehicle) => {
                const id = String(vehicle.id)
                const selected = selectedIds.has(id)
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggle(id)}
                    aria-pressed={selected}
                    className={`relative text-left rounded-xl overflow-hidden border-2 transition-all ${
                      selected
                        ? 'border-primary-600 ring-2 ring-primary-300 dark:ring-primary-700 shadow-md'
                        : 'border-warm-200 dark:border-gray-700 hover:border-primary-300'
                    }`}
                  >
                    <div className="h-24 sm:h-28 bg-warm-100 dark:bg-gray-800 relative">
                      <ImageWithFallback
                        src={vehicle.images.main}
                        alt={vehicle.name}
                        width={300}
                        height={200}
                        quality={60}
                        className="w-full h-full object-cover"
                        fallback={<div className="w-full h-full bg-warm-100 dark:bg-gray-800" />}
                      />
                      {selected && (
                        <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center shadow">
                          <CheckIcon className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                    <div className={`px-3 py-2 ${selected ? 'bg-primary-50 dark:bg-primary-900/30' : 'bg-white dark:bg-gray-800'}`}>
                      <p className="text-sm font-medium text-charcoal-600 dark:text-white leading-tight truncate">{vehicle.name}</p>
                      {vehicle.maxPassengers ? (
                        <p className="text-[11px] text-warm-600 dark:text-gray-400">{vehicle.maxPassengers} passengers</p>
                      ) : null}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-warm-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-between gap-3" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
          <span className="text-sm text-warm-700 dark:text-gray-300">
            {selectedIds.size === 0 ? 'No cars selected yet' : `${selectedIds.size} car${selectedIds.size > 1 ? 's' : ''} selected`}
          </span>
          <button
            type="button"
            onClick={handleSend}
            disabled={selectedIds.size === 0}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#25D366] hover:bg-[#1DA851] text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Ask on WhatsApp
          </button>
        </div>
      </div>
    </div>
  )
}
