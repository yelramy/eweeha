'use client'

import { useState, useCallback, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { TextStyle } from '@tiptap/extension-text-style'
import FontFamily from '@tiptap/extension-font-family'
import { Color } from '@tiptap/extension-color'
import {
  XMarkIcon,
  PhotoIcon,
  LinkIcon,
  CalendarIcon,
  TagIcon,
  StarIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import Button from '@/components/Button'
import NextImage from 'next/image'

// Font options for the editor
const FONT_FAMILIES = [
  { label: 'Default', value: '' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: 'Times New Roman, serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Courier New', value: 'Courier New, monospace' },
  { label: 'Trebuchet MS', value: 'Trebuchet MS, sans-serif' },
  { label: 'Palatino', value: 'Palatino Linotype, serif' },
]

const TEXT_COLORS = [
  { label: 'Default', value: '' },
  { label: 'Black', value: '#000000' },
  { label: 'Gray', value: '#6B7280' },
  { label: 'Red', value: '#DC2626' },
  { label: 'Orange', value: '#EA580C' },
  { label: 'Green', value: '#16A34A' },
  { label: 'Blue', value: '#2563EB' },
  { label: 'Purple', value: '#9333EA' },
  { label: 'Pink', value: '#DB2777' },
]

interface BlogCategory {
  id: string
  slug: string
  name: string
  description: string | null
}

interface BlogPost {
  id?: string
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
  scheduledAt: string | null
  categoryIds?: string[]
}

interface BlogEditorProps {
  post?: BlogPost | null
  categories: BlogCategory[]
  onSave: (post: Partial<BlogPost> & { categoryIds?: string[] }) => Promise<void>
  onClose: () => void
  onCreateCategory: (name: string, description?: string) => Promise<BlogCategory>
}

// Toolbar button component - uses onMouseDown to prevent stealing focus from editor
const ToolbarButton = ({ 
  onClick, 
  active, 
  disabled,
  children, 
  title 
}: { 
  onClick: () => void
  active?: boolean
  disabled?: boolean
  children: React.ReactNode
  title: string
}) => (
  <button
    type="button"
    onMouseDown={(e) => {
      e.preventDefault() // Prevent button from stealing focus
      if (!disabled) onClick()
    }}
    disabled={disabled}
    title={title}
    tabIndex={-1}
    className={`p-2 rounded transition-colors ${
      active 
        ? 'bg-primary-100 text-primary-700' 
        : 'hover:bg-gray-100 text-gray-700'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {children}
  </button>
)

export default function BlogEditor({ post, categories, onSave, onClose, onCreateCategory }: BlogEditorProps) {
  const [title, setTitle] = useState(post?.title || '')
  const [slug, setSlug] = useState(post?.slug || '')
  const [excerpt, setExcerpt] = useState(post?.excerpt || '')
  const [featuredImage, setFeaturedImage] = useState(post?.featuredImage || '')
  const [author, setAuthor] = useState(post?.author || 'Eweeha')
  const [status, setStatus] = useState<'published' | 'draft' | 'scheduled'>(post?.status || 'draft')
  const [isFeatured, setIsFeatured] = useState(post?.isFeatured || false)
  const [metaTitle, setMetaTitle] = useState(post?.metaTitle || '')
  const [metaDescription, setMetaDescription] = useState(post?.metaDescription || '')
  const [ogImage, setOgImage] = useState(post?.ogImage || '')
  const [scheduledAt, setScheduledAt] = useState(post?.scheduledAt || '')
  const [selectedCategories, setSelectedCategories] = useState<string[]>(post?.categoryIds || [])
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'settings'>('content')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [showCategoryInput, setShowCategoryInput] = useState(false)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')

  // TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      Color.configure({
        types: ['textStyle'],
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary-600 underline',
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your blog post...',
      }),
    ],
    content: post?.content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[400px] p-4',
      },
    },
    immediatelyRender: false, // Required for SSR/Next.js to avoid hydration mismatch
  })

  // Auto-generate slug from title
  useEffect(() => {
    if (!post?.id && title) {
      const generatedSlug = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setSlug(generatedSlug)
    }
  }, [title, post?.id])

  // Image upload handler
  const handleImageUpload = useCallback(async (file: File, type: 'featured' | 'content' | 'og') => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'eweeha/blog')

      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      if (result.success) {
        const imageUrl = result.data.secure_url
        if (type === 'featured') {
          setFeaturedImage(imageUrl)
        } else if (type === 'og') {
          setOgImage(imageUrl)
        } else if (type === 'content' && editor) {
          editor.chain().focus().setImage({ src: imageUrl }).run()
        }
      } else {
        alert('Failed to upload image: ' + result.error)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }, [editor])

  // Add link to editor
  const addLink = useCallback(() => {
    if (linkUrl && editor) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
      setLinkUrl('')
      setShowLinkInput(false)
    }
  }, [editor, linkUrl])

  const toggleLinkInput = useCallback(() => {
    if (editor?.isActive('link')) {
      editor.chain().focus().unsetLink().run()
    } else {
      setShowLinkInput(prev => !prev)
    }
  }, [editor])

  // Handle save
  const handleSave = async () => {
    if (!title.trim()) {
      alert('Title is required')
      return
    }
    if (!editor?.getHTML()) {
      alert('Content is required')
      return
    }

    setSaving(true)
    try {
      await onSave({
        id: post?.id,
        title,
        slug,
        excerpt: excerpt || null,
        content: editor.getHTML(),
        featuredImage: featuredImage || null,
        author,
        status,
        isFeatured,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        ogImage: ogImage || null,
        scheduledAt: status === 'scheduled' ? scheduledAt : null,
        categoryIds: selectedCategories,
      })
    } finally {
      setSaving(false)
    }
  }

  // Handle category toggle
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  // Handle new category creation
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return
    try {
      const newCategory = await onCreateCategory(newCategoryName)
      setSelectedCategories(prev => [...prev, newCategory.id])
      setNewCategoryName('')
      setShowCategoryInput(false)
    } catch (error) {
      console.error('Failed to create category:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-5xl mx-4 max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">
            {post?.id ? 'Edit Post' : 'New Post'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b px-4">
          <nav className="flex space-x-6">
            {(['content', 'seo', 'settings'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'content' && (
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Post title"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                  placeholder="post-url-slug"
                />
              </div>

              {/* Featured Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Featured Image</label>
                <div className="flex items-center gap-4">
                  {featuredImage && (
                    <div className="relative w-32 h-20 rounded overflow-hidden border">
                      <NextImage
                        src={featuredImage}
                        alt="Featured"
                        fill
                        className="object-cover"
                      />
                      <button
                        onClick={() => setFeaturedImage('')}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                      <PhotoIcon className="h-4 w-4 mr-2" />
                      {uploading ? 'Uploading...' : 'Upload Image'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(file, 'featured')
                      }}
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Brief description of the post..."
                />
              </div>

              {/* Editor Toolbar */}
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-gray-50">
                  {/* Font Family Dropdown */}
                  <div className="relative">
                    <select
                      onChange={(e) => {
                        if (editor) {
                          if (e.target.value) {
                            editor.chain().focus().setFontFamily(e.target.value).run()
                          } else {
                            editor.chain().focus().unsetFontFamily().run()
                          }
                        }
                      }}
                      value={editor?.getAttributes('textStyle').fontFamily || ''}
                      disabled={!editor}
                      className="appearance-none bg-white border border-gray-300 rounded px-2 py-1.5 pr-7 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer disabled:opacity-50"
                      title="Font Family"
                    >
                      {FONT_FAMILIES.map(font => (
                        <option key={font.value} value={font.value}>
                          {font.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="h-3 w-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
                  </div>

                  {/* Text Color Dropdown */}
                  <div className="relative">
                    <select
                      onChange={(e) => {
                        if (editor) {
                          if (e.target.value) {
                            editor.chain().focus().setColor(e.target.value).run()
                          } else {
                            editor.chain().focus().unsetColor().run()
                          }
                        }
                      }}
                      value={editor?.getAttributes('textStyle').color || ''}
                      disabled={!editor}
                      className="appearance-none bg-white border border-gray-300 rounded px-2 py-1.5 pr-7 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer disabled:opacity-50"
                      title="Text Color"
                    >
                      {TEXT_COLORS.map(color => (
                        <option key={color.value} value={color.value} style={{ color: color.value || 'inherit' }}>
                          {color.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="h-3 w-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
                  </div>

                  <div className="w-px h-6 bg-gray-300 mx-1" />

                  <ToolbarButton
                    onClick={() => { if (editor) editor.chain().focus().toggleBold().run() }}
                    active={editor?.isActive('bold')}
                    disabled={!editor}
                    title="Bold"
                  >
                    <strong>B</strong>
                  </ToolbarButton>
                  <ToolbarButton
                    onClick={() => { if (editor) editor.chain().focus().toggleItalic().run() }}
                    active={editor?.isActive('italic')}
                    disabled={!editor}
                    title="Italic"
                  >
                    <em>I</em>
                  </ToolbarButton>
                  <ToolbarButton
                    onClick={() => { if (editor) editor.chain().focus().toggleStrike().run() }}
                    active={editor?.isActive('strike')}
                    disabled={!editor}
                    title="Strikethrough"
                  >
                    <s>S</s>
                  </ToolbarButton>

                  <div className="w-px h-6 bg-gray-300 mx-1" />

                  <ToolbarButton
                    onClick={() => { if (editor) editor.chain().focus().toggleHeading({ level: 2 }).run() }}
                    active={editor?.isActive('heading', { level: 2 })}
                    disabled={!editor}
                    title="Heading 2"
                  >
                    H2
                  </ToolbarButton>
                  <ToolbarButton
                    onClick={() => { if (editor) editor.chain().focus().toggleHeading({ level: 3 }).run() }}
                    active={editor?.isActive('heading', { level: 3 })}
                    disabled={!editor}
                    title="Heading 3"
                  >
                    H3
                  </ToolbarButton>

                  <div className="w-px h-6 bg-gray-300 mx-1" />

                  <ToolbarButton
                    onClick={() => { if (editor) editor.chain().focus().toggleBulletList().run() }}
                    active={editor?.isActive('bulletList')}
                    disabled={!editor}
                    title="Bullet List"
                  >
                    • List
                  </ToolbarButton>
                  <ToolbarButton
                    onClick={() => { if (editor) editor.chain().focus().toggleOrderedList().run() }}
                    active={editor?.isActive('orderedList')}
                    disabled={!editor}
                    title="Numbered List"
                  >
                    1. List
                  </ToolbarButton>

                  <div className="w-px h-6 bg-gray-300 mx-1" />

                  <ToolbarButton
                    onClick={() => { if (editor) editor.chain().focus().toggleBlockquote().run() }}
                    active={editor?.isActive('blockquote')}
                    disabled={!editor}
                    title="Quote"
                  >
                    &ldquo;
                  </ToolbarButton>

                  <ToolbarButton onClick={toggleLinkInput} active={editor?.isActive('link') || showLinkInput} disabled={!editor} title="Add Link">
                    <LinkIcon className="h-4 w-4" />
                  </ToolbarButton>

                  <label 
                    className={`p-2 rounded transition-colors hover:bg-gray-100 text-gray-700 cursor-pointer inline-flex ${!editor || uploading ? 'opacity-50 pointer-events-none' : ''}`}
                    title="Insert Image"
                  >
                    <PhotoIcon className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(file, 'content')
                      }}
                      disabled={!editor || uploading}
                    />
                  </label>
                </div>

                {/* Link Input */}
                {showLinkInput && (
                  <div className="flex items-center gap-2 p-2 bg-gray-100 border-b">
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addLink()
                        } else if (e.key === 'Escape') {
                          setShowLinkInput(false)
                          setLinkUrl('')
                        }
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={addLink}
                      disabled={!linkUrl}
                      className="px-3 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 disabled:opacity-50"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowLinkInput(false); setLinkUrl('') }}
                      className="px-2 py-1 text-gray-600 hover:text-gray-800 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Editor Content */}
                {!editor ? (
                  <div className="flex items-center justify-center h-[400px] text-gray-400">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                      <p>Loading editor...</p>
                    </div>
                  </div>
                ) : (
                  <EditorContent editor={editor} />
                )}
              </div>
            </div>
          )}

          {activeTab === 'seo' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta Title
                  <span className="text-gray-400 font-normal ml-2">
                    ({metaTitle.length}/60)
                  </span>
                </label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  maxLength={60}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={title || 'SEO title for search engines'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta Description
                  <span className="text-gray-400 font-normal ml-2">
                    ({metaDescription.length}/160)
                  </span>
                </label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  maxLength={160}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Brief description for search results..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">OG Image</label>
                <p className="text-xs text-gray-500 mb-2">Image shown when shared on social media (1200x630 recommended)</p>
                <div className="flex items-center gap-4">
                  {ogImage && (
                    <div className="relative w-40 h-20 rounded overflow-hidden border">
                      <NextImage
                        src={ogImage}
                        alt="OG Image"
                        fill
                        className="object-cover"
                      />
                      <button
                        onClick={() => setOgImage('')}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                      <PhotoIcon className="h-4 w-4 mr-2" />
                      {uploading ? 'Uploading...' : 'Upload OG Image'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(file, 'og')
                      }}
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Search Preview</p>
                <div className="bg-white p-3 rounded border">
                  <p className="text-primary-700 text-lg truncate">
                    {metaTitle || title || 'Post Title'}
                  </p>
                  <p className="text-green-700 text-sm truncate">
                    eweeha.com/blog/{slug || 'post-slug'}
                  </p>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {metaDescription || excerpt || 'Post description will appear here...'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <div className="flex gap-3">
                  {(['draft', 'published', 'scheduled'] as const).map(s => (
                    <label key={s} className="flex items-center">
                      <input
                        type="radio"
                        name="status"
                        value={s}
                        checked={status === s}
                        onChange={() => setStatus(s)}
                        className="mr-2"
                      />
                      <span className="capitalize">{s}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Schedule Date (only if scheduled) */}
              {status === 'scheduled' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <CalendarIcon className="h-4 w-4 inline mr-1" />
                    Schedule For
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}

              {/* Featured */}
              <div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="flex items-center">
                    {isFeatured ? (
                      <StarIconSolid className="h-4 w-4 text-yellow-500 mr-1" />
                    ) : (
                      <StarIcon className="h-4 w-4 text-gray-400 mr-1" />
                    )}
                    Featured Post
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Featured posts appear prominently on the blog page
                </p>
              </div>

              {/* Author */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full max-w-xs border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Categories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <TagIcon className="h-4 w-4 inline mr-1" />
                  Categories
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedCategories.includes(cat.id)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
                
                {showCategoryInput ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="New category name"
                      className="flex-1 max-w-xs border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                    />
                    <Button size="sm" onClick={handleCreateCategory}>Add</Button>
                    <Button size="sm" variant="outline" onClick={() => setShowCategoryInput(false)}>Cancel</Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCategoryInput(true)}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    + Add new category
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <div className="text-sm text-gray-500">
            {post?.id ? 'Editing existing post' : 'Creating new post'}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : post?.id ? 'Update Post' : 'Create Post'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

