export type ContentType = 'text' | 'rich_text' | 'image' | 'list' | 'testimonial'

export interface ContentListItem {
  title: string
  description: string
  icon: string
  image?: string
}

export interface ContentSection {
  id: string
  name: string
  type: ContentType
  content: string | ContentListItem[]
  lastUpdated: string
  status: 'published' | 'draft'
}

const CONTENT_DEFAULT_TEMPLATE: Record<string, ContentSection> = {
  'hero-title': {
    id: 'hero-title',
    name: 'Hero Section Title',
    type: 'text',
    content: 'Wedding Cars & Convoys in Lebanon',
    lastUpdated: new Date().toISOString(),
    status: 'published'
  },
  'hero-subtitle': {
    id: 'hero-subtitle',
    name: 'Hero Section Subtitle',
    type: 'rich_text',
    content:
      'Chauffeured bridal cars, classic convertibles, and full wedding convoys — clean, unbranded cars, on time wherever you celebrate, from Beirut to the mountains.',
    lastUpdated: new Date().toISOString(),
    status: 'published'
  },
  services: {
    id: 'services',
    name: 'Our Services Section',
    type: 'list',
    content: [
      {
        title: 'The Wedding Convoy',
        description: 'A full convoy for the big day — bridal car, family cars, and groomsmen vehicles moving together',
        icon: 'celebration',
        image:
          'https://images.unsplash.com/photo-1519741497674-611481863552?w=300&h=200&fit=crop&crop=center'
      },
      {
        title: 'Bridal Car & Chauffeur',
        description: 'An elegant car with a suited chauffeur for the bride and groom, from prep to venue',
        icon: 'family',
        image:
          'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=300&h=200&fit=crop&crop=center'
      },
      {
        title: 'Classic & Convertible Cars',
        description: 'Timeless classics and open-top cars for the ceremony exit and the photo session',
        icon: 'briefcase',
        image:
          'https://images.unsplash.com/photo-1502161254066-6c74afbf07aa?w=300&h=200&fit=crop&crop=center'
      },
      {
        title: 'Guest Shuttle Vans',
        description: 'Comfortable vans and buses that move your guests between ceremony, venue, and hotels',
        icon: 'calendar',
        image:
          'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=300&h=200&fit=crop&crop=center'
      }
    ],
    lastUpdated: new Date().toISOString(),
    status: 'published'
  }
}

export function createDefaultContent(): Record<string, ContentSection> {
  return JSON.parse(JSON.stringify(CONTENT_DEFAULT_TEMPLATE)) as Record<string, ContentSection>
}
