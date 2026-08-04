'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import AdminLayout from '@/components/AdminLayout'
import { Vehicle } from '@/types/vehicle'
import { useNotification } from '@/contexts/NotificationContext'
import { adminOperations } from '@/utils/adminApi'
import { pickFromGooglePhotos } from '@/lib/googlePhotosPicker'
import FleetCategoryManager from '@/components/admin/FleetCategoryManager'
import { FleetCategory } from '@/lib/fleetCategories'

const EMPTY_SECTION = () => ({
  id: `s${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
  title: '',
  body: '',
})

export default function FleetManagement() {
  const notification = useNotification()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [fleetCategories, setFleetCategories] = useState<FleetCategory[]>([])
  const [showCategories, setShowCategories] = useState(false)
  const [googleStatus, setGoogleStatus] = useState('')
  const [showOffBundleCars, setShowOffBundleCars] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    name: '', price: 0, features: '', description: '',
    specifications: { seating: '', luggage: '', transmission: '' },
    available: true, quantity: 1, showOnHomepage: false, displayOrder: 0,
    model: '', year: new Date().getFullYear(), fleetCategories: [] as string[],
    priceBeirut: 0, priceBatrounSaida: 0, priceFurther: 0,
    maxPassengers: 1, maxLuggage: 0, seatingLayout: '',
    ceilingType: '' as '' | 'standard' | 'high',
    variants: [] as Array<{id: string, name: string, seating: string, maxPassengers: number}>,
    availableExtras: [] as Array<{id: string, name: string, price: number, perDay: boolean}>,
    descriptionTitle: '',
    detailSections: [EMPTY_SECTION()] as Array<{id: string, title: string, body: string}>,
    bundleTitle: '',
    bundleBody: '',
    bundleVehicleIds: [] as string[]
  })

  const fetchVehicles = useCallback(async () => {
    setLoading(true)
    try {
      const response = await adminOperations.vehicles.getAll(notification)
      if (response.success && 'data' in response && response.data) {
        setVehicles(response.data as Vehicle[])
      }
    } catch {
      notification.error('Failed to load vehicles')
    } finally {
      setLoading(false)
    }
  }, [notification])

  useEffect(() => { fetchVehicles() }, [fetchVehicles])

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/fleet-categories')
      const result = await res.json()
      if (result.success) setFleetCategories(result.data)
    } catch {
      notification.error('Failed to load categories')
    }
  }, [notification])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  const handleImageUpload = async (files: FileList | null) => {
    if (!files) return
    setUploadingImages(true)
    const newImages: string[] = []
    const failed: string[] = []
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'eweeha/fleet')
        const response = await fetch('/api/images/upload', { method: 'POST', body: formData })
        const result = await response.json()
        if (result.success) {
          newImages.push(result.data.secure_url)
        } else {
          failed.push(result.error || 'upload failed')
        }
      }
      setUploadedImages(prev => [...prev, ...newImages])
      if (failed.length > 0) {
        notification.error(`${failed.length} photo(s) failed to upload: ${failed[0]}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      notification.error('Photo upload failed — network error')
    } finally {
      setUploadingImages(false)
    }
  }

  const handleGooglePhotos = async () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) {
      notification.error('Google Photos is not configured')
      return
    }
    setUploadingImages(true)
    try {
      const { token, items } = await pickFromGooglePhotos(clientId, setGoogleStatus)
      if (items.length === 0) {
        setGoogleStatus('')
        return
      }
      const newImages: string[] = []
      for (let i = 0; i < items.length; i++) {
        setGoogleStatus(`Importing ${i + 1} of ${items.length}...`)
        const response = await fetch('/api/images/import-google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ baseUrl: items[i].baseUrl, token, filename: items[i].filename, folder: 'eweeha/fleet' })
        })
        const result = await response.json()
        if (result.success) newImages.push(result.data.secure_url)
      }
      setUploadedImages(prev => [...prev, ...newImages])
      setGoogleStatus('')
      if (newImages.length < items.length) {
        notification.error(`${items.length - newImages.length} photo(s) failed to import`)
      }
    } catch (error) {
      setGoogleStatus('')
      notification.error(error instanceof Error ? error.message : 'Google Photos import failed')
    } finally {
      setUploadingImages(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    // The "Eweeha for the …" section keeps its default heading when the admin
    // only filled in the text; blank sections are dropped entirely.
    const detailSections = formData.detailSections
      .map((s, i) =>
        i === 0 && !s.title.trim() && s.body.trim()
          ? { ...s, title: `Eweeha for the ${formData.name}` }
          : s
      )
      .filter((s) => s.title.trim() || s.body.trim())
    const vehicleData = {
      ...formData,
      detailSections,
      features: formData.features.split(',').map(f => f.trim()).filter(f => f),
      images: {
        main: uploadedImages[0] || editingVehicle?.images.main || '/images/fleet/standard.svg',
        gallery: uploadedImages.length > 0 ? uploadedImages.slice(1) : editingVehicle?.images.gallery ?? []
      },
      priceBeirut: formData.priceBeirut || undefined,
      priceBatrounSaida: formData.priceBatrounSaida || undefined,
      priceFurther: formData.priceFurther || undefined,
      maxPassengers: formData.maxPassengers || undefined,
      maxLuggage: formData.maxLuggage || undefined,
      ceilingType: formData.ceilingType || undefined,
    }
    try {
      const url = editingVehicle ? `/api/vehicles?id=${editingVehicle.id}` : '/api/vehicles'
      const method = editingVehicle ? 'PUT' : 'POST'
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(vehicleData) })
      const result = await response.json()
      if (result.success) {
        notification.success(`Vehicle ${editingVehicle ? 'updated' : 'added'}`)
        await fetchVehicles()
        resetForm()
      } else {
        const fieldErrors = result.details?.fieldErrors as Record<string, string[]> | undefined
        const detail = fieldErrors
          ? Object.entries(fieldErrors).map(([field, msgs]) => `${field}: ${msgs.join(', ')}`).join(' | ')
          : ''
        notification.error(detail ? `${result.error || 'Failed to save'} — ${detail}` : (result.error || 'Failed to save'))
      }
    } catch (error) {
      console.error('Error:', error)
      notification.error('Failed to save — network error, please try again')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '', price: 0, features: '', description: '',
      specifications: { seating: '', luggage: '', transmission: '' },
      available: true, quantity: 1, showOnHomepage: false, displayOrder: 0,
      model: '', year: new Date().getFullYear(), fleetCategories: [] as string[],
      priceBeirut: 0, priceBatrounSaida: 0, priceFurther: 0,
      maxPassengers: 0, maxLuggage: 0, seatingLayout: '', ceilingType: '',
      variants: [], availableExtras: [],
      descriptionTitle: '', detailSections: [EMPTY_SECTION()], bundleTitle: '', bundleBody: '', bundleVehicleIds: []
    })
    setUploadedImages([])
    setShowAddForm(false)
    setEditingVehicle(null)
  }

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setFormData({
      ...vehicle,
      features: vehicle.features.join(', '),
      quantity: vehicle.quantity || 1,
      showOnHomepage: vehicle.showOnHomepage || false,
      displayOrder: vehicle.displayOrder || 0,
      model: vehicle.model || '',
      year: vehicle.year || new Date().getFullYear(),
      fleetCategories: vehicle.fleetCategories || [],
      priceBeirut: vehicle.priceBeirut || 0,
      priceBatrounSaida: vehicle.priceBatrounSaida || 0,
      priceFurther: vehicle.priceFurther || 0,
      maxPassengers: vehicle.maxPassengers || 0,
      maxLuggage: vehicle.maxLuggage || 0,
      seatingLayout: vehicle.seatingLayout || '',
      ceilingType: vehicle.ceilingType || '',
      variants: vehicle.variants || [],
      availableExtras: vehicle.availableExtras || [],
      descriptionTitle: vehicle.descriptionTitle || '',
      detailSections: vehicle.detailSections?.length ? vehicle.detailSections : [EMPTY_SECTION()],
      bundleTitle: vehicle.bundleTitle || '',
      bundleBody: vehicle.bundleBody || '',
      bundleVehicleIds: vehicle.bundleVehicleIds || []
    })
    setUploadedImages([vehicle.images.main, ...vehicle.images.gallery])
    setShowAddForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this vehicle?')) return
    try {
      const response = await fetch(`/api/vehicles?id=${id}`, { method: 'DELETE' })
      const result = await response.json()
      if (result.success) {
        notification.success('Deleted')
        await fetchVehicles()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const addDetailSection = () => {
    setFormData({
      ...formData,
      detailSections: [...formData.detailSections, EMPTY_SECTION()]
    })
  }

  const updateDetailSection = (index: number, patch: Partial<{title: string, body: string}>) => {
    setFormData({
      ...formData,
      detailSections: formData.detailSections.map((s, i) => i === index ? { ...s, ...patch } : s)
    })
  }

  const removeDetailSection = (index: number) => {
    setFormData({
      ...formData,
      detailSections: formData.detailSections.filter((_, i) => i !== index)
    })
  }

  const toggleBundleVehicle = (id: string) => {
    setFormData({
      ...formData,
      bundleVehicleIds: formData.bundleVehicleIds.includes(id)
        ? formData.bundleVehicleIds.filter((v) => v !== id)
        : [...formData.bundleVehicleIds, id]
    })
  }

  const bundleCandidates = vehicles.filter((v) => v.id !== editingVehicle?.id)
  const unavailableBundlePicks = bundleCandidates.filter(
    (v) => formData.bundleVehicleIds.includes(v.id) && !v.available
  )
  const offCandidateCount = bundleCandidates.filter((v) => !v.available).length
  // Switched-off cars are hidden by default; already-picked ones stay visible so
  // they can be unpicked.
  const visibleBundleCandidates = bundleCandidates.filter(
    (v) => v.available || showOffBundleCars || formData.bundleVehicleIds.includes(v.id)
  )

  return (
    <AdminLayout>
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Fleet</h1>
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={() => setShowCategories(!showCategories)} className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-100 flex-1 sm:flex-none">Categories</button>
            <button onClick={() => setShowAddForm(true)} className="px-3 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800 flex-1 sm:flex-none">+ Add Vehicle</button>
          </div>
        </div>

        {showCategories && (
          <div className="border border-gray-300 rounded p-4 mb-4 bg-white">
            <h3 className="font-semibold mb-3">Fleet Categories</h3>
            <p className="text-xs text-gray-500 mb-3">These are the rows shown on the homepage & fleet pages. Cars without an assigned category are placed automatically based on their name.</p>
            <FleetCategoryManager
              categories={fleetCategories}
              onChanged={fetchCategories}
              notifyError={notification.error}
              notifySuccess={notification.success}
            />
          </div>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="border border-gray-300 rounded p-4 mb-4 bg-white">
            <h3 className="font-semibold mb-4">{editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-gray-600 mb-1">Name *</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-2 py-2 border border-gray-300 rounded" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-600 mb-1">Categories</label>
                  <div className="flex flex-wrap gap-2">
                    {fleetCategories.map((c) => {
                      const selected = formData.fleetCategories.includes(c.id)
                      return (
                        <button
                          type="button"
                          key={c.id}
                          aria-pressed={selected}
                          onClick={() => setFormData({
                            ...formData,
                            fleetCategories: selected
                              ? formData.fleetCategories.filter((id) => id !== c.id)
                              : [...formData.fleetCategories, c.id],
                          })}
                          className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                            selected
                              ? 'bg-gray-900 text-white border-gray-900'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'
                          }`}
                        >
                          {selected ? '✓ ' : ''}{c.title}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.fleetCategories.length === 0
                      ? 'No categories selected — the car is placed automatically by its name.'
                      : `Shown in ${formData.fleetCategories.length} ${formData.fleetCategories.length === 1 ? 'category' : 'categories'}.`}
                  </p>
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Beirut District ($) *</label>
                  <input type="number" required value={formData.priceBeirut || ''} onChange={(e) => setFormData({...formData, priceBeirut: Number(e.target.value) || 0})} className="w-full px-2 py-2 border border-gray-300 rounded" />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Batroun/Saida ($) *</label>
                  <input type="number" required value={formData.priceBatrounSaida || ''} onChange={(e) => setFormData({...formData, priceBatrounSaida: Number(e.target.value) || 0})} className="w-full px-2 py-2 border border-gray-300 rounded" />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Further ($) *</label>
                  <input type="number" required value={formData.priceFurther || ''} onChange={(e) => setFormData({...formData, priceFurther: Number(e.target.value) || 0})} className="w-full px-2 py-2 border border-gray-300 rounded" />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Passengers *</label>
                  <input type="number" required value={formData.maxPassengers || ''} onChange={(e) => setFormData({...formData, maxPassengers: Number(e.target.value) || 0})} className="w-full px-2 py-2 border border-gray-300 rounded" />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Luggage</label>
                  <input type="number" value={formData.maxLuggage || ''} onChange={(e) => setFormData({...formData, maxLuggage: Number(e.target.value) || 0})} className="w-full px-2 py-2 border border-gray-300 rounded" />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Quantity</label>
                  <input type="number" min="1" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: Math.max(1, Number(e.target.value))})} className="w-full px-2 py-2 border border-gray-300 rounded" />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Order</label>
                  <input type="number" value={formData.displayOrder || ''} onChange={(e) => setFormData({...formData, displayOrder: Number(e.target.value) || 0})} className="w-full px-2 py-2 border border-gray-300 rounded" />
                </div>
              </div>
              <div>
                <label className="block text-gray-600 mb-1 text-sm">Features (comma-separated)</label>
                <input type="text" value={formData.features} onChange={(e) => setFormData({...formData, features: e.target.value})} className="w-full px-2 py-2 border border-gray-300 rounded text-sm" placeholder="AC, GPS, Bluetooth" />
              </div>
              {/* Detail page content — the sections shown on the car's public page, in order */}
              <div className="border border-gray-200 rounded p-3 bg-gray-50 space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-800">Detail page content</h4>
                  <p className="text-xs text-gray-500">The sections shown on the car&apos;s public page, in this order. A heading left blank falls back to the grey placeholder.</p>
                </div>

                <div className="border border-gray-300 rounded p-2 bg-white space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Section 1 — description</p>
                  <input
                    type="text"
                    value={formData.descriptionTitle}
                    onChange={(e) => setFormData({...formData, descriptionTitle: e.target.value})}
                    placeholder="Description"
                    className="w-full px-2 py-2 border border-gray-300 rounded text-[15px] font-semibold text-gray-900"
                  />
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="What this car is, and why couples pick it."
                    className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>

                {formData.detailSections.map((section, i) => (
                  <div key={section.id} className="border border-gray-300 rounded p-2 bg-white space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Section {i + 2}{i === 0 ? ' — what Eweeha includes' : ''}
                      </p>
                      {i > 0 && (
                        <button type="button" onClick={() => removeDetailSection(i)} className="px-2 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50">Remove</button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => updateDetailSection(i, { title: e.target.value })}
                      placeholder={i === 0 ? `Eweeha for the ${formData.name || 'car'}` : 'Section heading'}
                      className="w-full px-2 py-2 border border-gray-300 rounded text-[15px] font-semibold text-gray-900"
                    />
                    <textarea
                      rows={3}
                      value={section.body}
                      onChange={(e) => updateDetailSection(i, { body: e.target.value })}
                      placeholder={i === 0 ? 'Chauffeur, ribbons and flowers, timing on the day…' : 'Section text'}
                      className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                ))}

                <div className="border border-gray-300 rounded p-2 bg-white space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Section {formData.detailSections.length + 2} — bundle with other cars
                  </p>
                  <input
                    type="text"
                    value={formData.bundleTitle}
                    onChange={(e) => setFormData({...formData, bundleTitle: e.target.value})}
                    placeholder={`Pairs well with the ${formData.name || 'car'}`}
                    className="w-full px-2 py-2 border border-gray-300 rounded text-[15px] font-semibold text-gray-900"
                  />
                  <textarea
                    rows={2}
                    value={formData.bundleBody}
                    onChange={(e) => setFormData({...formData, bundleBody: e.target.value})}
                    placeholder="e.g. Take 2 of these for the parents and one for the bridal party."
                    className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
                  />
                  {bundleCandidates.length === 0 ? (
                    <p className="text-xs text-gray-500">Save the car first, then pick cars to bundle with it.</p>
                  ) : (
                    <>
                      {offCandidateCount > 0 && (
                        <label className="flex items-center gap-1.5 text-xs text-gray-600 py-0.5">
                          <input
                            type="checkbox"
                            checked={showOffBundleCars}
                            onChange={(e) => setShowOffBundleCars(e.target.checked)}
                            className="w-3.5 h-3.5"
                          />
                          Show switched-off cars ({offCandidateCount})
                        </label>
                      )}
                      <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                        {visibleBundleCandidates.map((v) => {
                          const selected = formData.bundleVehicleIds.includes(v.id)
                          return (
                            <button
                              type="button"
                              key={v.id}
                              aria-pressed={selected}
                              onClick={() => toggleBundleVehicle(v.id)}
                              className={`px-2 py-1 rounded border text-xs leading-tight transition-colors ${
                                selected
                                  ? 'bg-gray-900 text-white border-gray-900'
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'
                              }`}
                            >
                              {selected ? '✓ ' : ''}{v.name}
                              {v.available ? '' : <span className={selected ? 'text-gray-400' : 'text-gray-400'}> · off</span>}
                            </button>
                          )
                        })}
                      </div>
                      <p className="text-xs text-gray-500">
                        {formData.bundleVehicleIds.length === 0
                          ? 'No cars selected — the bundle section is hidden on the public page.'
                          : `${formData.bundleVehicleIds.length} car(s) recommended with this one.`}
                      </p>
                      {unavailableBundlePicks.length > 0 && (
                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                          {unavailableBundlePicks.map((v) => v.name).join(', ')}{' '}
                          {unavailableBundlePicks.length === 1
                            ? "is switched off, so it won't"
                            : "are switched off, so they won't"}{' '}
                          show on the public page. Tick Available on that car to include it.
                        </p>
                      )}
                    </>
                  )}
                </div>

                <button type="button" onClick={addDetailSection} className="px-3 py-2 text-xs border border-gray-300 rounded bg-white hover:bg-gray-100">
                  + Add another section
                </button>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2 py-1">
                  <input type="checkbox" checked={formData.available} onChange={(e) => setFormData({...formData, available: e.target.checked})} className="w-4 h-4" />
                  Available
                </label>
              </div>
              <div>
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImages} className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">
                  {uploadingImages ? 'Uploading...' : 'Upload Images'}
                </button>
                <button type="button" onClick={handleGooglePhotos} disabled={uploadingImages} className="ml-2 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">
                  Google Photos
                </button>
                {googleStatus && <span className="ml-2 text-sm text-gray-500">{googleStatus}</span>}
                <input type="file" ref={fileInputRef} multiple accept="image/*" onChange={(e) => handleImageUpload(e.target.files)} className="hidden" />
                {uploadedImages.length > 0 && (
                  <>
                    <p className="text-xs text-gray-500 mt-2">The first photo is the cover shown on the homepage and fleet cards. Tap ★ to make a photo the cover, ‹ › to reorder the gallery.</p>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {uploadedImages.map((url, i) => {
                        const move = (from: number, to: number) => {
                          const next = [...uploadedImages]
                          next.splice(to, 0, ...next.splice(from, 1))
                          setUploadedImages(next)
                        }
                        return (
                          <div key={url + i} className={`relative rounded ${i === 0 ? 'ring-2 ring-amber-500' : ''}`}>
                            <Image src={url} alt="" width={96} height={64} className="w-24 h-16 object-cover rounded border" />
                            {i === 0 && (
                              <span className="absolute top-0 left-0 bg-amber-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-br rounded-tl">COVER</span>
                            )}
                            <button type="button" title="Remove" onClick={() => setUploadedImages(uploadedImages.filter((_, idx) => idx !== i))} className="absolute -top-1.5 -right-1.5 bg-gray-900 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">×</button>
                            <div className="absolute bottom-0 inset-x-0 flex justify-center gap-1 bg-black/45 rounded-b py-0.5">
                              {i > 0 && (
                                <button type="button" title="Make cover" onClick={() => move(i, 0)} className="text-amber-300 text-xs px-1 leading-none">★</button>
                              )}
                              {i > 0 && (
                                <button type="button" title="Move left" onClick={() => move(i, i - 1)} className="text-white text-xs px-1 leading-none">‹</button>
                              )}
                              {i < uploadedImages.length - 1 && (
                                <button type="button" title="Move right" onClick={() => move(i, i + 1)} className="text-white text-xs px-1 leading-none">›</button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-2 pt-2 border-t border-gray-200">
                <button type="submit" disabled={submitting} className="flex-1 sm:flex-none px-4 py-2 bg-gray-900 text-white rounded text-sm disabled:opacity-50">
                  {submitting ? 'Saving...' : (editingVehicle ? 'Update' : 'Add')}
                </button>
                <button type="button" onClick={resetForm} className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded text-sm">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Vehicles */}
        {loading ? (
          <p className="text-gray-500 text-sm">Loading...</p>
        ) : vehicles.length === 0 ? (
          <p className="text-gray-500 text-sm py-8 text-center">No vehicles. Click &quot;+ Add Vehicle&quot; to add one.</p>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="sm:hidden space-y-3">
              {vehicles.map((v) => (
                <div key={v.id} className="border border-gray-300 rounded p-3 bg-white">
                  <div className="flex gap-3">
                    <Image src={v.images.main} alt={v.name} width={60} height={40} className="w-16 h-12 object-cover rounded border" />
                    <div className="flex-1">
                      <div className="font-medium">{v.name}</div>
                      <div className="text-sm text-gray-500">{v.maxPassengers || v.capacity} pax • Qty: {v.quantity}</div>
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 h-fit ${v.available ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                      {v.available ? 'On' : 'Off'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200 text-sm">
                    <div className="text-gray-600">
                      {v.priceBeirut ? <span className="mr-2">Beirut: ${v.priceBeirut}</span> : null}
                      {v.priceBatrounSaida ? <span className="mr-2">Batroun/Saida: ${v.priceBatrounSaida}</span> : null}
                      {v.priceFurther ? <span>Further: ${v.priceFurther}</span> : null}
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => handleEdit(v)} className="text-primary-600 py-1">Edit</button>
                      <button onClick={() => handleDelete(v.id)} className="text-red-600 py-1">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm border border-gray-300 min-w-[600px]">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-3 py-2 text-left font-medium text-gray-700 border-r border-b border-gray-300">Vehicle</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700 border-r border-b border-gray-300">Beirut</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700 border-r border-b border-gray-300">Batroun/Saida</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700 border-r border-b border-gray-300">Further</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-700 border-r border-b border-gray-300">Pax</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-700 border-r border-b border-gray-300 hidden md:table-cell">Qty</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-700 border-r border-b border-gray-300">Status</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 border-b border-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((v, i) => (
                    <tr key={v.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-2 border-r border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <Image src={v.images.main} alt={v.name} width={40} height={28} className="w-10 h-7 object-cover rounded border" />
                          <div className="font-medium">{v.name}</div>
                        </div>
                      </td>
                      <td className="px-3 py-2 border-r border-b border-gray-200 text-right">{v.priceBeirut ? `$${v.priceBeirut}` : '-'}</td>
                      <td className="px-3 py-2 border-r border-b border-gray-200 text-right">{v.priceBatrounSaida ? `$${v.priceBatrounSaida}` : '-'}</td>
                      <td className="px-3 py-2 border-r border-b border-gray-200 text-right">{v.priceFurther ? `$${v.priceFurther}` : '-'}</td>
                      <td className="px-3 py-2 border-r border-b border-gray-200 text-center">{v.maxPassengers || v.capacity || '-'}</td>
                      <td className="px-3 py-2 border-r border-b border-gray-200 text-center hidden md:table-cell">{v.quantity}</td>
                      <td className="px-3 py-2 border-r border-b border-gray-200 text-center">
                        <span className={`text-xs px-1.5 py-0.5 ${v.available ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                          {v.available ? 'On' : 'Off'}
                        </span>
                      </td>
                      <td className="px-3 py-2 border-b border-gray-200">
                        <div className="flex gap-2 text-xs">
                          <button onClick={() => handleEdit(v)} className="text-primary-600 hover:underline py-1">Edit</button>
                          <button onClick={() => handleDelete(v.id)} className="text-red-600 hover:underline py-1">Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
