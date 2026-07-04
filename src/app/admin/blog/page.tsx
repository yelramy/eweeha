'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import BlogEditor from '@/components/admin/BlogEditor'
import { useNotification } from '@/contexts/NotificationContext'
import Image from 'next/image'

interface BlogCategory {
  id: string
  slug: string
  name: string
  description: string | null
  createdAt: string
}

interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string
  featuredImage: string | null
  author: string
  status: 'published' | 'draft' | 'scheduled'
  isFeatured: boolean
  metaTitle: string | null
  metaDescription: string | null
  ogImage: string | null
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  scheduledAt: string | null
  categories?: BlogCategory[]
}

interface BlogStats {
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  scheduledPosts: number
  totalCategories: number
}

export default function BlogManagement() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [stats, setStats] = useState<BlogStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const notification = useNotification()

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [postsRes, categoriesRes, statsRes] = await Promise.all([
        fetch('/api/admin/blog'),
        fetch('/api/admin/blog/categories'),
        fetch('/api/admin/blog?stats=true')
      ])
      const [postsData, categoriesData, statsData] = await Promise.all([
        postsRes.json(), categoriesRes.json(), statsRes.json()
      ])
      if (postsData.success) setPosts(postsData.posts)
      if (categoriesData.success) setCategories(categoriesData.categories)
      if (statsData.success) setStats(statsData.stats)
    } catch (error) {
      console.error('Error loading blog data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleSavePost = async (postData: Partial<BlogPost> & { categoryIds?: string[] }) => {
    try {
      const isNew = !postData.id
      const response = await fetch('/api/admin/blog', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      })
      const result = await response.json()
      if (result.success) {
        notification.success(isNew ? 'Post created' : 'Post updated')
        setShowEditor(false)
        setEditingPost(null)
        loadData()
      } else {
        notification.error(result.error || 'Failed to save')
      }
    } catch (error) {
      console.error('Error saving post:', error)
    }
  }

  const handleDeletePost = async (id: string) => {
    if (!confirm('Delete this post?')) return
    try {
      const response = await fetch(`/api/admin/blog?id=${id}`, { method: 'DELETE' })
      const result = await response.json()
      if (result.success) {
        notification.success('Deleted')
        loadData()
      }
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  const handleCreateCategory = async (name: string, description?: string): Promise<BlogCategory> => {
    const response = await fetch('/api/admin/blog/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    })
    const result = await response.json()
    if (result.success) {
      setCategories(prev => [...prev, result.category])
      return result.category
    }
    throw new Error(result.error || 'Failed to create category')
  }

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'

  if (loading) {
    return <AdminLayout><div className="p-4 text-sm text-gray-500">Loading...</div></AdminLayout>
  }

  return (
    <AdminLayout>
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Blog</h1>
          <button onClick={() => { setEditingPost(null); setShowEditor(true) }} className="px-3 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800 w-full sm:w-auto">+ New Post</button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm border border-gray-300 min-w-[350px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-2 text-left font-medium text-gray-700 border-r border-b border-gray-300">Total</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 border-r border-b border-gray-300">Published</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 border-r border-b border-gray-300">Drafts</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 border-b border-gray-300">Categories</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-2 border-r border-gray-300 bg-primary-50 font-medium">{stats.totalPosts}</td>
                  <td className="px-3 py-2 border-r border-gray-300 bg-green-50">{stats.publishedPosts}</td>
                  <td className="px-3 py-2 border-r border-gray-300">{stats.draftPosts}</td>
                  <td className="px-3 py-2">{stats.totalCategories}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded w-full sm:w-48"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-300 rounded w-full sm:w-auto">
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>

        {/* Posts */}
        {filteredPosts.length === 0 ? (
          <p className="text-gray-500 text-sm py-8 text-center">No posts found</p>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="sm:hidden space-y-3">
              {filteredPosts.map((post) => (
                <div key={post.id} className="border border-gray-300 rounded p-3 bg-white">
                  <div className="flex gap-3">
                    {post.featuredImage ? (
                      <Image src={post.featuredImage} alt={post.title} width={60} height={40} className="w-16 h-12 object-cover rounded border" />
                    ) : (
                      <div className="w-16 h-12 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-400">N/A</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{post.title} {post.isFeatured && <span className="text-yellow-500">★</span>}</div>
                      <div className="text-xs text-gray-500">/blog/{post.slug}</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-1.5 py-0.5 ${
                        post.status === 'published' ? 'bg-green-100 text-green-700' :
                        post.status === 'scheduled' ? 'bg-primary-100 text-primary-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>{post.status}</span>
                      <span className="text-xs text-gray-500">{formatDate(post.publishedAt || post.createdAt)}</span>
                    </div>
                    <div className="flex gap-3 text-sm">
                      {post.status === 'published' && (
                        <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className="text-gray-600 py-1">View</a>
                      )}
                      <button onClick={() => { setEditingPost(post); setShowEditor(true) }} className="text-primary-600 py-1">Edit</button>
                      <button onClick={() => handleDeletePost(post.id)} className="text-red-600 py-1">Del</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm border border-gray-300 min-w-[500px]">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-3 py-2 text-left font-medium text-gray-700 border-r border-b border-gray-300">Post</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 border-r border-b border-gray-300 hidden md:table-cell">Categories</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-700 border-r border-b border-gray-300">Status</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 border-r border-b border-gray-300">Date</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 border-b border-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPosts.map((post, i) => (
                    <tr key={post.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-2 border-r border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          {post.featuredImage ? (
                            <Image src={post.featuredImage} alt={post.title} width={40} height={28} className="w-10 h-7 object-cover rounded border" />
                          ) : (
                            <div className="w-10 h-7 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-400">N/A</div>
                          )}
                          <div>
                            <div className="font-medium">{post.title} {post.isFeatured && <span className="text-yellow-500">★</span>}</div>
                            <div className="text-xs text-gray-500">/blog/{post.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 border-r border-b border-gray-200 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {post.categories?.slice(0, 2).map(cat => (
                            <span key={cat.id} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{cat.name}</span>
                          ))}
                          {(post.categories?.length || 0) > 2 && <span className="text-xs text-gray-400">+{(post.categories?.length || 0) - 2}</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2 border-r border-b border-gray-200 text-center">
                        <span className={`text-xs px-1.5 py-0.5 ${
                          post.status === 'published' ? 'bg-green-100 text-green-700' :
                          post.status === 'scheduled' ? 'bg-primary-100 text-primary-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {post.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 border-r border-b border-gray-200">{formatDate(post.publishedAt || post.createdAt)}</td>
                      <td className="px-3 py-2 border-b border-gray-200">
                        <div className="flex gap-2 text-xs">
                          {post.status === 'published' && (
                            <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:underline py-1">View</a>
                          )}
                          <button onClick={() => { setEditingPost(post); setShowEditor(true) }} className="text-primary-600 hover:underline py-1">Edit</button>
                          <button onClick={() => handleDeletePost(post.id)} className="text-red-600 hover:underline py-1">Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Editor Modal */}
        {showEditor && (
          <BlogEditor
            post={editingPost ? { ...editingPost, categoryIds: editingPost.categories?.map(c => c.id) || [] } : null}
            categories={categories}
            onSave={handleSavePost}
            onClose={() => { setShowEditor(false); setEditingPost(null) }}
            onCreateCategory={handleCreateCategory}
          />
        )}
      </div>
    </AdminLayout>
  )
}
