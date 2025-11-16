import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DocumentAccessRequestsContent } from '@/components/documents/document-access-requests-content'

export default async function DocumentAccessRequestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/documents/access-requests')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Document Access Requests</h1>
          <p className="text-gray-600 mt-1">
            Manage requests to view your horse documents and your own access requests
          </p>
        </div>

        <DocumentAccessRequestsContent />
      </div>
    </div>
  )
}
