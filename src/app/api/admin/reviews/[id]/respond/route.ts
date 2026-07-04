import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { isAdminRequestAuthorized } from '@/lib/auth'
import { updateReviewResponse } from '@/lib/reviews'

const RespondSchema = z.object({
  response: z.string().trim().min(1).max(2000),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authorized = isAdminRequestAuthorized(request.cookies.get('admin-token')?.value)
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    if (!id || id.length < 8) {
      return NextResponse.json({ success: false, error: 'Invalid review id' }, { status: 400 })
    }

    const body = await request.json()
    const parsed = RespondSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid response' }, { status: 400 })
    }

    await updateReviewResponse(id, parsed.data.response)

    revalidatePath('/')
    revalidatePath('/reviews')
    revalidatePath('/fleet/[id]', 'page')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to respond to review:', error)
    return NextResponse.json({ success: false, error: 'Failed to save response' }, { status: 500 })
  }
}
