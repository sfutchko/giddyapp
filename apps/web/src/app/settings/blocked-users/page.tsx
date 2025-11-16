import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBlockedUsers } from '@/lib/actions/blocking'
import { BlockedUsersList } from '@/components/users/blocked-users-list'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function BlockedUsersPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const result = await getBlockedUsers()

  if ('error' in result) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Error</h1>
          <p className="text-red-600 mt-4">{result.error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Blocked Users</h1>
          <p className="mt-2 text-gray-600">
            Manage the users you have blocked. You won't be able to send or receive messages from
            blocked users.
          </p>
        </div>

        <BlockedUsersList blockedUsers={result.blockedUsers || []} />
      </div>
    </div>
  )
}
