import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NotificationsContent } from '@/components/notifications/notifications-content'
import { getNotifications } from '@/lib/actions/notifications'

export default async function NotificationsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const result = await getNotifications()

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

  return <NotificationsContent initialNotifications={result.notifications} />
}
