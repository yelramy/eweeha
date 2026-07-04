import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequestAuthorized } from '@/lib/auth'
import {
  createInvoice,
  deleteInvoice,
  getInvoiceConfig,
  listInvoices,
} from '@/lib/invoices'
import type { InvoiceLineItem, InvoiceParty } from '@/lib/invoiceTemplate'

function unauthorized() {
  return NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { status: 401 }
  )
}

export async function GET(request: NextRequest) {
  if (!isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)) {
    return unauthorized()
  }

  try {
    const invoices = await listInvoices()
    return NextResponse.json({
      success: true,
      data: invoices,
      config: getInvoiceConfig(),
    })
  } catch (error) {
    console.error('Failed to list invoices:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to list invoices' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)) {
    return unauthorized()
  }

  try {
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

    const invoice = await createInvoice({
      issueDate: body.issueDate,
      dueDate: body.dueDate,
      currency: body.currency,
      billTo,
      items: cleanItems.map((i) => ({
        description: String(i.description || '').trim(),
        quantity: Number(i.quantity) || 0,
        unit: i.unit ? String(i.unit).trim() : undefined,
        rate: Number(i.rate) || 0,
      })),
      notes: body.notes,
      discount: body.discount,
      taxRate: body.taxRate,
      deposit: body.deposit,
      paymentMethod: body.paymentMethod,
      status: body.status,
    })

    return NextResponse.json({ success: true, data: invoice })
  } catch (error) {
    console.error('Failed to create invoice:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)) {
    return unauthorized()
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Invoice id required' },
        { status: 400 }
      )
    }
    await deleteInvoice(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete invoice:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete invoice' },
      { status: 500 }
    )
  }
}
