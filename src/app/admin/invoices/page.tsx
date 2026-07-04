'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import AdminLayout from '@/components/AdminLayout'
import { useNotification } from '@/contexts/NotificationContext'
import {
  computeTotals,
  formatMoney,
  lineTotal,
  renderInvoiceHTML,
  type InvoiceConfig,
  type InvoiceData,
  type InvoiceLineItem,
} from '@/lib/invoiceTemplate'

interface InvoiceRecord extends InvoiceData {
  id: string
  createdAt: string
  updatedAt: string
}

const CURRENCIES = ['USD', 'EUR', 'LBP', 'GBP']

const emptyItem = (): InvoiceLineItem => ({
  description: '',
  quantity: 1,
  unit: '',
  rate: 0,
})

const todayISO = () => new Date().toISOString().slice(0, 10)

export default function InvoicesPage() {
  const notification = useNotification()

  const [config, setConfig] = useState<InvoiceConfig | null>(null)
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [issueDate, setIssueDate] = useState(todayISO())
  const [dueDate, setDueDate] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [items, setItems] = useState<InvoiceLineItem[]>([emptyItem()])
  const [notes, setNotes] = useState('')
  const [discount, setDiscount] = useState('')
  const [taxRate, setTaxRate] = useState('')
  const [deposit, setDeposit] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [status, setStatus] = useState('draft')

  // When set, the form is editing an existing invoice instead of creating one.
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingNumber, setEditingNumber] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/invoices')
      const data = await res.json()
      if (data.success) {
        setInvoices(data.data)
        setConfig(data.config)
      }
    } catch (err) {
      console.error('Failed to load invoices:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const currentInvoice: InvoiceData = useMemo(
    () => ({
      number: editingNumber || 'DRAFT',
      issueDate,
      dueDate: dueDate || undefined,
      currency,
      billTo: {
        name,
        email: email || undefined,
        phone: phone || undefined,
        address: address || undefined,
      },
      items,
      notes: notes || undefined,
      discount: parseFloat(discount) || 0,
      taxRate: parseFloat(taxRate) || 0,
      deposit: parseFloat(deposit) || 0,
      paymentMethod: paymentMethod || undefined,
      status,
    }),
    [editingNumber, issueDate, dueDate, currency, name, email, phone, address, items, notes, discount, taxRate, deposit, paymentMethod, status]
  )

  const totals = useMemo(() => computeTotals(currentInvoice), [currentInvoice])

  const previewHtml = useMemo(() => {
    if (!config) return ''
    return renderInvoiceHTML(currentInvoice, config)
  }, [currentInvoice, config])

  const updateItem = (idx: number, patch: Partial<InvoiceLineItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }
  const addItem = () => setItems((prev) => [...prev, emptyItem()])
  const removeItem = (idx: number) =>
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)))

  const printHtml = (html: string) => {
    const w = window.open('', '_blank')
    if (!w) {
      notification.error('Popup blocked — allow popups to print')
      return
    }
    w.document.write(html)
    w.document.close()
    w.focus()
    // Give the logo image a beat to load before invoking the print dialog.
    setTimeout(() => w.print(), 400)
  }

  const printInvoice = (invoice: InvoiceData) => {
    if (!config) return
    printHtml(renderInvoiceHTML(invoice, config))
  }

  const validate = (): string | null => {
    if (!name.trim()) return 'Enter the customer name'
    const hasItem = items.some(
      (i) => i.description.trim() || Number(i.quantity) || Number(i.rate)
    )
    if (!hasItem) return 'Add at least one line item'
    return null
  }

  const resetForm = () => {
    setName('')
    setEmail('')
    setPhone('')
    setAddress('')
    setIssueDate(todayISO())
    setDueDate('')
    setCurrency('USD')
    setItems([emptyItem()])
    setNotes('')
    setDiscount('')
    setTaxRate('')
    setDeposit('')
    setPaymentMethod('')
    setStatus('draft')
    setEditingId(null)
    setEditingNumber(null)
  }

  const startEdit = (inv: InvoiceRecord) => {
    setEditingId(inv.id)
    setEditingNumber(inv.number)
    setName(inv.billTo.name || '')
    setEmail(inv.billTo.email || '')
    setPhone(inv.billTo.phone || '')
    setAddress(inv.billTo.address || '')
    setIssueDate(inv.issueDate || todayISO())
    setDueDate(inv.dueDate || '')
    setCurrency(inv.currency || 'USD')
    setItems(
      inv.items && inv.items.length
        ? inv.items.map((i) => ({ ...i }))
        : [emptyItem()]
    )
    setNotes(inv.notes || '')
    setDiscount(inv.discount ? String(inv.discount) : '')
    setTaxRate(inv.taxRate ? String(inv.taxRate) : '')
    setDeposit(inv.deposit ? String(inv.deposit) : '')
    setPaymentMethod(inv.paymentMethod || '')
    setStatus(inv.status || 'draft')
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const saveInvoice = async (): Promise<InvoiceRecord | null> => {
    const err = validate()
    if (err) {
      notification.error(err)
      return null
    }
    setSaving(true)
    try {
      const payload = {
        issueDate,
        dueDate: dueDate || undefined,
        currency,
        billTo: {
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
        },
        items,
        notes: notes.trim() || undefined,
        discount: parseFloat(discount) || 0,
        taxRate: parseFloat(taxRate) || 0,
        deposit: parseFloat(deposit) || 0,
        paymentMethod: paymentMethod.trim() || undefined,
        status,
      }
      const res = await fetch(
        editingId ? `/api/admin/invoices/${editingId}` : '/api/admin/invoices',
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      const data = await res.json()
      if (!data.success) {
        notification.error(data.error || 'Failed to save invoice')
        return null
      }
      notification.success(
        editingId ? `Updated ${data.data.number}` : `Saved ${data.data.number}`
      )
      await fetchData()
      return data.data as InvoiceRecord
    } catch {
      notification.error('Failed to save invoice')
      return null
    } finally {
      setSaving(false)
    }
  }

  const saveAndPrint = async () => {
    const saved = await saveInvoice()
    if (saved) {
      printInvoice(saved)
      resetForm()
    }
  }

  const sendEmail = async (invoice: InvoiceRecord) => {
    if (!invoice.billTo.email) {
      notification.error('This invoice has no customer email')
      return
    }
    const toastId = notification.loading('Sending invoice...')
    try {
      const res = await fetch(`/api/admin/invoices/${invoice.id}/send`, {
        method: 'POST',
      })
      const data = await res.json()
      notification.dismiss(toastId)
      if (data.success) {
        notification.success(`Emailed to ${invoice.billTo.email}`)
        fetchData()
      } else {
        notification.error(data.error || 'Failed to send')
      }
    } catch {
      notification.dismiss(toastId)
      notification.error('Failed to send')
    }
  }

  const shareWhatsApp = (invoice: InvoiceRecord) => {
    const t = computeTotals(invoice)
    const amount = formatMoney(t.balanceDue || t.total, invoice.currency)
    const phoneDigits = (invoice.billTo.phone || '').replace(/[^0-9]/g, '')
    const msg = `Hi ${invoice.billTo.name}, here is your invoice ${invoice.number} from ${config?.company.name || 'Eweeha'} — total ${amount}. Thank you!`
    const base = phoneDigits ? `https://wa.me/${phoneDigits}` : 'https://wa.me/'
    window.open(`${base}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const deleteInvoice = async (id: string) => {
    if (!confirm('Delete this invoice?')) return
    try {
      const res = await fetch(`/api/admin/invoices?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        notification.success('Deleted')
        fetchData()
      }
    } catch {
      notification.error('Failed to delete')
    }
  }

  return (
    <AdminLayout>
      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Invoices</h1>
        <p className="text-sm text-gray-500">Create an official invoice, print/save as PDF, and email it to the customer.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ---- Builder ---- */}
        <div className="space-y-5">
          {/* Bill To */}
          <section className="border border-gray-200 rounded-lg bg-white p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Bill To</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Customer / company name *"
                className="col-span-1 sm:col-span-2 px-3 py-2 border border-gray-300 rounded text-sm"
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email (for sending)"
                type="email"
                className="px-3 py-2 border border-gray-300 rounded text-sm"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone (for WhatsApp)"
                className="px-3 py-2 border border-gray-300 rounded text-sm"
              />
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Address (optional)"
                className="col-span-1 sm:col-span-2 px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
          </section>

          {/* Meta */}
          <section className="border border-gray-200 rounded-lg bg-white p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="text-xs text-gray-500">
                Issue date
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </label>
              <label className="text-xs text-gray-500">
                Due date
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </label>
              <label className="text-xs text-gray-500">
                Currency
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-gray-500">
                Status
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white"
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                </select>
              </label>
            </div>
          </section>

          {/* Line items */}
          <section className="border border-gray-200 rounded-lg bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">Line items</h2>
              <button onClick={addItem} className="text-sm text-primary-600 hover:underline">+ Add line</button>
            </div>
            <div className="space-y-2">
              <div className="hidden sm:grid grid-cols-12 gap-2 text-[11px] uppercase tracking-wide text-gray-400 px-1">
                <span className="col-span-5">Description</span>
                <span className="col-span-2">Qty</span>
                <span className="col-span-2">Unit</span>
                <span className="col-span-2">Rate</span>
                <span className="col-span-1"></span>
              </div>
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    value={item.description}
                    onChange={(e) => updateItem(idx, { description: e.target.value })}
                    placeholder="e.g. Staria Hyundai (29,30 Jun, 1,2 Jul)"
                    className="col-span-12 sm:col-span-5 px-2 py-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={item.quantity || ''}
                    onChange={(e) => updateItem(idx, { quantity: parseFloat(e.target.value) || 0 })}
                    placeholder="Qty"
                    className="col-span-4 sm:col-span-2 px-2 py-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    value={item.unit || ''}
                    onChange={(e) => updateItem(idx, { unit: e.target.value })}
                    placeholder="day"
                    className="col-span-4 sm:col-span-2 px-2 py-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={item.rate || ''}
                    onChange={(e) => updateItem(idx, { rate: parseFloat(e.target.value) || 0 })}
                    placeholder="Rate"
                    className="col-span-3 sm:col-span-2 px-2 py-2 border border-gray-300 rounded text-sm"
                  />
                  <button
                    onClick={() => removeItem(idx)}
                    className="col-span-1 text-gray-400 hover:text-red-600 text-lg leading-none"
                    aria-label="Remove line"
                    title="Remove line"
                  >
                    ×
                  </button>
                  <div className="col-span-12 sm:hidden text-right text-xs text-gray-500 -mt-1">
                    Amount: {formatMoney(lineTotal(item), currency)}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Adjustments */}
          <section className="border border-gray-200 rounded-lg bg-white p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Adjustments</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="text-xs text-gray-500">
                Discount ({currency})
                <input
                  type="number"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </label>
              <label className="text-xs text-gray-500">
                VAT / Tax (%)
                <input
                  type="number"
                  step="0.01"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  placeholder="0"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </label>
              <label className="text-xs text-gray-500">
                Paid / Deposit ({currency})
                <input
                  type="number"
                  step="0.01"
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                  placeholder="0"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </label>
            </div>
            <input
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              placeholder="Payment method (e.g. Whish app and Cash)"
              className="mt-3 w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (payment terms, thank-you message, etc.)"
              rows={2}
              className="mt-3 w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </section>

          {/* Totals + actions */}
          <section className="border border-gray-200 rounded-lg bg-white p-4">
            <div className="flex justify-end">
              <div className="w-full sm:w-64 text-sm space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatMoney(totals.subtotal, currency)}</span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Discount</span>
                    <span>- {formatMoney(totals.discount, currency)}</span>
                  </div>
                )}
                {totals.taxRate > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>VAT ({totals.taxRate}%)</span>
                    <span>{formatMoney(totals.tax, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1">
                  <span>Total</span>
                  <span>{formatMoney(totals.total, currency)}</span>
                </div>
                {totals.deposit > 0 && (
                  <div className="flex justify-between text-[#742F38] font-semibold">
                    <span>Balance due</span>
                    <span>{formatMoney(totals.balanceDue, currency)}</span>
                  </div>
                )}
              </div>
            </div>
            {editingId && (
              <div className="mt-4 flex items-center justify-between rounded bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
                <span>Editing <strong>{editingNumber}</strong></span>
                <button onClick={resetForm} className="text-amber-700 hover:underline">
                  Cancel edit
                </button>
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={() => previewHtml && printHtml(previewHtml)}
                className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Print / PDF
              </button>
              <button
                onClick={saveInvoice}
                disabled={saving}
                className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                {saving ? 'Saving…' : editingId ? 'Update' : 'Save'}
              </button>
              <button
                onClick={saveAndPrint}
                disabled={saving}
                className="px-4 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50"
              >
                {editingId ? 'Update' : 'Save'} &amp; Print
              </button>
            </div>
          </section>
        </div>

        {/* ---- Live preview ---- */}
        <div className="lg:sticky lg:top-20 h-fit">
          <div className="text-xs text-gray-400 mb-1">Live preview</div>
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-100">
            {previewHtml ? (
              <iframe
                title="Invoice preview"
                srcDoc={previewHtml}
                className="w-full"
                style={{ height: '820px', border: 'none', background: '#f3f4f6' }}
              />
            ) : (
              <div className="p-8 text-sm text-gray-400">Loading preview…</div>
            )}
          </div>
        </div>
      </div>

      {/* ---- Saved invoices ---- */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Saved invoices</h2>
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : invoices.length === 0 ? (
          <p className="text-sm text-gray-500">No invoices yet.</p>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-gray-100 text-left text-gray-600">
                  <th className="px-3 py-2 font-medium">Number</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Customer</th>
                  <th className="px-3 py-2 font-medium text-right">Total</th>
                  <th className="px-3 py-2 font-medium text-center">Status</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, i) => {
                  const t = computeTotals(inv)
                  return (
                    <tr key={inv.id} className={i % 2 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-3 py-2 font-medium text-gray-900">{inv.number}</td>
                      <td className="px-3 py-2 text-gray-600">
                        {format(new Date(inv.issueDate), 'MMM d, yyyy')}
                      </td>
                      <td className="px-3 py-2 text-gray-700">
                        <div>{inv.billTo.name}</div>
                        {inv.billTo.email && (
                          <div className="text-xs text-gray-400">{inv.billTo.email}</div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatMoney(t.total, inv.currency)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            inv.status === 'paid'
                              ? 'bg-green-100 text-green-700'
                              : inv.status === 'sent'
                                ? 'bg-primary-100 text-primary-700'
                                : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {inv.status || 'draft'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2 text-xs">
                          <button onClick={() => startEdit(inv)} className="text-gray-900 font-medium hover:underline">Edit</button>
                          <button onClick={() => printInvoice(inv)} className="text-gray-700 hover:underline">Print</button>
                          <button
                            onClick={() => sendEmail(inv)}
                            disabled={!inv.billTo.email}
                            className="text-primary-600 hover:underline disabled:text-gray-300 disabled:no-underline"
                          >
                            Email
                          </button>
                          <button onClick={() => shareWhatsApp(inv)} className="text-green-600 hover:underline">WA</button>
                          <button onClick={() => deleteInvoice(inv.id)} className="text-red-600 hover:underline">Del</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminLayout>
  )
}
