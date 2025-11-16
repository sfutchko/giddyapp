'use client'

import { useState } from 'react'
import { Ban, ShieldOff } from 'lucide-react'
import { blockUser, unblockUser } from '@/lib/actions/blocking'
import { toast } from 'sonner'

interface BlockUserButtonProps {
  userId: string
  userName?: string
  isBlocked?: boolean
  onBlockChange?: (blocked: boolean) => void
  variant?: 'button' | 'menu-item'
  className?: string
}

export function BlockUserButton({
  userId,
  userName,
  isBlocked: initialIsBlocked = false,
  onBlockChange,
  variant = 'button',
  className = ''
}: BlockUserButtonProps) {
  const [isBlocked, setIsBlocked] = useState(initialIsBlocked)
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleBlock = async () => {
    setIsLoading(true)

    const result = await blockUser(userId)

    if ('error' in result) {
      toast.error(result.error)
    } else {
      setIsBlocked(true)
      toast.success(`${userName || 'User'} has been blocked`)
      onBlockChange?.(true)
    }

    setIsLoading(false)
    setShowConfirm(false)
  }

  const handleUnblock = async () => {
    setIsLoading(true)

    const result = await unblockUser(userId)

    if ('error' in result) {
      toast.error(result.error)
    } else {
      setIsBlocked(false)
      toast.success(`${userName || 'User'} has been unblocked`)
      onBlockChange?.(false)
    }

    setIsLoading(false)
  }

  const handleClick = () => {
    if (isBlocked) {
      handleUnblock()
    } else {
      setShowConfirm(true)
    }
  }

  if (variant === 'menu-item') {
    return (
      <>
        <button
          onClick={handleClick}
          disabled={isLoading}
          className={`w-full flex items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors disabled:opacity-50 ${
            isBlocked ? 'text-green-600' : 'text-red-600'
          } ${className}`}
        >
          {isBlocked ? (
            <>
              <ShieldOff className="h-4 w-4" />
              Unblock User
            </>
          ) : (
            <>
              <Ban className="h-4 w-4" />
              Block User
            </>
          )}
        </button>

        {showConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <Ban className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Block User?</h3>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to block {userName || 'this user'}? You will no longer be
                able to:
              </p>

              <ul className="list-disc list-inside text-sm text-gray-600 mb-6 space-y-1">
                <li>Send or receive messages</li>
                <li>See their listings</li>
                <li>Interact with their content</li>
              </ul>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBlock}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Blocking...' : 'Block User'}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
          isBlocked
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-red-100 text-red-700 hover:bg-red-200'
        } ${className}`}
      >
        {isBlocked ? (
          <>
            <ShieldOff className="h-4 w-4" />
            Unblock
          </>
        ) : (
          <>
            <Ban className="h-4 w-4" />
            Block
          </>
        )}
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Ban className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Block User?</h3>
            </div>

            <p className="text-gray-600 mb-6">
              Are you sure you want to block {userName || 'this user'}? You will no longer be able
              to:
            </p>

            <ul className="list-disc list-inside text-sm text-gray-600 mb-6 space-y-1">
              <li>Send or receive messages</li>
              <li>See their listings</li>
              <li>Interact with their content</li>
            </ul>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBlock}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Blocking...' : 'Block User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
