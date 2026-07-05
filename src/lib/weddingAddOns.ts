/**
 * Wedding-day add-ons — the single source of truth used by the AI prompt,
 * the quote card, the booking form, and WhatsApp message builders.
 *
 * Standard service (no add-ons): cars arrive between 1 and 3pm, drive the
 * wedding route, drop off at the venue, and leave. Prices for add-ons are
 * quoted per wedding (no fixed public rates yet).
 */

export interface WeddingAddOn {
  id: string
  name: string
  blurb: string
}

export const WEDDING_ADD_ONS: WeddingAddOn[] = [
  {
    id: 'early-arrival',
    name: 'Early arrival',
    blurb: 'Cars usually arrive between 1 and 3pm — get your convoy by 11am',
  },
  {
    id: 'stay-till-end',
    name: 'Stay till the end',
    blurb: 'Cars normally drop off at the venue and leave — keep one or more till the end of the party',
  },
  {
    id: 'flower-decoration',
    name: 'Flower decoration',
    blurb: 'The basic package comes without decoration — add flowers & ribbons to match your theme',
  },
  {
    id: 'luxury-van',
    name: 'Black luxury van',
    blurb: 'Add a black luxury van to the convoy for family or the bridal party',
  },
]

export function getAddOnName(id: string): string {
  return WEDDING_ADD_ONS.find((a) => a.id === id)?.name ?? id
}
