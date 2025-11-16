'use client'

import React from 'react'
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react'
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter
} from './modal'
import { cn } from '@/lib/utils'

type DialogType = 'info' | 'warning' | 'error' | 'success' | 'confirm'

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  type?: DialogType
  title: string
  description?: string
  children?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm?: () => void | Promise<void>
  confirmButtonVariant?: 'primary' | 'danger' | 'secondary'
  showCancelButton?: boolean
  closeOnConfirm?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function Dialog({
  isOpen,
  onClose,
  type = 'info',
  title,
  description,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  confirmButtonVariant,
  showCancelButton = true,
  closeOnConfirm = true,
  size = 'md'
}: DialogProps) {
  const [isLoading, setIsLoading] = React.useState(false)

  const icons = {
    info: <Info className="h-6 w-6 text-blue-600" />,
    warning: <AlertTriangle className="h-6 w-6 text-yellow-600" />,
    error: <XCircle className="h-6 w-6 text-red-600" />,
    success: <CheckCircle className="h-6 w-6 text-green-600" />,
    confirm: <AlertTriangle className="h-6 w-6 text-yellow-600" />
  }

  const buttonVariants = {
    primary: 'bg-green-600 hover:bg-green-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white'
  }

  const defaultButtonVariant: Record<DialogType, 'primary' | 'danger' | 'secondary'> = {
    info: 'primary',
    warning: 'primary',
    error: 'danger',
    success: 'primary',
    confirm: 'danger'
  }

  const finalButtonVariant = confirmButtonVariant || defaultButtonVariant[type]

  const handleConfirm = async () => {
    if (onConfirm) {
      setIsLoading(true)
      try {
        await onConfirm()
        if (closeOnConfirm) {
          onClose()
        }
      } finally {
        setIsLoading(false)
      }
    } else {
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      closeOnBackdrop={!isLoading}
      closeOnEscape={!isLoading}
      showCloseButton={!isLoading}
    >
      <ModalHeader>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
          <div className="flex-1">
            <ModalTitle>{title}</ModalTitle>
            {description && <ModalDescription>{description}</ModalDescription>}
          </div>
        </div>
      </ModalHeader>

      {children && <ModalBody>{children}</ModalBody>}

      <ModalFooter>
        {showCancelButton && (
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>
        )}
        <button
          onClick={handleConfirm}
          disabled={isLoading}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
            buttonVariants[finalButtonVariant]
          )}
        >
          {isLoading ? 'Loading...' : confirmLabel}
        </button>
      </ModalFooter>
    </Modal>
  )
}

// Convenience components for common dialog types
interface AlertDialogProps extends Omit<DialogProps, 'type'> {}

export function AlertDialog(props: AlertDialogProps) {
  return <Dialog {...props} type="error" showCancelButton={false} confirmLabel="OK" />
}

export function ConfirmDialog(props: AlertDialogProps) {
  return <Dialog {...props} type="confirm" />
}

export function InfoDialog(props: AlertDialogProps) {
  return <Dialog {...props} type="info" showCancelButton={false} confirmLabel="OK" />
}

export function SuccessDialog(props: AlertDialogProps) {
  return <Dialog {...props} type="success" showCancelButton={false} confirmLabel="OK" />
}

// Hook for managing dialog state
export function useDialog<T = any>(defaultOpen = false) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)
  const [data, setData] = React.useState<T | null>(null)

  const open = React.useCallback((dialogData?: T) => {
    setData(dialogData || null)
    setIsOpen(true)
  }, [])

  const close = React.useCallback(() => {
    setIsOpen(false)
    // Clear data after animation completes
    setTimeout(() => setData(null), 300)
  }, [])

  const toggle = React.useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  return {
    isOpen,
    data,
    open,
    close,
    toggle,
    setIsOpen
  }
}