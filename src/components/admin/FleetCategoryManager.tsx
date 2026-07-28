'use client'

import { useState } from 'react'
import { FleetCategory, isNearBlack } from '@/lib/fleetCategories'

type EditState = { title: string; blurb: string; color: string; colorDark: string }

interface Props {
  categories: FleetCategory[]
  onChanged: () => Promise<void> | void
  notifyError: (msg: string) => void
  notifySuccess: (msg: string) => void
}

const emptyEdit = (c?: FleetCategory): EditState => ({
  title: c?.title ?? '',
  blurb: c?.blurb ?? '',
  color: c?.color ?? '',
  colorDark: c?.colorDark ?? '',
})

function normalizeHex(value: string): string | null {
  const v = value.trim()
  if (!v) return null
  return v.startsWith('#') ? v : `#${v}`
}

const PRESETS = [
  { label: 'Sleek black (dark row)', value: '#000000' },
  { label: 'Burgundy', value: '#742F38' },
  { label: 'Rose', value: '#DA9AA4' },
  { label: 'Gold', value: '#9C7838' },
  { label: 'Navy', value: '#1F2A44' },
  { label: 'Forest', value: '#2F4F3E' },
]

const isValidHex = (v: string) => /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(v.trim())

/**
 * Swatch buttons instead of a bare <input type="color">: the native colour
 * widget is unusable on several mobile browsers (renders as a dead dash), so
 * accents could never be saved from a phone.
 */
function AccentPicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (next: string) => void
}) {
  const selected = value.trim().toLowerCase()
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-[11px] text-gray-500 underline"
          >
            clear
          </button>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="No accent (default theme)"
          title="No accent (default theme)"
          className={`h-9 w-9 rounded-full bg-white text-[11px] text-gray-400 flex items-center justify-center ${
            selected ? 'border border-gray-300' : 'border-2 border-gray-900'
          }`}
        >
          none
        </button>
        {PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => onChange(p.value)}
            aria-label={p.label}
            title={p.label}
            style={{ backgroundColor: p.value }}
            className={`h-9 w-9 rounded-full ${
              selected === p.value.toLowerCase()
                ? 'border-2 border-gray-900 ring-2 ring-gray-400 ring-offset-1'
                : 'border border-gray-300'
            }`}
          />
        ))}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#hex"
          spellCheck={false}
          autoCapitalize="none"
          className={`w-24 border rounded px-2 py-1.5 text-xs font-mono ${
            value && !isValidHex(value) ? 'border-red-400 text-red-600' : ''
          }`}
        />
      </div>
    </div>
  )
}

