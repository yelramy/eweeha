'use client'

import { useState } from 'react'
import { FleetCategory } from '@/lib/fleetCategories'

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
        Optional accent colors tint category headers on the homepage (and groom-style dark rows). Leave blank for the default theme.
      </p>
      {categories.map((c, i) => {
        const e = getEdit(c)
        const dirty =
          e.title !== c.title ||
          e.blurb !== c.blurb ||
          (e.color || '') !== (c.color || '') ||
          (e.colorDark || '') !== (c.colorDark || '')
        return (
          <div key={c.id} className="flex flex-wrap items-center gap-2 border rounded-lg p-3">
            <div className="flex flex-col gap-0.5">
              <button type="button" disabled={busy || i === 0} onClick={() => move(i, -1)} className="text-xs px-1 border rounded disabled:opacity-30">▲</button>
              <button type="button" disabled={busy || i === categories.length - 1} onClick={() => move(i, 1)} className="text-xs px-1 border rounded disabled:opacity-30">▼</button>
            </div>
            <input value={e.title} onChange={(ev) => setEdit(c.id, { title: ev.target.value })} className="border rounded px-2 py-1 text-sm w-56" placeholder="Title" dir="auto" />
            <input value={e.blurb} onChange={(ev) => setEdit(c.id, { blurb: ev.target.value })} className="border rounded px-2 py-1 text-sm flex-1 min-w-48" placeholder="Short description" dir="auto" />
            <label className="flex items-center gap-1 text-xs text-gray-600" title="Light mode accent">
              Light
              <input
                type="color"
                value={e.color && /^#([0-9A-Fa-f]{6})$/.test(e.color) ? e.color : '#742F38'}
                onChange={(ev) => setEdit(c.id, { color: ev.target.value })}
                className="h-8 w-10 cursor-pointer border rounded"
              />
              <button type="button" className="text-[10px] underline disabled:opacity-30" disabled={!e.color} onClick={() => setEdit(c.id, { color: '' })}>clear</button>
            </label>
            <label className="flex items-center gap-1 text-xs text-gray-600" title="Dark mode accent">
              Dark
              <input
                type="color"
                value={e.colorDark && /^#([0-9A-Fa-f]{6})$/.test(e.colorDark) ? e.colorDark : (e.color && /^#([0-9A-Fa-f]{6})$/.test(e.color) ? e.color : '#DA9AA4')}
                onChange={(ev) => setEdit(c.id, { colorDark: ev.target.value })}
                className="h-8 w-10 cursor-pointer border rounded"
              />
              <button type="button" className="text-[10px] underline disabled:opacity-30" disabled={!e.colorDark} onClick={() => setEdit(c.id, { colorDark: '' })}>clear</button>
            </label>
            <button type="button" disabled={busy || !dirty} onClick={() => save(c)} className="text-sm px-3 py-1 rounded bg-gray-900 text-white disabled:opacity-30">Save</button>
            <button type="button" disabled={busy} onClick={() => remove(c)} className="text-sm px-3 py-1 rounded border border-red-300 text-red-600 disabled:opacity-30">Delete</button>
          </div>
        )
      })}
      <div className="flex flex-wrap items-center gap-2 border border-dashed rounded-lg p-3">
        <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="border rounded px-2 py-1 text-sm w-56" placeholder="New category title" dir="auto" />
        <input value={newBlurb} onChange={(e) => setNewBlurb(e.target.value)} className="border rounded px-2 py-1 text-sm flex-1 min-w-48" placeholder="Short description" dir="auto" />
        <label className="flex items-center gap-1 text-xs text-gray-600">
          Light
          <input type="color" value={newColor && /^#([0-9A-Fa-f]{6})$/.test(newColor) ? newColor : '#742F38'} onChange={(e) => setNewColor(e.target.value)} className="h-8 w-10 cursor-pointer border rounded" />
        </label>
        <label className="flex items-center gap-1 text-xs text-gray-600">
          Dark
          <input type="color" value={newColorDark && /^#([0-9A-Fa-f]{6})$/.test(newColorDark) ? newColorDark : '#DA9AA4'} onChange={(e) => setNewColorDark(e.target.value)} className="h-8 w-10 cursor-pointer border rounded" />
        </label>
        <button type="button" disabled={busy} onClick={add} className="text-sm px-3 py-1 rounded bg-gray-900 text-white disabled:opacity-30">Add category</button>
      </div>
    </div>
  )
}
