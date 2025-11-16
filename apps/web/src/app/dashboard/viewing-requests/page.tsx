import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMyViewingRequests, getReceivedViewingRequests } from '@/lib/actions/viewing-requests'
import { ViewingRequestsList } from '@/components/viewing-requests/viewing-requests-list'
import { Calendar } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ViewingRequestsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch both sent and received requests
  const [sentResult, receivedResult] = await Promise.all([
    getMyViewingRequests(),
    getReceivedViewingRequests()
  ])

  if ('error' in sentResult || 'error' in receivedResult) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Error</h1>
          <p className="text-red-600 mt-4">
            {('error' in sentResult ? sentResult.error : receivedResult.error) as string}
          </p>
        </div>
      </div>
    )
  }

  const sentRequests = sentResult.requests || []
  const receivedRequests = receivedResult.requests || []

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">Viewing Requests</h1>
          </div>
          <p className="text-gray-600">
            Manage viewing requests for horses you're interested in and requests from potential buyers
          </p>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              My Requests ({sentRequests.length})
            </h2>
            <ViewingRequestsList requests={sentRequests} type="sent" currentUserId={user.id} />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Received Requests ({receivedRequests.length})
            </h2>
            <ViewingRequestsList requests={receivedRequests} type="received" currentUserId={user.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
