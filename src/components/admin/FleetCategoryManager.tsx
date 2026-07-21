'use client'

import { useState } from 'react'
import { FleetCategory } from '@/lib/fleetCategories'

interface Props {
  categories: FleetCategory[]
  onChanged: () => Promise<void> | void
  notifyError: (msg: string) => void
  notifySuccess: (msg: string) => void
}

export default function FleetCategoryManager({ categories, onChanged, notifyError, notifySuccess }: Props) {
  const [edits, setEdits] = useState<Record<string, { title: string; blurb: string }>>({})
  const [newTitle, setNewTitle] = useState('')
  const [newBlurb, setNewBlurb] = useState('')
  const [busy, setBusy] = useState(false)

  const getEdit = (c: FleetCategory) => edits[c.id] ?? { title: c.title, blurb: c.blurb }
  const setEdit = (id: string, patch: Partial<{ title: string; blurb: string }>) =>
    setEdits((prev) => ({ ...prev, [id]: { ...(prev[id] ?? categories.find((c) => c.id === id)!), ...patch } }))

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
        body: JSON.stringify({ id: c.id, title: e.title.trim(), blurb: e.blurb.trim() }),
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
        body: JSON.stringify({ title: newTitle.trim(), blurb: newBlurb.trim() }),
      }),
      'Category added'
    ).then(() => { setNewTitle(''); setNewBlurb('') })
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
      {categories.map((c, i) => {
        const e = getEdit(c)
        const dirty = e.title !== c.title || e.blurb !== c.blurb
        return (
          <div key={c.id} className="flex flex-wrap items-center gap-2 border rounded-lg p-3">
            <div className="flex flex-col gap-0.5">
              <button type="button" disabled={busy || i === 0} onClick={() => move(i, -1)} className="text-xs px-1 border rounded disabled:opacity-30">▲</button>
              <button type="button" disabled={busy || i === categories.length - 1} onClick={() => move(i, 1)} className="text-xs px-1 border rounded disabled:opacity-30">▼</button>
            </div>
            <input value={e.title} onChange={(ev) => setEdit(c.id, { title: ev.target.value })} className="border rounded px-2 py-1 text-sm w-56" placeholder="Title" />
            <input value={e.blurb} onChange={(ev) => setEdit(c.id, { blurb: ev.target.value })} className="border rounded px-2 py-1 text-sm flex-1 min-w-48" placeholder="Short description" />
            <button type="button" disabled={busy || !dirty} onClick={() => save(c)} className="text-sm px-3 py-1 rounded bg-gray-900 text-white disabled:opacity-30">Save</button>
            <button type="button" disabled={busy} onClick={() => remove(c)} className="text-sm px-3 py-1 rounded border border-red-300 text-red-600 disabled:opacity-30">Delete</button>
          </div>
        )
      })}
      <div className="flex flex-wrap items-center gap-2 border border-dashed rounded-lg p-3">
        <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="border rounded px-2 py-1 text-sm w-56" placeholder="New category title" />
        <input value={newBlurb} onChange={(e) => setNewBlurb(e.target.value)} className="border rounded px-2 py-1 text-sm flex-1 min-w-48" placeholder="Short description" />
        <button type="button" disabled={busy} onClick={add} className="text-sm px-3 py-1 rounded bg-gray-900 text-white disabled:opacity-30">Add category</button>
      </div>
    </div>
  )
}
