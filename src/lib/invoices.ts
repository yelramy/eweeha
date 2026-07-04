import turso from '@/lib/turso'
import { randomUUID } from 'crypto'
import type {
  InvoiceConfig,
  InvoiceData,
  InvoiceLineItem,
  InvoiceParty,
} from './invoiceTemplate'

export interface InvoiceRecord extends InvoiceData {
  id: string
  createdAt: string
  updatedAt: string
}

let tableInitialized = false

export async function ensureInvoicesTable() {
  if (tableInitialized) return

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      number TEXT UNIQUE NOT NULL,
      seq INTEGER NOT NULL,
      year INTEGER NOT NULL,
      issue_date TEXT NOT NULL,
      due_date TEXT,
      currency TEXT NOT NULL DEFAULT 'USD',
      bill_to TEXT NOT NULL,      -- JSON InvoiceParty
      items TEXT NOT NULL,        -- JSON InvoiceLineItem[]
      notes TEXT,
      discount REAL DEFAULT 0,
      tax_rate REAL DEFAULT 0,
      deposit REAL DEFAULT 0,
      payment_method TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Add payment_method column for tables created before this field existed.
  try {
    await turso.execute(`ALTER TABLE invoices ADD COLUMN payment_method TEXT`)
  } catch {
    // Column already exists
  }

  await turso.execute(
    `CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at)`
  )
  await turso.execute(
    `CREATE INDEX IF NOT EXISTS idx_invoices_year_seq ON invoices(year, seq)`
  )

  tableInitialized = true
}

/**
 * Company + bank details for the invoice header. Sourced from env so the
 * business can change them without a redeploy of the model. NEXT_PUBLIC_BANK_*
 * mirror what the customer already sees on the payment page.
 */
export function getInvoiceConfig(): InvoiceConfig {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
  return {
    company: {
      name: process.env.COMPANY_NAME || 'Eweeha',
      address: process.env.COMPANY_ADDRESS || 'Beirut, Lebanon',
      phone: process.env.COMPANY_PHONE || '',
      email: process.env.COMPANY_EMAIL || 'eweehalebanon@gmail.com',
      logoUrl: baseUrl ? `${baseUrl.replace(/\/$/, '')}/logo.png` : '/logo.png',
    },
  }
}

