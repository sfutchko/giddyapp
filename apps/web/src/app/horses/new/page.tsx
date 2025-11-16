import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ListingWizard } from '@/components/listings/listing-wizard'

export default async function NewHorsePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">List Your Horse</h1>
          <p className="text-gray-600 mt-2">
            Create a detailed listing to connect with serious buyers
          </p>
        </div>

        <ListingWizard userId={user.id} />
      </div>
    </div>
  )
}