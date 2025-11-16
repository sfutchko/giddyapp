'use client'

import { useState } from 'react'
import { ShieldOff, User as UserIcon } from 'lucide-react'
import { unblockUser, type BlockedUser } from '@/lib/actions/blocking'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface BlockedUsersListProps {
  blockedUsers: BlockedUser[]
}

export function BlockedUsersList({ blockedUsers: initialBlockedUsers }: BlockedUsersListProps) {
  const [blockedUsers, setBlockedUsers] = useState(initialBlockedUsers)
  const [unblocking, setUnblocking] = useState<string | null>(null)
  const router = useRouter()

  const handleUnblock = async (userId: string, userName?: string | null) => {
    setUnblocking(userId)

    const result = await unblockUser(userId)

    if ('error' in result) {
      toast.error(result.error)
    } else {
      setBlockedUsers(blockedUsers.filter(bu => bu.blocked_id !== userId))
      toast.success(`${userName || 'User'} has been unblocked`)
      router.refresh()
    }

    setUnblocking(null)
  }

  if (blockedUsers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <ShieldOff className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Blocked Users</h2>
        <p className="text-gray-600">
          You haven't blocked any users yet. You can block users from their profile or from
          messages.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {blockedUsers.map((blocked) => {
        const profile = blocked.blocked_profile
        const displayName = profile?.name || profile?.full_name || 'Unknown User'

        return (
          <div
            key={blocked.id}
            className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              {profile?.avatar_url ? (
                <div className="relative w-12 h-12 rounded-full overflow-hidden">
                  <Image
                    src={profile.avatar_url}
                    alt={displayName}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-gray-500" />
                </div>
              )}

              <div>
                <h3 className="font-semibold text-gray-900">{displayName}</h3>
                {blocked.reason && (
                  <p className="text-sm text-gray-600 mt-1">Reason: {blocked.reason}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Blocked on {new Date(blocked.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleUnblock(blocked.blocked_id, displayName)}
              disabled={unblocking === blocked.blocked_id}
              className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShieldOff className="h-4 w-4" />
              {unblocking === blocked.blocked_id ? 'Unblocking...' : 'Unblock'}
            </button>
          </div>
        )
      })}

      {blockedUsers.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Unblocking a user will allow them to send you messages and view
            your content again.
          </p>
        </div>
      )}
    </div>
  )
}
