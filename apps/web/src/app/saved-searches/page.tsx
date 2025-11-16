import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SavedSearchesList } from '@/components/search/saved-searches-list'
import { getSavedSearches } from '@/lib/actions/saved-searches'

export default async function SavedSearchesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const result = await getSavedSearches()

  if ('error' in result) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-red-600">Error loading saved searches</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Saved Searches</h1>
          <p className="mt-2 text-gray-600">
            Manage your saved searches and get notified when new horses match your criteria
          </p>
        </div>

        <SavedSearchesList searches={result.searches} />
      </div>
    </div>
  )
}
