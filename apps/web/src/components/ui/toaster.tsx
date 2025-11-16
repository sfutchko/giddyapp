'use client'

import { useToast } from '@/hooks/use-toast'
import { X, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  )
}

function Toast({
  id,
  title,
  description,
  type = 'default',
  action
}: {
  id: string
  title: string
  description?: string
  type?: 'success' | 'error' | 'warning' | 'info' | 'default'
  action?: {
    label: string
    onClick: () => void
  }
}) {
  const { dismiss } = useToast()

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-600" />,
    error: <XCircle className="h-5 w-5 text-red-600" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-600" />,
    info: <Info className="h-5 w-5 text-blue-600" />,
    default: null
  }

  const styles = {
    success: 'border-green-200 bg-green-50',
    error: 'border-red-200 bg-red-50',
    warning: 'border-yellow-200 bg-yellow-50',
    info: 'border-blue-200 bg-blue-50',
    default: 'border-gray-200 bg-white'
  }

  return (
    <div
      className={cn(
        'group pointer-events-auto relative flex w-full items-center space-x-3 overflow-hidden rounded-lg border p-4 pr-6 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full mt-2',
        styles[type]
      )}
    >
      {icons[type] && <div className="flex-shrink-0">{icons[type]}</div>}
      <div className="grid gap-1 flex-1">
        {title && <div className="text-sm font-semibold text-gray-900">{title}</div>}
        {description && (
          <div className="text-sm text-gray-600">{description}</div>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className="mt-2 text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>
      <button
        onClick={() => dismiss(id)}
        className="absolute right-2 top-2 rounded-md p-1 text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>
    </div>
  )
}