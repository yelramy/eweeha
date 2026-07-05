'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckIcon, ChatBubbleLeftRightIcon, SparklesIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import Footer from '@/components/Footer'
import PhoneInput from '@/components/PhoneInput'
import Breadcrumbs from '@/components/Breadcrumbs'
import FleetVehicleImage from '@/components/FleetVehicleImage'
import BookingSSRFallback from './BookingSSRFallback'
import { events } from '@/lib/posthog'
import { useConfig } from '@/hooks/useConfig'
import { sortFleetForDisplay } from '@/lib/fleetCategories'
import { WEDDING_ADD_ONS, getAddOnName } from '@/lib/weddingAddOns'
import { Vehicle } from '@/types/vehicle'

/**
 * Wedding booking request — ONE day, your cars, your add-ons.
 * No start/end dates and no hour packages: weddings are a single day.
 * No prices shown; the request is recorded + emailed, and the couple
 * finishes on WhatsApp where we confirm availability and the quote.
 */
function WeddingBookingContent() {
  const searchParams = useSearchParams()
  const { appConfig } = useConfig()

  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)

  const [weddingDate, setWeddingDate] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [addOns, setAddOns] = useState<Set<string>>(new Set())
  const [startingLocation, setStartingLocation] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [query, setQuery] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const whatsappNumber = appConfig?.contact?.whatsapp || '96170971841'
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await fetch('/api/vehicles?available=true')
        const data = await res.json()
        if (data.success) {
          setVehicles(sortFleetForDisplay((data.data as Vehicle[]).filter(v => v.available)))
        }
      } catch (error) {
        console.error('Failed to fetch vehicles:', error)
        toast.error('Failed to load the fleet')
      } finally {
        setLoading(false)
      }
    }
    fetchVehicles()
  }, [])

  // Pre-select the car from "Book" buttons on the fleet pages (?vehicle=id)
  useEffect(() => {
    const urlVehicle = searchParams.get('vehicle')
    if (!urlVehicle || vehicles.length === 0) return
    const match = vehicles.find(v => String(v.id) === urlVehicle || v.slug === urlVehicle)
    if (match) {
      setSelectedIds(prev => {
        if (prev.has(String(match.id))) return prev
        const next = new Set(prev)
        next.add(String(match.id))
        return next
      })
    }
  }, [searchParams, vehicles])

  const filteredVehicles = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return vehicles
    return vehicles.filter(v => v.name.toLowerCase().includes(q))
  }, [vehicles, query])

  const selectedVehicles = vehicles.filter(v => selectedIds.has(String(v.id)))

  const toggleCar = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAddOn = (id: string) => {
    setAddOns(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const formattedDate = weddingDate
    ? new Date(`${weddingDate}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  const buildWhatsAppMessage = (): string => {
    const lines: string[] = ['Hi Eweeha! Wedding request:']
    lines.push(`Date: ${formattedDate || 'not set yet'}`)
    lines.push('Cars:')
    for (const v of selectedVehicles) lines.push(`* ${v.name}`)
    if (addOns.size > 0) lines.push(`Add-ons: ${[...addOns].map(getAddOnName).join(', ')}`)
    if (startingLocation.trim()) lines.push(`Day starts at: ${startingLocation.trim()}`)
    if (name.trim()) lines.push(`Name: ${name.trim()}`)
    if (notes.trim()) lines.push(`Notes: ${notes.trim()}`)
    lines.push('How much would this be?')
    return lines.join('\n')
  }

  const openWhatsApp = () => {
    events.whatsappClicked('booking_page')
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(buildWhatsAppMessage())}`, '_blank', 'noopener,noreferrer')
  }

  const handleSubmit = async () => {
    if (!weddingDate) {
      toast.error('Pick your wedding date')
      return
    }
    if (selectedVehicles.length === 0) {
      toast.error('Pick at least one car')
      return
    }
    if (!phone || phone.replace(/\D/g, '').length < 7) {
      toast.error('Enter your WhatsApp number so we can reply')
      return
    }

    setSubmitting(true)
    try {
      const detailLines = [
        `Cars: ${selectedVehicles.map(v => v.name).join(', ')}`,
        addOns.size > 0 ? `Add-ons: ${[...addOns].map(getAddOnName).join(', ')}` : '',
        notes.trim() ? `Notes: ${notes.trim()}` : '',
      ].filter(Boolean)

      const res = await fetch('/api/bookings/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: `Wedding day — ${selectedVehicles.length} car${selectedVehicles.length > 1 ? 's' : ''}`,
          pickupDate: weddingDate,
          pickupTime: addOns.has('early-arrival') ? 'By 11am (early arrival add-on)' : 'Standard (1-3pm)',
          startingLocation: startingLocation.trim() || 'To be confirmed',
          phone,
          customerName: name.trim() || undefined,
          notes: detailLines.join('\n'),
          requestedAt: new Date().toISOString(),
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send your request')
      }

      events.bookingStarted(selectedVehicles[0] ? String(selectedVehicles[0].id) : undefined)
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      console.error('Booking request failed:', error)
      toast.error(error instanceof Error ? error.message : 'Could not send the request. Try WhatsApp instead.')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Success screen ───
  if (submitted) {
    return (
      <div className="min-h-screen bg-cream-50 dark:bg-gray-900">
        <Breadcrumbs />
        <div className="w-full max-w-2xl mx-auto px-3 sm:px-6 py-10 sm:py-16">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-10 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center mb-4">
              <CheckIcon className="w-7 h-7 text-primary-700 dark:text-primary-300" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-charcoal-500 dark:text-white mb-2">Request received!</h1>
            <p className="text-warm-600 dark:text-gray-400 mb-1">
              {formattedDate ? `Your wedding on ${formattedDate}` : 'Your wedding'} — {selectedVehicles.length} car{selectedVehicles.length > 1 ? 's' : ''}
              {addOns.size > 0 ? `, with ${[...addOns].map(getAddOnName).join(', ').toLowerCase()}` : ''}.
            </p>
            <p className="text-warm-600 dark:text-gray-400 mb-8">
              We&apos;ll message you with availability and the price. Want the answer faster?
            </p>
            <button
              type="button"
              onClick={openWhatsApp}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#25D366] hover:bg-[#1DA851] text-white font-semibold shadow-sm transition-colors"
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5" />
              Send it on WhatsApp too
            </button>
            <div className="mt-8">
              <Link href="/" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                ← Back to the fleet
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-gray-900">
      <Breadcrumbs />

      <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-charcoal-500 dark:text-white">
            Book Your Wedding Cars
          </h1>
          <p className="text-warm-600 dark:text-gray-400 mt-2 text-sm sm:text-base">
            One day, your cars, your add-ons — we reply with availability and the price on WhatsApp.
          </p>
        </div>

        <div className="space-y-6">
          {/* 1 — Wedding date */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-charcoal-500 dark:text-white mb-1">
              1 · Your wedding date
            </h2>
            <p className="text-sm text-warm-600 dark:text-gray-400 mb-4">
              Cars usually arrive between 1 and 3pm and cover the whole wedding route.
            </p>
            <input
              type="date"
              value={weddingDate}
              min={today}
              onChange={(e) => setWeddingDate(e.target.value)}
              className="w-full max-w-xs px-4 py-3 text-base border border-warm-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-charcoal-600 dark:text-white focus:ring-2 focus:ring-primary-500"
              aria-label="Wedding date"
            />
          </section>

          {/* 2 — Cars */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
              <h2 className="text-lg sm:text-xl font-bold text-charcoal-500 dark:text-white">
                2 · Pick your cars
              </h2>
              <span className="text-sm text-warm-600 dark:text-gray-400">
                {selectedIds.size === 0 ? 'None selected yet' : `${selectedIds.size} selected`}
              </span>
            </div>
            <p className="text-sm text-warm-600 dark:text-gray-400 mb-4">
              Tap one or more — bridal car, convoy cars, a classic for the photos.
            </p>

            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name — e.g. Rolls, Jaguar, vintage…"
              className="w-full px-3 py-2.5 mb-4 text-sm border border-warm-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-charcoal-600 dark:text-white placeholder:text-warm-500 focus:ring-2 focus:ring-primary-500"
              aria-label="Search fleet"
            />

            {loading ? (
              <div className="py-12 text-center text-sm text-warm-600 dark:text-gray-400">Loading the fleet…</div>
            ) : filteredVehicles.length === 0 ? (
              <p className="py-8 text-center text-sm text-warm-600 dark:text-gray-400">
                {vehicles.length === 0 ? 'The fleet list isn\'t available right now — message us on WhatsApp.' : 'No cars match your search.'}
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[26rem] overflow-y-auto pr-1">
                {filteredVehicles.map((vehicle) => {
                  const id = String(vehicle.id)
                  const selected = selectedIds.has(id)
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleCar(id)}
                      aria-pressed={selected}
                      className={`relative text-left rounded-xl overflow-hidden border-2 transition-all ${
                        selected
                          ? 'border-primary-600 ring-2 ring-primary-300 dark:ring-primary-700 shadow-md'
                          : 'border-warm-200 dark:border-gray-700 hover:border-primary-300'
                      }`}
                    >
                      <FleetVehicleImage src={vehicle.images.main} alt={vehicle.name} variant="compact" />
                      {selected && (
                        <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center shadow z-10">
                          <CheckIcon className="w-4 h-4" />
                        </span>
                      )}
                      <div className={`px-3 py-2 ${selected ? 'bg-primary-50 dark:bg-primary-900/30' : 'bg-white dark:bg-gray-800'}`}>
                        <p className="text-sm font-medium text-charcoal-600 dark:text-white leading-tight line-clamp-2">{vehicle.name}</p>
                        {vehicle.maxPassengers ? (
                          <p className="text-[11px] text-warm-600 dark:text-gray-400">{vehicle.maxPassengers} passengers</p>
                        ) : null}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </section>

          {/* 3 — Add-ons */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-charcoal-500 dark:text-white mb-1">
              3 · Add-ons <span className="text-sm font-normal text-warm-500">(optional)</span>
            </h2>
            <p className="text-sm text-warm-600 dark:text-gray-400 mb-4">
              Priced per wedding — we include them in your quote.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {WEDDING_ADD_ONS.map((addOn) => {
                const active = addOns.has(addOn.id)
                return (
                  <button
                    key={addOn.id}
                    type="button"
                    onClick={() => toggleAddOn(addOn.id)}
                    aria-pressed={active}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                      active
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-warm-200 dark:border-gray-700 hover:border-primary-300'
                    }`}
                  >
                    <span
                      className={`mt-0.5 w-[18px] h-[18px] rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                        active ? 'bg-primary-600 border-primary-600 text-white' : 'border-warm-300 dark:border-gray-600 text-transparent'
                      }`}
                    >
                      <CheckIcon className="w-3 h-3" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-charcoal-600 dark:text-white">{addOn.name}</span>
                      <span className="block text-xs text-warm-600 dark:text-gray-400 mt-0.5">{addOn.blurb}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* 4 — Your details */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-charcoal-500 dark:text-white mb-4">
              4 · Your details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-charcoal-600 dark:text-gray-300 mb-1.5">
                  Phone or WhatsApp *
                </label>
                <PhoneInput value={phone} onChange={setPhone} placeholder="+961 XX XXX XXX" required />
              </div>
              <div>
                <label htmlFor="booking-name" className="block text-sm font-medium text-charcoal-600 dark:text-gray-300 mb-1.5">
                  Your name
                </label>
                <input
                  id="booking-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rita & Elie"
                  className="w-full px-3 py-2.5 text-base border border-warm-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-charcoal-600 dark:text-white placeholder:text-warm-400 focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label htmlFor="booking-location" className="block text-sm font-medium text-charcoal-600 dark:text-gray-300 mb-1.5">
                  Where does the day start?
                </label>
                <input
                  id="booking-location"
                  type="text"
                  value={startingLocation}
                  onChange={(e) => setStartingLocation(e.target.value)}
                  placeholder="e.g. bride's home in Achrafieh"
                  className="w-full px-3 py-2.5 text-base border border-warm-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-charcoal-600 dark:text-white placeholder:text-warm-400 focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label htmlFor="booking-notes" className="block text-sm font-medium text-charcoal-600 dark:text-gray-300 mb-1.5">
                  Anything else?
                </label>
                <input
                  id="booking-notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={500}
                  placeholder="e.g. ceremony in Harissa, venue in Faqra"
                  className="w-full px-3 py-2.5 text-base border border-warm-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-charcoal-600 dark:text-white placeholder:text-warm-400 focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </section>

          {/* Submit */}
          <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-gradient-to-br from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-medium py-3.5 px-5 rounded-lg transition-all duration-200 hover:shadow-sm flex items-center justify-center gap-2 text-sm sm:text-base tracking-wider border border-primary-700 disabled:opacity-50"
            >
              {submitting ? 'Sending…' : 'Send My Request'}
            </button>
            <p className="mt-3 text-xs text-center text-warm-600 dark:text-gray-400">
              No payment now — we confirm availability and the price on WhatsApp.
            </p>
            <div className="mt-4 pt-4 border-t border-warm-100 dark:border-gray-700 text-center">
              <Link href="/#booking" className="inline-flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 hover:underline">
                <SparklesIcon className="w-4 h-4" />
                Prefer to just type it? Use the AI planner
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default function BookingClient() {
  return (
    <Suspense fallback={<BookingSSRFallback />}>
      <WeddingBookingContent />
    </Suspense>
  )
}