function rowToInvoice(row: Record<string, unknown>): InvoiceRecord {
  return {
    id: row.id as string,
    number: row.number as string,
    issueDate: row.issue_date as string,
    dueDate: (row.due_date as string) || undefined,
    currency: (row.currency as string) || 'USD',
    billTo: safeParse<InvoiceParty>(row.bill_to as string, { name: '' }),
    items: safeParse<InvoiceLineItem[]>(row.items as string, []),
    notes: (row.notes as string) || undefined,
    discount: (row.discount as number) ?? 0,
    taxRate: (row.tax_rate as number) ?? 0,
    deposit: (row.deposit as number) ?? 0,
    paymentMethod: (row.payment_method as string) || undefined,
    status: (row.status as string) || 'draft',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function safeParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export async function listInvoices(limit = 100): Promise<InvoiceRecord[]> {
  await ensureInvoicesTable()
  const result = await turso.execute({
    sql: `SELECT * FROM invoices ORDER BY created_at DESC LIMIT ?`,
    args: [limit],
  })
  return result.rows.map((r) => rowToInvoice(r as Record<string, unknown>))
}

export async function getInvoice(id: string): Promise<InvoiceRecord | null> {
  await ensureInvoicesTable()
  const result = await turso.execute({
    sql: `SELECT * FROM invoices WHERE id = ?`,
    args: [id],
  })
  if (result.rows.length === 0) return null
  return rowToInvoice(result.rows[0] as Record<string, unknown>)
}

// Invoice numbering starts here rather than at 1 (business preference / to
// continue from a previous system). The first invoice of a year is this value,
// and each subsequent invoice increments from the highest existing number.
const INVOICE_START_SEQ = 2456

async function nextInvoiceNumber(year: number): Promise<{ number: string; seq: number }> {
  const result = await turso.execute({
    sql: `SELECT COALESCE(MAX(seq), 0) AS max_seq FROM invoices WHERE year = ?`,
    args: [year],
  })
  const maxSeq = Number((result.rows[0] as Record<string, unknown>)?.max_seq ?? 0)
  const seq = Math.max(maxSeq + 1, INVOICE_START_SEQ)
  const number = `INV-${year}-${String(seq).padStart(4, '0')}`
  return { number, seq }
}

export interface CreateInvoiceInput {
  issueDate: string
  dueDate?: string
  currency?: string
  billTo: InvoiceParty
  items: InvoiceLineItem[]
  notes?: string
  discount?: number
  taxRate?: number
  deposit?: number
  paymentMethod?: string
  status?: string
}

export async function createInvoice(
  input: CreateInvoiceInput
): Promise<InvoiceRecord> {
  await ensureInvoicesTable()

  const issueDate = input.issueDate || new Date().toISOString().slice(0, 10)
  const year = new Date(issueDate).getFullYear() || new Date().getFullYear()
  const { number, seq } = await nextInvoiceNumber(year)
  const id = randomUUID()

  await turso.execute({
    sql: `INSERT INTO invoices (
      id, number, seq, year, issue_date, due_date, currency,
      bill_to, items, notes, discount, tax_rate, deposit, payment_method, status,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    args: [
      id,
      number,
      seq,
      year,
      issueDate,
      input.dueDate || null,
      input.currency || 'USD',
      JSON.stringify(input.billTo),
      JSON.stringify(input.items),
      input.notes || null,
      Number(input.discount) || 0,
      Number(input.taxRate) || 0,
      Number(input.deposit) || 0,
      input.paymentMethod || null,
      input.status || 'draft',
    ],
  })

  const created = await getInvoice(id)
  if (!created) throw new Error('Failed to load created invoice')
  return created
}

export interface UpdateInvoiceInput {
  issueDate?: string
  dueDate?: string | null
  currency?: string
  billTo?: InvoiceParty
  items?: InvoiceLineItem[]
  notes?: string | null
  discount?: number
  taxRate?: number
  deposit?: number
  paymentMethod?: string | null
  status?: string
}

/**
 * Update an existing invoice's contents. The invoice number, sequence and year
 * are intentionally immutable — an official invoice keeps its identifier even
 * when its line items change.
 */
export async function updateInvoice(
  id: string,
  input: UpdateInvoiceInput
): Promise<InvoiceRecord> {
  await ensureInvoicesTable()

  const existing = await getInvoice(id)
  if (!existing) throw new Error('Invoice not found')

  const merged = {
    issueDate: input.issueDate ?? existing.issueDate,
    dueDate: input.dueDate !== undefined ? input.dueDate : existing.dueDate,
    currency: input.currency ?? existing.currency,
    billTo: input.billTo ?? existing.billTo,
    items: input.items ?? existing.items,
    notes: input.notes !== undefined ? input.notes : existing.notes,
    discount: input.discount ?? existing.discount ?? 0,
    taxRate: input.taxRate ?? existing.taxRate ?? 0,
    deposit: input.deposit ?? existing.deposit ?? 0,
    paymentMethod:
      input.paymentMethod !== undefined
        ? input.paymentMethod
        : existing.paymentMethod,
    status: input.status ?? existing.status ?? 'draft',
  }

  await turso.execute({
    sql: `UPDATE invoices SET
      issue_date = ?, due_date = ?, currency = ?, bill_to = ?, items = ?,
      notes = ?, discount = ?, tax_rate = ?, deposit = ?, payment_method = ?, status = ?,
      updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
    args: [
      merged.issueDate,
      merged.dueDate || null,
      merged.currency,
      JSON.stringify(merged.billTo),
      JSON.stringify(merged.items),
      merged.notes || null,
      Number(merged.discount) || 0,
      Number(merged.taxRate) || 0,
      Number(merged.deposit) || 0,
      merged.paymentMethod || null,
      merged.status,
      id,
    ],
  })

  const updated = await getInvoice(id)
  if (!updated) throw new Error('Failed to load updated invoice')
  return updated
}

export async function updateInvoiceStatus(
  id: string,
  status: string
): Promise<void> {
  await ensureInvoicesTable()
  await turso.execute({
    sql: `UPDATE invoices SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    args: [status, id],
  })
}

export async function deleteInvoice(id: string): Promise<void> {
  await ensureInvoicesTable()
  await turso.execute({ sql: `DELETE FROM invoices WHERE id = ?`, args: [id] })
}
