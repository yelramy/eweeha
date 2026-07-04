import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { isAdminRequestAuthorized } from '@/lib/auth'
import { getInvoice, getInvoiceConfig, updateInvoiceStatus } from '@/lib/invoices'
import { computeTotals, formatMoney, renderInvoiceHTML } from '@/lib/invoiceTemplate'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const { id } = await params
    const invoice = await getInvoice(id)
    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      )
    }

    const to = invoice.billTo.email
    if (!to) {
      return NextResponse.json(
        { success: false, error: 'This invoice has no customer email' },
        { status: 400 }
      )
    }

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Email is not configured (RESEND_API_KEY missing)' },
        { status: 500 }
      )
    }

    const config = getInvoiceConfig()
    const html = renderInvoiceHTML(invoice, config)
    const totals = computeTotals(invoice)
    const amountLabel = formatMoney(
      totals.balanceDue || totals.total,
      invoice.currency
    )

    const resend = new Resend(apiKey)
    const from = process.env.EMAIL_FROM || 'onboarding@resend.dev'
    const replyTo = process.env.EMAIL_REPLY_TO || 'info@eweeha.com'

    const result = await resend.emails.send({
      from: `${config.company.name} <${from}>`,
      to,
      replyTo,
      subject: `Invoice ${invoice.number} — ${amountLabel}`,
      html,
    })

    await updateInvoiceStatus(id, 'sent')

    return NextResponse.json({ success: true, id: result.data?.id })
  } catch (error) {
    console.error('Failed to send invoice:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send invoice' },
      { status: 500 }
    )
  }
}
