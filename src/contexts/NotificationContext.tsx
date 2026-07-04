'use client'

import React, { createContext, useContext, useCallback, ReactNode } from 'react'
import toast, { ToastOptions } from 'react-hot-toast'

export interface NotificationOptions extends ToastOptions {
  action?: {
    label: string
    onClick: () => void
  }
  persistent?: boolean
}

export interface NotificationContextType {
  success: (message: string, options?: NotificationOptions) => void
  error: (message: string, options?: NotificationOptions) => void
  info: (message: string, options?: NotificationOptions) => void
  warning: (message: string, options?: NotificationOptions) => void
  loading: (message: string, options?: NotificationOptions) => string
  dismiss: (toastId?: string) => void
  dismissAll: () => void
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: Error) => string)
    },
    options?: NotificationOptions
  ) => Promise<T>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

interface NotificationProviderProps {
  children: ReactNode
}

// Custom toast component with action button support
const CustomToast = ({ 
  message, 
  type, 
  action, 
  onDismiss 
}: { 
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  action?: NotificationOptions['action']
  onDismiss: () => void
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success': return '[OK]'
      case 'error': return '[ERR]'
      case 'warning': return '[WARN]'
      case 'info': return '[INFO]'
      default: return '[NOTE]'
    }
  }

  const getColors = () => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800'
      case 'error': return 'bg-red-50 border-red-200 text-red-800'
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'info': return 'bg-primary-50 border-primary-200 text-primary-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border-2 shadow-lg ${getColors()} min-w-[300px]`}>
      <div className="flex items-center space-x-3 flex-1">
        <span className="text-lg">{getIcon()}</span>
        <span className="font-medium text-sm">{message}</span>
      </div>
      <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
        {action && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              action.onClick()
              onDismiss()
            }}
            className="px-3 py-1 text-xs font-semibold bg-white rounded-md hover:bg-gray-100 transition-colors shadow-sm"
          >
            {action.label}
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDismiss()
          }}
          className="text-gray-400 hover:text-gray-600 hover:bg-white hover:bg-opacity-50 rounded p-1 transition-colors"
          aria-label="Dismiss notification"
        >
          x
        </button>
      </div>
    </div>
  )
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const success = useCallback((message: string, options: NotificationOptions = {}) => {
    const { action, persistent, ...toastOptions } = options
    
    toast.custom(
      (t) => (
        <CustomToast
          message={message}
          type="success"
          action={action}
          onDismiss={() => toast.dismiss(t.id)}
        />
      ),
      {
        duration: persistent ? Infinity : 3000, // 3 seconds for success
        ...toastOptions,
      }
    )
  }, [])

  const error = useCallback((message: string, options: NotificationOptions = {}) => {
    const { action, persistent, ...toastOptions } = options
    
    toast.custom(
      (t) => (
        <CustomToast
          message={message}
          type="error"
          action={action}
          onDismiss={() => toast.dismiss(t.id)}
        />
      ),
      {
        duration: persistent ? Infinity : 8000, // Longer for errors
        ...toastOptions,
      }
    )
  }, [])

  const info = useCallback((message: string, options: NotificationOptions = {}) => {
    const { action, persistent, ...toastOptions } = options
    
    toast.custom(
      (t) => (
        <CustomToast
          message={message}
          type="info"
          action={action}
          onDismiss={() => toast.dismiss(t.id)}
        />
      ),
      {
        duration: persistent ? Infinity : 5000,
        ...toastOptions,
      }
    )
  }, [])

  const warning = useCallback((message: string, options: NotificationOptions = {}) => {
    const { action, persistent, ...toastOptions } = options
    
    toast.custom(
      (t) => (
        <CustomToast
          message={message}
          type="warning"
          action={action}
          onDismiss={() => toast.dismiss(t.id)}
        />
      ),
      {
        duration: persistent ? Infinity : 6000,
        ...toastOptions,
      }
    )
  }, [])

  const loading = useCallback((message: string, options: NotificationOptions = {}) => {
    const { persistent, ...toastOptions } = options
    
    return toast.loading(message, {
      duration: persistent ? Infinity : 30000, // 30s timeout for loading
      ...toastOptions,
    })
  }, [])

  const dismiss = useCallback((toastId?: string) => {
    toast.dismiss(toastId)
  }, [])

  const dismissAll = useCallback(() => {
    toast.dismiss()
  }, [])

  const promise = useCallback(<T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: Error) => string)
    },
    options: NotificationOptions = {}
  ) => {
    return toast.promise(promise, messages, options)
  }, [])

  const value: NotificationContextType = {
    success,
    error,
    info,
    warning,
    loading,
    dismiss,
    dismissAll,
    promise,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

// Custom hook to use notifications
export function useNotification() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

// Utility functions for common notification patterns
export const notificationUtils = {
  // API operation patterns
  async handleApiOperation<T>(
    operation: () => Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error?: string | ((error: Error) => string)
    },
    notification: NotificationContextType
  ): Promise<T | null> {
    try {
      return await notification.promise(
        operation(),
        {
          ...messages,
          error: messages.error || 'Operation failed. Please try again.',
        }
      )
    } catch (error) {
      console.error('API operation failed:', error)
      return null
    }
  },

  // Form validation notification
  showValidationErrors(
    errors: Record<string, string[]>,
    notification: NotificationContextType
  ) {
    const errorMessages = Object.entries(errors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('\n')
    
    notification.error(`Validation failed:\n${errorMessages}`, {
      persistent: true,
      action: {
        label: 'Fix Issues',
        onClick: () => {
          // Focus first error field
          const firstErrorField = document.querySelector('[data-error="true"]') as HTMLElement
          firstErrorField?.focus()
        }
      }
    })
  },

  // Network error handling
  handleNetworkError(error: Error, notification: NotificationContextType) {
    if (!navigator.onLine) {
      notification.warning('You appear to be offline. Please check your connection.', {
        persistent: true,
        action: {
          label: 'Retry',
          onClick: () => window.location.reload()
        }
      })
    } else if (error.message.includes('fetch')) {
      notification.error('Network error. Please check your connection and try again.', {
        action: {
          label: 'Retry',
          onClick: () => window.location.reload()
        }
      })
    } else {
      notification.error('Something went wrong. Please try again.')
    }
  }
}
