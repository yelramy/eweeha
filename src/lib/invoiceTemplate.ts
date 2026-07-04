/**
 * Shared, dependency-free invoice model + renderer.
 *
 * This file is imported by BOTH the client (admin page, for print/preview) and
 * the server (email sending). Keep it pure: no server-only imports (turso, fs,
 * env access, etc.) so it stays safe to bundle into the browser.
 */

export interface InvoiceLineItem {
  description: string
  quantity: number
  unit?: string // e.g. "day", "hour", "trip"
  rate: number
}

export interface InvoiceParty {
  name: string
  email?: string
  phone?: string
  address?: string
}

export interface InvoiceCompany {
  name: string
  address: string
  phone: string
  email: string
  logoUrl?: string
}

export interface InvoiceBank {
  bankName: string
  accountName: string
  accountNumber: string
  iban: string
  swift: string
  branch: string
}

export interface InvoiceConfig {
  company: InvoiceCompany
  bank?: InvoiceBank
}

export interface InvoiceData {
  number: string
  issueDate: string // ISO date string (yyyy-mm-dd)
  dueDate?: string
  currency: string // ISO code, e.g. "USD"
  billTo: InvoiceParty
  items: InvoiceLineItem[]
  notes?: string
  discount?: number // absolute amount in the invoice currency
  taxRate?: number // percent, e.g. 11 for 11%
  deposit?: number // amount already paid
  paymentMethod?: string // free text, e.g. "Whish app and Cash"
  status?: string // draft | sent | paid
}

export interface InvoiceTotals {
  subtotal: number
  discount: number
  taxRate: number
  tax: number
  total: number
  deposit: number
  balanceDue: number
}

export function lineTotal(item: InvoiceLineItem): number {
  const qty = Number(item.quantity) || 0
  const rate = Number(item.rate) || 0
  return round2(qty * rate)
}

export function computeTotals(data: InvoiceData): InvoiceTotals {
  const subtotal = round2(
    data.items.reduce((sum, item) => sum + lineTotal(item), 0)
  )
  const discount = round2(Number(data.discount) || 0)
  const taxRate = Number(data.taxRate) || 0
  const taxable = Math.max(subtotal - discount, 0)
  const tax = round2((taxable * taxRate) / 100)
  const total = round2(taxable + tax)
  const deposit = round2(Number(data.deposit) || 0)
  const balanceDue = round2(total - deposit)
  return { subtotal, discount, taxRate, tax, total, deposit, balanceDue }
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  LBP: 'L£',
}

export function formatMoney(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] || ''
  const value = (Number(amount) || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return symbol ? `${symbol}${value}` : `${value} ${currency}`
}

