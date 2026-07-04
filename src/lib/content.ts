import turso from './turso'
import { createDefaultContent, ContentSection, ContentListItem } from '@/constants/contentDefaults'
// TODO: Implement Sanity CMS integration
// import { createClient } from '@sanity/client'
// const client = createClient({
//   projectId: process.env.SANITY_PROJECT_ID,
//   dataset: 'production',
//   useCdn: true
// })


function rowToSection(row: Record<string, unknown>): ContentSection {
  const type = row.type as ContentSection['type']
  const raw = row.content as string
  let content: string | ContentListItem[] = raw
  if (type === 'list') {
    try { content = JSON.parse(raw) as ContentListItem[] } catch { content = [] }
  }
  return {
    id: row.section_id as string,
    name: row.name as string,
    type,
    content,
    lastUpdated: row.last_updated as string,
    status: row.status as ContentSection['status']
  }
}

export async function getContent(sectionId: string): Promise<ContentSection | null> {
  try {
    const result = await turso.execute({
      sql: 'SELECT * FROM content_sections WHERE section_id = ? LIMIT 1',
      args: [sectionId]
    })
    if (result.rows.length === 0) {
      return createDefaultContent()[sectionId] || null
    }
    const row = result.rows[0]
    if (row.status !== 'published') {
      return createDefaultContent()[sectionId] || null
    }
    return rowToSection(row)
  } catch (error) {
    console.error('Error fetching content from DB:', error)
    return createDefaultContent()[sectionId] || null
  }
}

export async function getAllContent(): Promise<Record<string, ContentSection>> {
  try {
    const result = await turso.execute("SELECT * FROM content_sections WHERE status = 'published'")
    if (result.rows.length === 0) {
      return createDefaultContent()
    }
    const out: Record<string, ContentSection> = {}
    for (const row of result.rows) {
      const section = rowToSection(row)
      out[section.id] = section
    }
    return out
  } catch (error) {
    console.error('Error fetching all content from DB:', error)
    return createDefaultContent()
  }
}

// Client-side helper remains a simple fallback
export function getServicesContent(): ContentListItem[] {
  const defaults = createDefaultContent()
  return defaults.services.content as ContentListItem[]
}

// Update content section
export async function updateContent(section: ContentSection): Promise<boolean> {
  try {
    const contentString = section.type === 'list' ? JSON.stringify(section.content) : String(section.content)
    await turso.execute({
      sql: `
        UPDATE content_sections 
        SET name = ?, type = ?, content = ?, status = ?, last_updated = CURRENT_TIMESTAMP
        WHERE section_id = ?
      `,
      args: [section.name, section.type, contentString, section.status, section.id]
    })
    return true
  } catch (error) {
    console.error('Error updating content:', error)
    return false
  }
}

// Update multiple content sections
export async function updateMultipleContent(sections: ContentSection[]): Promise<boolean> {
  try {
    for (const section of sections) {
      await updateContent(section)
    }
    return true
  } catch (error) {
    console.error('Error updating multiple content sections:', error)
    return false
  }
}

// Seed initial content rows based on defaults
export async function seedInitialContent(): Promise<void> {
  try {
    const count = await turso.execute('SELECT COUNT(*) as count FROM content_sections')
    const existing = Number(count.rows[0]?.count || 0)
    if (existing > 0) return

    const defaults = createDefaultContent()
    for (const [sectionId, section] of Object.entries(defaults)) {
      const contentString = section.type === 'list' ? JSON.stringify(section.content) : String(section.content)
      await turso.execute({
        sql: `INSERT INTO content_sections (id, section_id, name, type, content, status, last_updated)
              VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        args: [sectionId, sectionId, section.name, section.type, contentString, section.status]
      })
    }
    console.log('✅ Initial content seeded successfully')
  } catch (error) {
    console.error('❌ Failed to seed content:', error)
  }
}