export default function FleetCategoryManager({ categories, onChanged, notifyError, notifySuccess }: Props) {
  const [edits, setEdits] = useState<Record<string, EditState>>({})
  const [newTitle, setNewTitle] = useState('')
  const [newBlurb, setNewBlurb] = useState('')
  const [newColor, setNewColor] = useState('')
  const [newColorDark, setNewColorDark] = useState('')
  const [busy, setBusy] = useState(false)

  const getEdit = (c: FleetCategory) => edits[c.id] ?? emptyEdit(c)
  const setEdit = (id: string, patch: Partial<EditState>) =>
    setEdits((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? emptyEdit(categories.find((c) => c.id === id))), ...patch },
    }))

  const call = async (fn: () => Promise<Response>, okMsg: string) => {
    setBusy(true)
    try {
      const res = await fn()
      const result = await res.json()
      if (result.success) {
        notifySuccess(okMsg)
        await onChanged()
      } else {
        notifyError(result.error || 'Request failed')
      }
    } catch {
      notifyError('Network error')
    } finally {
      setBusy(false)
    }
  }

  const save = (c: FleetCategory) => {
    const e = getEdit(c)
    if (!e.title.trim()) return notifyError('Title is required')
    if (e.color && !isValidHex(e.color)) return notifyError('Light accent must be a hex colour like #000000')
    if (e.colorDark && !isValidHex(e.colorDark)) return notifyError('Dark accent must be a hex colour like #DA9AA4')
    return call(
      () => fetch('/api/fleet-categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: c.id,
          title: e.title.trim(),
          blurb: e.blurb.trim(),
          color: normalizeHex(e.color),
          colorDark: normalizeHex(e.colorDark),
        }),
      }),
      'Category updated'
    )
  }

  const add = () => {
    if (!newTitle.trim()) return notifyError('Title is required')
    if (newColor && !isValidHex(newColor)) return notifyError('Light accent must be a hex colour like #000000')
    if (newColorDark && !isValidHex(newColorDark)) return notifyError('Dark accent must be a hex colour like #DA9AA4')
    return call(
      () => fetch('/api/fleet-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          blurb: newBlurb.trim(),
          color: normalizeHex(newColor),
          colorDark: normalizeHex(newColorDark),
        }),
      }),
      'Category added'
    ).then(() => {
      setNewTitle('')
      setNewBlurb('')
      setNewColor('')
      setNewColorDark('')
    })
  }

  const remove = (c: FleetCategory) => {
    if (!confirm(`Delete "${c.title}"? Cars in it will be auto-assigned by name.`)) return
    return call(
      () => fetch(`/api/fleet-categories?id=${encodeURIComponent(c.id)}`, { method: 'DELETE' }),
      'Category deleted'
    )
  }

  const move = (index: number, dir: -1 | 1) => {
    const order = categories.map((c) => c.id)
    const target = index + dir
    if (target < 0 || target >= order.length) return
    ;[order[index], order[target]] = [order[target], order[index]]
    return call(
      () => fetch('/api/fleet-categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order }),
      }),
      'Order updated'
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        Accent colours tint the category header on the homepage. Pick <strong>black</strong> to turn the
        whole row into a sleek dark section with gold buttons. Choose <em>none</em> for the default theme.
      </p>
      {categories.map((c, i) => {
        const e = getEdit(c)
        const dirty =
          e.title !== c.title ||
          e.blurb !== c.blurb ||
          (e.color || '') !== (c.color || '') ||
          (e.colorDark || '') !== (c.colorDark || '')
        return (
          <div key={c.id} className="border rounded-lg p-3 space-y-3">
            <div className="flex items-start gap-2">
              <div className="flex flex-col gap-0.5 pt-0.5">
                <button type="button" disabled={busy || i === 0} onClick={() => move(i, -1)} className="text-xs px-1.5 py-0.5 border rounded disabled:opacity-30">▲</button>
                <button type="button" disabled={busy || i === categories.length - 1} onClick={() => move(i, 1)} className="text-xs px-1.5 py-0.5 border rounded disabled:opacity-30">▼</button>
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <input
                  value={e.title}
                  onChange={(ev) => setEdit(c.id, { title: ev.target.value })}
                  className="w-full border rounded px-2 py-1.5 text-sm"
                  placeholder="Title"
                  dir="auto"
                />
                <input
                  value={e.blurb}
                  onChange={(ev) => setEdit(c.id, { blurb: ev.target.value })}
                  className="w-full border rounded px-2 py-1.5 text-sm"
                  placeholder="Short description"
                  dir="auto"
                />
              </div>
            </div>

            <AccentPicker
              label="Accent colour"
              value={e.color}
              onChange={(next) => setEdit(c.id, { color: next })}
            />
            {isNearBlack(e.color) ? (
              <p className="text-[11px] text-gray-600 bg-gray-100 rounded px-2 py-1.5">
                This row will render as a sleek black section on the homepage.
              </p>
            ) : (
              <AccentPicker
                label="Dark-mode accent (optional)"
                value={e.colorDark}
                onChange={(next) => setEdit(c.id, { colorDark: next })}
              />
            )}

            <div className="flex items-center gap-2">
              <button type="button" disabled={busy || !dirty} onClick={() => save(c)} className="text-sm px-4 py-1.5 rounded bg-gray-900 text-white disabled:opacity-30">Save</button>
              <button type="button" disabled={busy} onClick={() => remove(c)} className="text-sm px-4 py-1.5 rounded border border-red-300 text-red-600 disabled:opacity-30">Delete</button>
            </div>
          </div>
        )
      })}

      <div className="border border-dashed rounded-lg p-3 space-y-3">
        <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="New category title" dir="auto" />
        <input value={newBlurb} onChange={(e) => setNewBlurb(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="Short description" dir="auto" />
        <AccentPicker label="Accent colour" value={newColor} onChange={setNewColor} />
        {!isNearBlack(newColor) ? (
          <AccentPicker label="Dark-mode accent (optional)" value={newColorDark} onChange={setNewColorDark} />
        ) : null}
        <button type="button" disabled={busy} onClick={add} className="text-sm px-4 py-1.5 rounded bg-gray-900 text-white disabled:opacity-30">Add category</button>
      </div>
    </div>
  )
}
