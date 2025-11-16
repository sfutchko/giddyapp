'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { X, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'warning' | 'info'
type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'

interface Toast {
  id: string
  message: string
  description?: string
  type: ToastType
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
  position: ToastPosition
  setPosition: (position: ToastPosition) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: React.ReactNode
  position?: ToastPosition
  maxToasts?: number
}

export function ToastProvider({
  children,
  position: initialPosition = 'top-right',
  maxToasts = 5
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [position, setPosition] = useState<ToastPosition>(initialPosition)

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString()
    const newToast: Toast = { ...toast, id }

    setToasts((prev) => {
      const updated = [...prev, newToast]
      // Limit the number of toasts
      if (updated.length > maxToasts) {
        return updated.slice(-maxToasts)
      }
      return updated
    })

    // Auto-remove toast after duration
    if (toast.duration !== 0) {
      const timeout = toast.duration || 5000
      setTimeout(() => {
        removeToast(id)
      }, timeout)
    }
  }, [maxToasts])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const clearToasts = useCallback(() => {
    setToasts([])
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts, position, setPosition }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

function ToastContainer() {
  const { toasts, removeToast, position } = useToast()

  const positionClasses: Record<ToastPosition, string> = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
  }

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col gap-2 pointer-events-none',
        positionClasses[position],
        position.includes('bottom') && 'flex-col-reverse'
      )}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

interface ToastItemProps {
  toast: Toast
  onRemove: () => void
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => {
      setIsVisible(true)
    })
  }, [])

  const handleRemove = () => {
    setIsExiting(true)
    setTimeout(onRemove, 200) // Match animation duration
  }

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />
  }

  const backgroundColors: Record<ToastType, string> = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200'
  }

  return (
    <div
      className={cn(
        'pointer-events-auto min-w-[350px] max-w-md rounded-lg border shadow-lg transition-all duration-200',
        backgroundColors[toast.type],
        isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{toast.message}</p>
          {toast.description && (
            <p className="mt-1 text-sm text-gray-600">{toast.description}</p>
          )}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="mt-2 text-sm font-medium text-green-600 hover:text-green-700"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        <button
          onClick={handleRemove}
          className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// Helper functions for common toast types
export const toast = {
  success: (message: string, description?: string, duration?: number) => {
    const { addToast } = useToast()
    addToast({ message, description, type: 'success', duration })
  },
  error: (message: string, description?: string, duration?: number) => {
    const { addToast } = useToast()
    addToast({ message, description, type: 'error', duration })
  },
  warning: (message: string, description?: string, duration?: number) => {
    const { addToast } = useToast()
    addToast({ message, description, type: 'warning', duration })
  },
  info: (message: string, description?: string, duration?: number) => {
    const { addToast } = useToast()
    addToast({ message, description, type: 'info', duration })
  }
}