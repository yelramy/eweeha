'use client'

import { useState } from 'react'
import Image from 'next/image'

interface SocialPreviewProps {
  title: string
  description: string
  image?: string
  url?: string
}

/**
 * Social Media Preview Component
 * Shows how content will appear when shared on social platforms
 */
export default function SocialPreview({
  title,
  description,
  image,
  url = process.env.NEXT_PUBLIC_BASE_URL || 'https://eweeha.com'
}: SocialPreviewProps) {
  const [activeTab, setActiveTab] = useState<'facebook' | 'twitter' | 'linkedin'>('facebook')

  // Truncate text for previews
  const truncateTitle = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  const truncateDescription = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  const defaultImage = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://eweeha.com'}/og-image.jpg`
  const previewImage = image || defaultImage

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-charcoal-500">Social Media Preview</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('facebook')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              activeTab === 'facebook'
                ? 'bg-primary-600 text-white'
                : 'bg-warm-100 text-charcoal-500 hover:bg-warm-200'
            }`}
          >
            Facebook
          </button>
          <button
            onClick={() => setActiveTab('twitter')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              activeTab === 'twitter'
                ? 'bg-sky-500 text-white'
                : 'bg-warm-100 text-charcoal-500 hover:bg-warm-200'
            }`}
          >
            Twitter
          </button>
          <button
            onClick={() => setActiveTab('linkedin')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              activeTab === 'linkedin'
                ? 'bg-primary-700 text-white'
                : 'bg-warm-100 text-charcoal-500 hover:bg-warm-200'
            }`}
          >
            LinkedIn
          </button>
        </div>
      </div>

      {/* Facebook Preview */}
      {activeTab === 'facebook' && (
        <div className="border border-warm-300 rounded-lg overflow-hidden bg-white shadow-sm">
          <div className="p-3 border-b border-warm-200">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">
                E
              </div>
              <div>
                <div className="font-semibold text-sm text-charcoal-500">Eweeha</div>
                <div className="text-xs text-warm-500">Just now · 🌍</div>
              </div>
            </div>
          </div>
          <div className="relative w-full h-64 bg-warm-100">
            {previewImage && (
              <Image
                src={previewImage}
                alt={title}
                fill
                className="object-cover"
              />
            )}
          </div>
          <div className="p-4 border-t border-warm-200">
            <div className="text-xs text-warm-500 uppercase mb-1">{new URL(url).hostname}</div>
            <div className="font-semibold text-charcoal-500 mb-1">
              {truncateTitle(title, 80)}
            </div>
            <div className="text-sm text-warm-600">
              {truncateDescription(description, 100)}
            </div>
          </div>
        </div>
      )}

      {/* Twitter Preview */}
      {activeTab === 'twitter' && (
        <div className="border border-warm-300 rounded-2xl overflow-hidden bg-white shadow-sm">
          <div className="p-4">
            <div className="flex items-start space-x-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                E
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1">
                  <span className="font-bold text-charcoal-500">Eweeha</span>
                  <span className="text-warm-500">@eweeha · now</span>
                </div>
                <div className="text-charcoal-500 mt-2 mb-3">
                  Check out our latest update!
                </div>
              </div>
            </div>
            <div className="border border-warm-300 rounded-2xl overflow-hidden">
              <div className="relative w-full h-64 bg-warm-100">
                {previewImage && (
                  <Image
                    src={previewImage}
                    alt={title}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="p-3">
                <div className="font-semibold text-charcoal-500 text-sm mb-1">
                  {truncateTitle(title, 70)}
                </div>
                <div className="text-xs text-warm-600 mb-1">
                  {truncateDescription(description, 120)}
                </div>
                <div className="text-xs text-warm-500">🔗 {new URL(url).hostname}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LinkedIn Preview */}
      {activeTab === 'linkedin' && (
        <div className="border border-warm-300 rounded-lg overflow-hidden bg-white shadow-sm">
          <div className="p-4 border-b border-warm-200">
            <div className="flex items-center space-x-2">
              <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">
                E
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm text-charcoal-500">Eweeha</div>
                <div className="text-xs text-warm-500">Just now</div>
              </div>
            </div>
            <div className="mt-3 text-charcoal-500 text-sm">
              Sharing our latest update
            </div>
          </div>
          <div className="relative w-full h-64 bg-warm-100">
            {previewImage && (
              <Image
                src={previewImage}
                alt={title}
                fill
                className="object-cover"
              />
            )}
          </div>
          <div className="p-4">
            <div className="font-semibold text-charcoal-500 mb-1">
              {truncateTitle(title, 100)}
            </div>
            <div className="text-sm text-warm-600 mb-2">
              {truncateDescription(description, 150)}
            </div>
            <div className="text-xs text-warm-500">{new URL(url).hostname}</div>
          </div>
        </div>
      )}

      {/* Character counts and warnings */}
      <div className="bg-warm-50 rounded-lg p-4 space-y-2">
        <h4 className="font-medium text-sm text-charcoal-500 mb-2">SEO Tips:</h4>
        <div className="space-y-1 text-xs">
          <div className={`flex items-center justify-between ${title.length > 60 ? 'text-orange-600' : 'text-green-600'}`}>
            <span>Title length: {title.length} characters</span>
            {title.length > 60 ? (
              <span className="font-medium">⚠️ Too long (recommended: 50-60)</span>
            ) : (
              <span className="font-medium">✓ Good</span>
            )}
          </div>
          <div className={`flex items-center justify-between ${description.length > 160 ? 'text-orange-600' : 'text-green-600'}`}>
            <span>Description length: {description.length} characters</span>
            {description.length > 160 ? (
              <span className="font-medium">⚠️ Too long (recommended: 150-160)</span>
            ) : (
              <span className="font-medium">✓ Good</span>
            )}
          </div>
          <div className={`flex items-center justify-between ${!image ? 'text-orange-600' : 'text-green-600'}`}>
            <span>OG Image</span>
            {!image ? (
              <span className="font-medium">⚠️ Using default image</span>
            ) : (
              <span className="font-medium">✓ Custom image set</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

