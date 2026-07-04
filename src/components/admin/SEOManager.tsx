'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/Button'
import { useNotification } from '@/contexts/NotificationContext'
import SocialPreview from './SocialPreview'
import { 
  GlobeAltIcon, 
  PhotoIcon, 
  ChartBarIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

interface SeoSettings {
  siteTitle: string
  siteDescription: string
  keywords: string
  ogImage: string
  twitterHandle: string
  googleSiteVerification: string
  googleAnalyticsId: string
  facebookPixelId: string
}

interface PageSeo {
  id: string
  pagePath: string
  title: string
  description: string
  keywords: string
  ogImage: string
  ogType: string
  noIndex: boolean
  noFollow: boolean
  canonicalUrl: string
}

export default function SEOManager() {
  const [activeTab, setActiveTab] = useState<'global' | 'pages' | 'preview'>('global')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const notification = useNotification()

  // Global SEO state
  const [globalSeo, setGlobalSeo] = useState<SeoSettings>({
    siteTitle: '',
    siteDescription: '',
    keywords: '',
    ogImage: '',
    twitterHandle: '',
    googleSiteVerification: '',
    googleAnalyticsId: '',
    facebookPixelId: '',
  })

  // Page SEO state
  const [pageSeo, setPageSeo] = useState<PageSeo[]>([])
  const [newPage, setNewPage] = useState<Partial<PageSeo>>({
    pagePath: '',
    title: '',
    description: '',
    keywords: '',
    ogImage: '',
    ogType: 'website',
    noIndex: false,
    noFollow: false,
    canonicalUrl: '',
  })
  const [showAddForm, setShowAddForm] = useState(false)

  // Load SEO settings
  useEffect(() => {
    loadGlobalSeo()
    loadPageSeo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadGlobalSeo = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/seo')
      const data = await res.json()
      if (data.success && data.data) {
        setGlobalSeo({
          siteTitle: data.data.siteTitle || '',
          siteDescription: data.data.siteDescription || '',
          keywords: data.data.keywords || '',
          ogImage: data.data.ogImage || '',
          twitterHandle: data.data.twitterHandle || '',
          googleSiteVerification: data.data.googleSiteVerification || '',
          googleAnalyticsId: data.data.googleAnalyticsId || '',
          facebookPixelId: data.data.facebookPixelId || '',
        })
      }
    } catch (error) {
      console.error('Error loading SEO settings:', error)
      notification.error('Failed to load SEO settings')
    } finally {
      setLoading(false)
    }
  }

  const loadPageSeo = async () => {
    try {
      const res = await fetch('/api/admin/seo/pages')
      const data = await res.json()
      if (data.success) {
        setPageSeo(data.data || [])
      }
    } catch (error) {
      console.error('Error loading page SEO:', error)
    }
  }

  const saveGlobalSeo = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/admin/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(globalSeo),
      })

      const data = await res.json()
      if (data.success) {
        notification.success('SEO settings saved successfully')
      } else {
        notification.error('Failed to save SEO settings')
      }
    } catch (error) {
      console.error('Error saving SEO settings:', error)
      notification.error('Failed to save SEO settings')
    } finally {
      setSaving(false)
    }
  }

  const addPageSeo = async () => {
    if (!newPage.pagePath) {
      notification.error('Page path is required')
      return
    }

    try {
      const res = await fetch('/api/admin/seo/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPage),
      })

      const data = await res.json()
      if (data.success) {
        notification.success('Page SEO added successfully')
        setShowAddForm(false)
        setNewPage({
          pagePath: '',
          title: '',
          description: '',
          keywords: '',
          ogImage: '',
          ogType: 'website',
          noIndex: false,
          noFollow: false,
          canonicalUrl: '',
        })
        loadPageSeo()
      } else {
        notification.error('Failed to add page SEO')
      }
    } catch (error) {
      console.error('Error adding page SEO:', error)
      notification.error('Failed to add page SEO')
    }
  }

  const deletePageSeo = async (pagePath: string) => {
    if (!confirm(`Delete SEO override for ${pagePath}?`)) return

    try {
      const res = await fetch(`/api/admin/seo/pages?path=${encodeURIComponent(pagePath)}`, {
        method: 'DELETE',
      })

      const data = await res.json()
      if (data.success) {
        notification.success('Page SEO deleted successfully')
        loadPageSeo()
      } else {
        notification.error('Failed to delete page SEO')
      }
    } catch (error) {
      console.error('Error deleting page SEO:', error)
      notification.error('Failed to delete page SEO')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-warm-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('global')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'global'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-warm-600 hover:text-charcoal-500 hover:border-warm-300'
            }`}
          >
            <GlobeAltIcon className="w-5 h-5 inline mr-2" />
            Global SEO
          </button>
          <button
            onClick={() => setActiveTab('pages')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'pages'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-warm-600 hover:text-charcoal-500 hover:border-warm-300'
            }`}
          >
            <ChartBarIcon className="w-5 h-5 inline mr-2" />
            Page SEO Overrides
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'preview'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-warm-600 hover:text-charcoal-500 hover:border-warm-300'
            }`}
          >
            <EyeIcon className="w-5 h-5 inline mr-2" />
            Social Preview
          </button>
        </nav>
      </div>

      {/* Global SEO Tab */}
      {activeTab === 'global' && (
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-charcoal-500 mb-4">Global SEO Settings</h3>
            <p className="text-sm text-warm-600 mb-6">
              These settings apply to all pages unless overridden by page-specific settings.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-charcoal-500 mb-2">
                Site Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={globalSeo.siteTitle}
                onChange={(e) => setGlobalSeo({ ...globalSeo, siteTitle: e.target.value })}
                className="w-full border border-warm-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Eweeha - Wedding Car Rental in Lebanon"
              />
              <p className="text-xs text-warm-500 mt-1">Max 60 characters for optimal display</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-500 mb-2">
                Meta Description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={globalSeo.siteDescription}
                onChange={(e) => setGlobalSeo({ ...globalSeo, siteDescription: e.target.value })}
                className="w-full border border-warm-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Professional wedding car services in Lebanon..."
              />
              <p className="text-xs text-warm-500 mt-1">
                Max 160 characters. Current: {globalSeo.siteDescription.length}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-500 mb-2">
                Keywords
              </label>
              <input
                type="text"
                value={globalSeo.keywords}
                onChange={(e) => setGlobalSeo({ ...globalSeo, keywords: e.target.value })}
                className="w-full border border-warm-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="wedding car rental lebanon, beirut wedding car rental, transportation"
              />
              <p className="text-xs text-warm-500 mt-1">Comma-separated keywords</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-500 mb-2">
                <PhotoIcon className="w-4 h-4 inline mr-1" />
                OG Image URL
              </label>
              <input
                type="url"
                value={globalSeo.ogImage}
                onChange={(e) => setGlobalSeo({ ...globalSeo, ogImage: e.target.value })}
                className="w-full border border-warm-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="https://yoursite.com/og-image.jpg"
              />
              <p className="text-xs text-warm-500 mt-1">1200x630px recommended for social sharing</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-charcoal-500 mb-2">
                  Twitter Handle
                </label>
                <input
                  type="text"
                  value={globalSeo.twitterHandle}
                  onChange={(e) => setGlobalSeo({ ...globalSeo, twitterHandle: e.target.value })}
                  className="w-full border border-warm-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="@eweeha"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal-500 mb-2">
                  Google Site Verification
                </label>
                <input
                  type="text"
                  value={globalSeo.googleSiteVerification}
                  onChange={(e) => setGlobalSeo({ ...globalSeo, googleSiteVerification: e.target.value })}
                  className="w-full border border-warm-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="verification code"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-charcoal-500 mb-2">
                  Google Analytics ID
                </label>
                <input
                  type="text"
                  value={globalSeo.googleAnalyticsId}
                  onChange={(e) => setGlobalSeo({ ...globalSeo, googleAnalyticsId: e.target.value })}
                  className="w-full border border-warm-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="G-XXXXXXXXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal-500 mb-2">
                  Facebook Pixel ID
                </label>
                <input
                  type="text"
                  value={globalSeo.facebookPixelId}
                  onChange={(e) => setGlobalSeo({ ...globalSeo, facebookPixelId: e.target.value })}
                  className="w-full border border-warm-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="123456789"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-warm-200">
            <Button onClick={saveGlobalSeo} disabled={saving}>
              {saving ? 'Saving...' : 'Save SEO Settings'}
            </Button>
          </div>
        </div>
      )}

      {/* Page SEO Overrides Tab */}
      {activeTab === 'pages' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-charcoal-500">Page-Specific SEO</h3>
                <p className="text-sm text-warm-600 mt-1">
                  Override global SEO for specific pages
                </p>
              </div>
              <Button onClick={() => setShowAddForm(!showAddForm)}>
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Override
              </Button>
            </div>

            {showAddForm && (
              <div className="border border-warm-300 rounded-lg p-4 mb-4 bg-warm-50">
                <h4 className="font-medium text-charcoal-500 mb-3">Add New Page SEO</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-charcoal-500 mb-1">
                      Page Path <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newPage.pagePath}
                      onChange={(e) => setNewPage({ ...newPage, pagePath: e.target.value })}
                      className="w-full border border-warm-300 rounded px-3 py-2 text-sm"
                      placeholder="/fleet or /contact"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-charcoal-500 mb-1">Title</label>
                      <input
                        type="text"
                        value={newPage.title}
                        onChange={(e) => setNewPage({ ...newPage, title: e.target.value })}
                        className="w-full border border-warm-300 rounded px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal-500 mb-1">Keywords</label>
                      <input
                        type="text"
                        value={newPage.keywords}
                        onChange={(e) => setNewPage({ ...newPage, keywords: e.target.value })}
                        className="w-full border border-warm-300 rounded px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal-500 mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={newPage.description}
                      onChange={(e) => setNewPage({ ...newPage, description: e.target.value })}
                      className="w-full border border-warm-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newPage.noIndex}
                        onChange={(e) => setNewPage({ ...newPage, noIndex: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm">No Index</span>
                    </label>
                    <label className="flex items-center ml-4">
                      <input
                        type="checkbox"
                        checked={newPage.noFollow}
                        onChange={(e) => setNewPage({ ...newPage, noFollow: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm">No Follow</span>
                    </label>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="secondary" onClick={() => setShowAddForm(false)}>
                      Cancel
                    </Button>
                    <Button onClick={addPageSeo}>
                      <CheckCircleIcon className="w-4 h-4 mr-2" />
                      Add Override
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Page SEO List */}
            <div className="space-y-2">
              {pageSeo.length === 0 ? (
                <div className="text-center py-8 text-warm-600">
                  No page overrides yet. Click "Add Override" to create one.
                </div>
              ) : (
                pageSeo.map((page) => (
                  <div
                    key={page.id}
                    className="flex items-center justify-between p-4 border border-warm-300 rounded-lg hover:bg-warm-50 transition"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-charcoal-500">{page.pagePath}</div>
                      {page.title && <div className="text-sm text-warm-600 mt-1">{page.title}</div>}
                      {page.description && (
                        <div className="text-xs text-warm-500 mt-1 line-clamp-1">{page.description}</div>
                      )}
                      <div className="flex space-x-2 mt-2">
                        {page.noIndex && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                            No Index
                          </span>
                        )}
                        {page.noFollow && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                            No Follow
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => deletePageSeo(page.pagePath)}
                      className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Social Preview Tab */}
      {activeTab === 'preview' && (
        <div className="bg-white rounded-lg shadow p-6">
          <SocialPreview
            title={globalSeo.siteTitle || 'Eweeha - Wedding Car Rental in Lebanon'}
            description={globalSeo.siteDescription || 'Professional wedding car services in Lebanon'}
            image={globalSeo.ogImage}
            url={process.env.NEXT_PUBLIC_BASE_URL || 'https://eweeha.com'}
          />
        </div>
      )}
    </div>
  )
}

