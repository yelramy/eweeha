'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import Image from 'next/image'
import { useNotification } from '@/contexts/NotificationContext'

interface ListItem {
  title: string
  description: string
  icon: string
  image?: string
}

interface ContentSection {
  id: string
  name: string
  type: 'text' | 'rich_text' | 'list'
  content: string | ListItem[]
  lastUpdated: string
  status: 'published' | 'draft'
}

const defaultSections: ContentSection[] = [
  {
    id: 'hero-title', name: 'Hero Title', type: 'text',
    content: 'Wedding Car Rental in Lebanon',
    lastUpdated: '2024-01-15T10:30:00Z', status: 'published'
  },
  {
    id: 'hero-subtitle', name: 'Hero Subtitle', type: 'rich_text',
    content: 'Reliable, comfortable, and wedding car services for all your transportation needs.',
    lastUpdated: '2024-01-15T10:30:00Z', status: 'published'
  },
  {
    id: 'services', name: 'Services', type: 'list',
    content: [
      { title: 'Family Adventures', description: 'Family trips with driver', icon: '🚐' },
      { title: 'Corporate Transport', description: 'Professional transportation', icon: '🏢' },
      { title: 'Event Transportation', description: 'Weddings and parties', icon: '🎊' },
      { title: 'Long-term Rentals', description: 'Extended rental options', icon: '📅' }
    ],
    lastUpdated: '2024-01-14T14:20:00Z', status: 'published'
  }
]

export default function ContentManagement() {
  const [sections, setSections] = useState<ContentSection[]>([])
  const [editingSection, setEditingSection] = useState<ContentSection | null>(null)
  const [activeTab, setActiveTab] = useState('content')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const notification = useNotification()

  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await fetch('/api/admin/content')
        const result = await response.json()
        setSections(result.success ? result.sections : defaultSections)
      } catch {
        setSections(defaultSections)
      } finally {
        setLoading(false)
      }
    }
    loadContent()
  }, [])

  const handleSave = async (section: ContentSection) => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section })
      })
      const result = await response.json()
      if (result.success) {
        setSections(sections.map(s => s.id === section.id ? { ...section, lastUpdated: new Date().toISOString() } : s))
        setEditingSection(null)
        notification.success('Saved')
      } else {
        notification.error('Failed to save')
      }
    } catch {
      notification.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const renderEditor = (section: ContentSection) => {
    if (section.type === 'list') {
      return (
        <div className="space-y-3">
          {(section.content as ListItem[]).map((item, i) => (
            <div key={i} className="border border-gray-200 rounded p-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                <input
                  type="text" value={item.title} placeholder="Title"
                  onChange={(e) => {
                    const newContent = [...(section.content as ListItem[])]
                    newContent[i] = { ...item, title: e.target.value }
                    setEditingSection({ ...section, content: newContent })
                  }}
                  className="px-3 py-2 border border-gray-300 rounded text-sm"
                />
                <input
                  type="text" value={item.icon} placeholder="Icon (emoji)"
                  onChange={(e) => {
                    const newContent = [...(section.content as ListItem[])]
                    newContent[i] = { ...item, icon: e.target.value }
                    setEditingSection({ ...section, content: newContent })
                  }}
                  className="px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>
              <textarea
                value={item.description} placeholder="Description" rows={2}
                onChange={(e) => {
                  const newContent = [...(section.content as ListItem[])]
                  newContent[i] = { ...item, description: e.target.value }
                  setEditingSection({ ...section, content: newContent })
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
              {item.image && (
                <Image src={item.image} alt={item.title} width={80} height={50} className="mt-2 w-20 h-12 object-cover rounded border" />
              )}
            </div>
          ))}
        </div>
      )
    }
    if (section.type === 'rich_text') {
      return (
        <textarea
          rows={4}
          value={typeof section.content === 'string' ? section.content : ''}
          onChange={(e) => setEditingSection({ ...section, content: e.target.value })}
          className="w-full px-3 py-3 border border-gray-300 rounded text-base"
        />
      )
    }
    return (
      <input
        type="text"
        value={typeof section.content === 'string' ? section.content : ''}
        onChange={(e) => setEditingSection({ ...section, content: e.target.value })}
        className="w-full px-3 py-3 border border-gray-300 rounded text-base"
      />
    )
  }

  if (loading) {
    return <AdminLayout><div className="p-4 text-sm text-gray-500">Loading...</div></AdminLayout>
  }

  return (
    <AdminLayout>
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Content</h1>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-4 text-sm">
          {[{ id: 'content', label: 'Website Content' }, { id: 'seo', label: 'SEO Settings' }].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded ${activeTab === tab.id ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'content' && (
          <>
            {/* Mobile Cards */}
            <div className="sm:hidden space-y-3">
              {sections.map((section) => (
                <div key={section.id} className="border border-gray-300 rounded p-3 bg-white">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">{section.name}</div>
                      <div className="text-xs text-gray-500">{section.type}</div>
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 ${section.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {section.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 truncate mb-2">
                    {section.type === 'list' 
                      ? `${(section.content as ListItem[]).length} items` 
                      : (typeof section.content === 'string' ? section.content.slice(0, 50) + '...' : '')}
                  </div>
                  <button onClick={() => setEditingSection(section)} className="text-primary-600 text-sm py-1">Edit</button>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm border border-gray-300 min-w-[450px]">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-3 py-2 text-left font-medium text-gray-700 border-r border-b border-gray-300">Section</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 border-r border-b border-gray-300 hidden md:table-cell">Type</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-700 border-r border-b border-gray-300">Status</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 border-r border-b border-gray-300">Preview</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 border-b border-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sections.map((section, i) => (
                    <tr key={section.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-2 border-r border-b border-gray-200 font-medium">{section.name}</td>
                      <td className="px-3 py-2 border-r border-b border-gray-200 hidden md:table-cell">{section.type}</td>
                      <td className="px-3 py-2 border-r border-b border-gray-200 text-center">
                        <span className={`text-xs px-1.5 py-0.5 ${section.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {section.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 border-r border-b border-gray-200 max-w-xs truncate">
                        {section.type === 'list' 
                          ? `${(section.content as ListItem[]).length} items` 
                          : (typeof section.content === 'string' ? section.content.slice(0, 50) + '...' : '')}
                      </td>
                      <td className="px-3 py-2 border-b border-gray-200">
                        <button onClick={() => setEditingSection(section)} className="text-primary-600 hover:underline text-xs py-1">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'seo' && (
          <div className="border border-gray-300 rounded p-4 bg-white">
            <p className="text-gray-500 text-sm">SEO settings are managed in the AI SEO page for more advanced features.</p>
            <a href="/admin/ai-seo" className="text-primary-600 hover:underline text-sm mt-2 inline-block py-1">Go to AI SEO Tools →</a>
          </div>
        )}

        {/* Edit Modal */}
        {editingSection && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setEditingSection(null)}>
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-5 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4">Edit: {editingSection.name}</h3>
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1">Content</label>
                {renderEditor(editingSection)}
              </div>
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1">Status</label>
                <select
                  value={editingSection.status}
                  onChange={(e) => setEditingSection({ ...editingSection, status: e.target.value as 'published' | 'draft' })}
                  className="px-3 py-2 border border-gray-300 rounded text-sm w-full sm:w-auto"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button onClick={() => setEditingSection(null)} className="flex-1 px-3 py-3 border border-gray-300 rounded text-sm">Cancel</button>
                <button onClick={() => handleSave(editingSection)} disabled={saving} className="flex-1 px-3 py-3 bg-gray-900 text-white rounded text-sm disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