function formatDate(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function escapeHtml(input: string): string {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Returns a complete, self-contained HTML document for the invoice.
 * Used for both the printable window and the emailed copy.
 */
export function renderInvoiceHTML(
  data: InvoiceData,
  config: InvoiceConfig
): string {
  const t = computeTotals(data)
  const { company } = config
  const c = data.currency

  const itemsRows = data.items
    .filter((i) => i.description || i.quantity || i.rate)
    .map(
      (item, idx) => `
        <tr${idx % 2 ? ' class="alt"' : ''}>
          <td class="desc">${escapeHtml(item.description)}</td>
          <td class="num">${(Number(item.quantity) || 0).toLocaleString('en-US')}${
            item.unit ? ` ${escapeHtml(item.unit)}${(Number(item.quantity) || 0) === 1 ? '' : 's'}` : ''
          }</td>
          <td class="num">${formatMoney(Number(item.rate) || 0, c)}</td>
          <td class="num">${formatMoney(lineTotal(item), c)}</td>
        </tr>`
    )
    .join('')

  const totalsRows = `
    <tr>
      <td class="tlabel">Subtotal</td>
      <td class="tval">${formatMoney(t.subtotal, c)}</td>
    </tr>
    ${
      t.discount
        ? `<tr><td class="tlabel">Discount</td><td class="tval">- ${formatMoney(t.discount, c)}</td></tr>`
        : ''
    }
    ${
      t.taxRate
        ? `<tr><td class="tlabel">VAT (${t.taxRate}%)</td><td class="tval">${formatMoney(t.tax, c)}</td></tr>`
        : ''
    }
    <tr class="grand">
      <td class="tlabel">Total</td>
      <td class="tval">${formatMoney(t.total, c)}</td>
    </tr>
    ${
      t.deposit
        ? `<tr><td class="tlabel">Paid / Deposit</td><td class="tval">- ${formatMoney(t.deposit, c)}</td></tr>
           <tr class="grand due"><td class="tlabel">Balance Due</td><td class="tval">${formatMoney(t.balanceDue, c)}</td></tr>`
        : ''
    }`

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Invoice ${escapeHtml(data.number)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
    color: #1a1a1a;
    margin: 0;
    background: #f3f4f6;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .sheet {
    max-width: 800px;
    margin: 24px auto;
    background: #fff;
    padding: 48px;
    box-shadow: 0 1px 4px rgba(0,0,0,.08);
  }
  .top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
    border-bottom: 3px solid #0B6B3A;
    padding-bottom: 20px;
  }
  .brand { display: flex; align-items: center; gap: 14px; }
  .brand img { height: 56px; width: auto; border-radius: 6px; }
  .brand h1 { font-size: 20px; margin: 0; color: #0B6B3A; }
  .company-meta { font-size: 12px; color: #555; line-height: 1.6; margin-top: 4px; }
  .doc { text-align: right; }
  .doc h2 { font-size: 30px; letter-spacing: 2px; margin: 0; color: #111; text-transform: uppercase; }
  .doc .meta { font-size: 13px; color: #444; line-height: 1.7; margin-top: 8px; }
  .doc .meta b { color: #111; }
  .parties { display: flex; justify-content: space-between; gap: 24px; margin: 28px 0; }
  .parties .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 6px; }
  .parties .who { font-size: 14px; line-height: 1.6; }
  .parties .who .name { font-weight: 700; font-size: 15px; }
  table.items { width: 100%; border-collapse: collapse; margin-top: 8px; }
  table.items thead th {
    background: #0B6B3A; color: #fff; font-size: 12px; text-transform: uppercase;
    letter-spacing: .5px; padding: 10px 12px; text-align: left;
  }
  table.items thead th.num { text-align: right; }
  table.items td { padding: 11px 12px; font-size: 13px; border-bottom: 1px solid #eee; vertical-align: top; }
  table.items td.num { text-align: right; white-space: nowrap; }
  table.items td.desc { width: 55%; }
  table.items tr.alt td { background: #fafafa; }
  .bottom { display: flex; justify-content: space-between; gap: 32px; margin-top: 24px; }
  .bank { flex: 1; font-size: 12px; color: #444; line-height: 1.7; }
  .bank .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 6px; }
  .bank .row span { display: inline-block; min-width: 92px; color: #888; }
  .bank .pay { white-space: pre-line; font-weight: 600; color: #1a1a1a; }
  table.totals { width: 300px; border-collapse: collapse; }
  table.totals td { padding: 7px 4px; font-size: 13px; }
  table.totals td.tlabel { color: #555; }
  table.totals td.tval { text-align: right; font-weight: 600; }
  table.totals tr.grand td { border-top: 2px solid #111; font-size: 16px; font-weight: 800; padding-top: 10px; }
  table.totals tr.due td { color: #0B6B3A; }
  .notes { margin-top: 28px; font-size: 12px; color: #555; border-top: 1px solid #eee; padding-top: 14px; white-space: pre-wrap; }
  .footer { margin-top: 34px; text-align: center; font-size: 11px; color: #999; }
  @media print {
    body { background: #fff; }
    .sheet { box-shadow: none; margin: 0; max-width: none; padding: 24px; }
  }
</style>
</head>
<body>
  <div class="sheet">
    <div class="top">
      <div class="brand">
        ${company.logoUrl ? `<img src="${escapeHtml(company.logoUrl)}" alt="${escapeHtml(company.name)}" />` : ''}
        <div>
          <h1>${escapeHtml(company.name)}</h1>
          <div class="company-meta">
            ${company.address ? `${escapeHtml(company.address)}<br/>` : ''}
            ${company.phone ? `${escapeHtml(company.phone)}<br/>` : ''}
            ${company.email ? `${escapeHtml(company.email)}` : ''}
          </div>
        </div>
      </div>
      <div class="doc">
        <h2>Invoice</h2>
        <div class="meta">
          <div><b>No.</b> ${escapeHtml(data.number)}</div>
          <div><b>Date</b> ${formatDate(data.issueDate)}</div>
          ${data.dueDate ? `<div><b>Due</b> ${formatDate(data.dueDate)}</div>` : ''}
        </div>
      </div>
    </div>

    <div class="parties">
      <div>
        <div class="label">Bill To</div>
        <div class="who">
          <div class="name">${escapeHtml(data.billTo.name || '—')}</div>
          ${data.billTo.address ? `${escapeHtml(data.billTo.address)}<br/>` : ''}
          ${data.billTo.phone ? `${escapeHtml(data.billTo.phone)}<br/>` : ''}
          ${data.billTo.email ? `${escapeHtml(data.billTo.email)}` : ''}
        </div>
      </div>
    </div>

    <table class="items">
      <thead>
        <tr>
          <th class="desc">Description</th>
          <th class="num">Qty</th>
          <th class="num">Rate</th>
          <th class="num">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <div class="bottom">
      <div class="bank">
        ${
          data.paymentMethod
            ? `<div class="label">Payment</div><div class="pay">${escapeHtml(data.paymentMethod)}</div>`
            : ''
        }
      </div>
      <table class="totals">
        ${totalsRows}
      </table>
    </div>

    ${data.notes ? `<div class="notes"><b>Notes:</b> ${escapeHtml(data.notes)}</div>` : ''}

    <div class="footer">
      Thank you for your business — ${escapeHtml(company.name)}
    </div>
  </div>
</body>
</html>`
}
