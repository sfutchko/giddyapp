import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EditHorseForm } from '@/components/horses/edit-horse-form'

export default async function EditHorsePage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch the horse details
  const { data: horse, error } = await supabase
    .from('horses')
    .select(`
      *,
      horse_images (
        id,
        url,
        is_primary,
        display_order
      ),
      horse_videos (
        id,
        url,
        title,
        file_size,
        display_order
      ),
      horse_documents (
        id,
        url,
        name,
        type,
        file_size
      )
    `)
    .eq('slug', slug)
    .eq('seller_id', user.id) // Ensure user owns this horse
    .single()

  if (error || !horse) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Listing</h1>
          <p className="mt-2 text-gray-600">
            Update the details for {horse.name}
          </p>
        </div>

        <EditHorseForm horse={horse} user={user} />
      </div>
    </div>
  )
}