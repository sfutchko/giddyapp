import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DocumentList } from '@/components/documents/document-list'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function HorseDocumentsPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get horse details
  const { data: horse, error } = await supabase
    .from('horses')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (error || !horse) {
    redirect('/horses')
  }

  const isOwner = user?.id === horse.seller_id

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Back to listing */}
        <Link
          href={`/horses/${params.slug}`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to {horse.name}
        </Link>

        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{horse.name} - Documents</h1>
              <p className="text-gray-600 mt-1">
                Health records, registration papers, and competition history
              </p>
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <DocumentList horseId={horse.id} isOwner={isOwner} />
        </div>

        {/* Info Section for Buyers */}
        {!isOwner && (
          <div className="mt-6 bg-blue-50 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              Request Access to Private Documents
            </h3>
            <p className="text-sm text-blue-800">
              Some documents may be private. You can request access from the seller by clicking on
              individual documents. The seller will review your request and may grant temporary
              access.
            </p>
          </div>
        )}

        {/* Info Section for Owners */}
        {isOwner && (
          <div className="mt-6 bg-amber-50 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-amber-900 mb-2">Document Privacy</h3>
            <p className="text-sm text-amber-800">
              You can control who sees each document. Make documents public to show all buyers, or
              keep them private and approve access requests individually. Public documents help
              build trust and can lead to faster sales.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
