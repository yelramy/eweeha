'use client'

import { useState } from 'react'
import AdminLayout from '@/components/AdminLayout'

interface SEOResult { title?: string; description?: string; keywords?: string[] }
interface KeywordResult { topic: string; keywords: { primary: string[]; secondary: string[]; longTail: string[] }; count: number }
interface AuditResult { url: string; analysis: { score: number; issues: Array<{ severity: 'high' | 'medium' | 'low'; message: string }>; suggestions: string[] } }

export default function AISEOPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'generate' | 'keywords' | 'audit'>('generate')

  // Form states
  const [seoForm, setSeoForm] = useState({ pageName: '', pageContent: '', keywords: '', targetAudience: '' })
  const [seoResult, setSeoResult] = useState<SEOResult | null>(null)

  const [keywordForm, setKeywordForm] = useState({ topic: '', industry: 'Wedding Car Rental', location: 'Lebanon', targetAudience: '' })
  const [keywordResult, setKeywordResult] = useState<KeywordResult | null>(null)

  const [auditForm, setAuditForm] = useState({ url: '', title: '', description: '', content: '', keywords: '' })
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null)

  const handleGenerateSEO = async () => {
    setLoading(true); setError(null); setSeoResult(null)
    try {
      const response = await fetch('/api/ai/seo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'all',
          data: { pageName: seoForm.pageName, pageContent: seoForm.pageContent, keywords: seoForm.keywords.split(',').map(k => k.trim()).filter(Boolean), targetAudience: seoForm.targetAudience, businessName: 'Eweeha' }
        })
      })
      if (!response.ok) throw new Error((await response.json()).error || 'Failed')
      setSeoResult(await response.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  const handleKeywordResearch = async () => {
    setLoading(true); setError(null); setKeywordResult(null)
    try {
      const response = await fetch('/api/ai/keywords/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(keywordForm)
      })
      if (!response.ok) throw new Error((await response.json()).error || 'Failed')
      setKeywordResult(await response.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSEOAudit = async () => {
    setLoading(true); setError(null); setAuditResult(null)
    try {
      const response = await fetch('/api/ai/seo/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...auditForm, keywords: auditForm.keywords.split(',').map(k => k.trim()).filter(Boolean) })
      })
      if (!response.ok) throw new Error((await response.json()).error || 'Failed')
      setAuditResult(await response.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">AI SEO Tools</h1>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-4 text-sm">
          {[{ id: 'generate', label: 'Generate' }, { id: 'keywords', label: 'Keywords' }, { id: 'audit', label: 'Audit' }].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3 py-2 rounded ${activeTab === tab.id ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm mb-4">{error}</div>}

        {/* Generate SEO */}
        {activeTab === 'generate' && (
          <div className="border border-gray-300 rounded p-4 bg-white">
            <h2 className="font-semibold text-gray-900 mb-3">Generate SEO Meta Tags</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Page Name *</label>
                  <input type="text" value={seoForm.pageName} onChange={(e) => setSeoForm({...seoForm, pageName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-base" placeholder="Wedding Car Services" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Target Audience</label>
                  <input type="text" value={seoForm.targetAudience} onChange={(e) => setSeoForm({...seoForm, targetAudience: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-base" placeholder="families, tourists" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Page Content Summary *</label>
                <textarea rows={3} value={seoForm.pageContent} onChange={(e) => setSeoForm({...seoForm, pageContent: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-base" placeholder="Brief summary..." />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Target Keywords (comma-separated)</label>
                <input type="text" value={seoForm.keywords} onChange={(e) => setSeoForm({...seoForm, keywords: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-base" placeholder="wedding car rental, beirut transportation" />
              </div>
              <button onClick={handleGenerateSEO} disabled={loading || !seoForm.pageName || !seoForm.pageContent} className="w-full sm:w-auto px-4 py-3 bg-gray-900 text-white rounded text-sm disabled:opacity-50">
                {loading ? 'Generating...' : 'Generate'}
              </button>
            </div>

            {seoResult && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <h3 className="font-semibold text-gray-900 mb-2">Results</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-gray-300">
                    <tbody>
                      {seoResult.title && (
                        <tr className="bg-white">
                          <td className="px-3 py-2 border-r border-b border-gray-200 font-medium w-20 sm:w-24">Title</td>
                          <td className="px-3 py-2 border-b border-gray-200">{seoResult.title} <span className="text-gray-400 text-xs">({seoResult.title.length})</span></td>
                        </tr>
                      )}
                      {seoResult.description && (
                        <tr className="bg-gray-50">
                          <td className="px-3 py-2 border-r border-b border-gray-200 font-medium">Desc</td>
                          <td className="px-3 py-2 border-b border-gray-200">{seoResult.description} <span className="text-gray-400 text-xs">({seoResult.description.length})</span></td>
                        </tr>
                      )}
                      {seoResult.keywords && (
                        <tr className="bg-white">
                          <td className="px-3 py-2 border-r border-b border-gray-200 font-medium">Keywords</td>
                          <td className="px-3 py-2 border-b border-gray-200">
                            <div className="flex flex-wrap gap-1">{seoResult.keywords.map((k, i) => <span key={i} className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{k}</span>)}</div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Keyword Research */}
        {activeTab === 'keywords' && (
          <div className="border border-gray-300 rounded p-4 bg-white">
            <h2 className="font-semibold text-gray-900 mb-3">Keyword Research</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Topic *</label>
                  <input type="text" value={keywordForm.topic} onChange={(e) => setKeywordForm({...keywordForm, topic: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-base" placeholder="Airport Transfer" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Industry</label>
                  <input type="text" value={keywordForm.industry} onChange={(e) => setKeywordForm({...keywordForm, industry: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-base" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Location</label>
                  <input type="text" value={keywordForm.location} onChange={(e) => setKeywordForm({...keywordForm, location: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-base" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Audience</label>
                  <input type="text" value={keywordForm.targetAudience} onChange={(e) => setKeywordForm({...keywordForm, targetAudience: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-base" placeholder="optional" />
                </div>
              </div>
              <button onClick={handleKeywordResearch} disabled={loading || !keywordForm.topic} className="w-full sm:w-auto px-4 py-3 bg-gray-900 text-white rounded text-sm disabled:opacity-50">
                {loading ? 'Researching...' : 'Research'}
              </button>
            </div>

            {keywordResult && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <h3 className="font-semibold text-gray-900 mb-2">Found {keywordResult.count} keywords for &quot;{keywordResult.topic}&quot;</h3>
                <div className="space-y-3">
                  {keywordResult.keywords.primary.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Primary</h4>
                      <div className="flex flex-wrap gap-1">{keywordResult.keywords.primary.map((k, i) => <span key={i} className="bg-primary-50 text-primary-700 px-2 py-1 rounded text-xs border border-primary-200">{k}</span>)}</div>
                    </div>
                  )}
                  {keywordResult.keywords.secondary.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Secondary</h4>
                      <div className="flex flex-wrap gap-1">{keywordResult.keywords.secondary.map((k, i) => <span key={i} className="bg-gray-100 px-2 py-1 rounded text-xs border border-gray-200">{k}</span>)}</div>
                    </div>
                  )}
                  {keywordResult.keywords.longTail.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Long-tail</h4>
                      <div className="flex flex-wrap gap-1">{keywordResult.keywords.longTail.map((k, i) => <span key={i} className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs border border-green-200">{k}</span>)}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SEO Audit */}
        {activeTab === 'audit' && (
          <div className="border border-gray-300 rounded p-4 bg-white">
            <h2 className="font-semibold text-gray-900 mb-3">SEO Page Audit</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Page URL *</label>
                  <input type="url" value={auditForm.url} onChange={(e) => setAuditForm({...auditForm, url: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-base" placeholder="https://example.com/page" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Page Title</label>
                  <input type="text" value={auditForm.title} onChange={(e) => setAuditForm({...auditForm, title: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-base" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Meta Description</label>
                  <input type="text" value={auditForm.description} onChange={(e) => setAuditForm({...auditForm, description: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-base" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Target Keywords</label>
                  <input type="text" value={auditForm.keywords} onChange={(e) => setAuditForm({...auditForm, keywords: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-base" placeholder="comma-separated" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Page Content *</label>
                <textarea rows={4} value={auditForm.content} onChange={(e) => setAuditForm({...auditForm, content: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-base" placeholder="Paste content..." />
              </div>
              <button onClick={handleSEOAudit} disabled={loading || !auditForm.url || !auditForm.content} className="w-full sm:w-auto px-4 py-3 bg-gray-900 text-white rounded text-sm disabled:opacity-50">
                {loading ? 'Auditing...' : 'Audit Page'}
              </button>
            </div>

            {auditResult && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900">SEO Score</h3>
                    <p className="text-sm text-gray-500 truncate">{auditResult.url}</p>
                  </div>
                  <div className="text-3xl font-bold text-primary-600">{auditResult.analysis.score}/100</div>
                </div>
                
                {auditResult.analysis.issues.length > 0 && (
                  <div className="mb-3">
                    <h4 className="font-medium text-gray-700 mb-2">Issues</h4>
                    <div className="space-y-1">
                      {auditResult.analysis.issues.map((issue, i) => (
                        <div key={i} className={`flex items-start gap-2 text-sm p-2 rounded ${
                          issue.severity === 'high' ? 'bg-red-50' : issue.severity === 'medium' ? 'bg-yellow-50' : 'bg-primary-50'
                        }`}>
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded shrink-0 ${
                            issue.severity === 'high' ? 'bg-red-200 text-red-800' : issue.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' : 'bg-primary-200 text-primary-800'
                          }`}>{issue.severity}</span>
                          <span>{issue.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {auditResult.analysis.suggestions.length > 0 && (
                  <div>
                    <h4 className="font-medium text-green-700 mb-2">Suggestions</h4>
                    <ul className="space-y-1">
                      {auditResult.analysis.suggestions.map((s, i) => (
                        <li key={i} className="text-sm text-green-800 flex items-start gap-2">
                          <span className="text-green-600 shrink-0">✓</span><span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
