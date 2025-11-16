import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WatchlistContent } from '@/components/watchlist/watchlist-content'

export default async function WatchlistPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user's watched horses
  const { data: watchedHorses } = await supabase
    .from('favorites')
    .select(`
      created_at,
      horses (
        id,
        slug,
        name,
        breed,
        price,
        status,
        location,
        age,
        gender,
        height,
        created_at,
        horse_images (
          url,
          is_primary
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Extract just the horse data
  const horses = watchedHorses
    ?.filter(item => item.horses)
    .map(item => ({
      ...(item.horses as any),
      watched_at: item.created_at
    })) || []

  // Get watch counts for all horses
  const horseIds = horses.map((h: any) => h.id).filter(Boolean)

  let watchCountMap: Record<string, number> = {}

  if (horseIds.length > 0) {
    const { data: watchCounts } = await supabase
      .from('favorites')
      .select('horse_id')
      .in('horse_id', horseIds)

    watchCountMap = watchCounts?.reduce((acc, curr) => {
      acc[curr.horse_id] = (acc[curr.horse_id] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}
  }

  return <WatchlistContent user={user} horses={horses} watchCounts={watchCountMap} />
}
