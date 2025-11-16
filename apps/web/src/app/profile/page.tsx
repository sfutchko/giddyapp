import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileView } from '@/components/profile/profile-view'

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch user's horses
  const { data: horses } = await supabase
    .from('horses')
    .select(`
      *,
      horse_images (
        url,
        is_primary
      )
    `)
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch user's favorites
  const { data: favoritesData } = await supabase
    .from('favorites')
    .select(`
      horse_id,
      horses (
        id,
        name,
        breed,
        price,
        location,
        horse_images (
          url,
          is_primary
        )
      )
    `)
    .eq('user_id', user.id)

  // Transform the data to match the expected format
  const watchedHorses = favoritesData
    ?.filter(item => item.horses)
    .map(item => {
      const horse = item.horses as any
      return {
        horse: {
          id: horse.id,
          name: horse.name,
          breed: horse.breed,
          price: horse.price,
          city: horse.location?.city,
          state: horse.location?.state,
          horse_images: horse.horse_images
        }
      }
    }) || []

  // Fetch verification status
  const { data: verification } = await supabase
    .from('seller_verifications')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProfileView
          user={user}
          profile={profile}
          horses={horses || []}
          watchedHorses={watchedHorses}
          verification={verification}
        />
      </div>
    </div>
  )
}