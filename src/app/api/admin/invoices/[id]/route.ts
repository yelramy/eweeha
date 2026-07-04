import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequestAuthorized } from '@/lib/auth'
import { getInvoice, updateInvoice } from '@/lib/invoices'
import type { InvoiceLineItem, InvoiceParty } from '@/lib/invoiceTemplate'

function unauthorized() {
  return NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { status: 401 }
  )
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)) {
    return unauthorized()
  }
  const { id } = await params
  const invoice = await getInvoice(id)
  if (!invoice) {
    return NextResponse.json(
      { success: false, error: 'Invoice not found' },
      { status: 404 }
    )
  }
  return NextResponse.json({ success: true, data: invoice })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)) {
    return unauthorized()
  }

  try {
    const { id } = await params
    const body = await request.json()
    const billTo = body.billTo as InvoiceParty | undefined
    const items = body.items as InvoiceLineItem[] | undefined

    if (!billTo?.name) {
      return NextResponse.json(
        { success: false, error: 'Customer name is required' },
        { status: 400 }
      )
    }

    const cleanItems = (items || []).filter(
      (i) => i && (i.description?.trim() || Number(i.quantity) || Number(i.rate))
    )

    if (cleanItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Add at least one line item' },
        { status: 400 }
      )
    }

    const invoice = await updateInvoice(id, {
      issueDate: body.issueDate,
      dueDate: body.dueDate ?? null,
      currency: body.currency,
      billTo,
      items: cleanItems.map((i) => ({
        description: String(i.description || '').trim(),
        quantity: Number(i.quantity) || 0,
        unit: i.unit ? String(i.unit).trim() : undefined,
        rate: Number(i.rate) || 0,
      })),
      notes: body.notes ?? null,
      discount: body.discount,
      taxRate: body.taxRate,
      deposit: body.deposit,
      paymentMethod: body.paymentMethod ?? null,
      status: body.status,
    })

    return NextResponse.json({ success: true, data: invoice })
  } catch (error) {
    console.error('Failed to update invoice:', error)
    const message =
      error instanceof Error && error.message === 'Invoice not found'
        ? 'Invoice not found'
        : 'Failed to update invoice'
    const status = message === 'Invoice not found' ? 404 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
