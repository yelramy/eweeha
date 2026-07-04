/**
 * Client-side config hook
 * For client components that need config
 * Fetches from /api/config which has proper caching
 */

import { useState, useEffect } from 'react'
import { AppConfig, createDefaultConfig } from '@/constants/configDefaults'

export function useConfig() {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function fetchConfig() {
      try {
        const response = await fetch('/api/config')
        const result = await response.json()
        
        if (mounted && result.success && result.data) {
          setConfig(result.data)
        } else if (mounted) {
          setConfig(createDefaultConfig())
        }
      } catch (error) {
        console.error('Error fetching config:', error)
        if (mounted) {
          setConfig(createDefaultConfig())
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchConfig()

    return () => {
      mounted = false
    }
  }, [])

  return { appConfig: config, loading }
}

