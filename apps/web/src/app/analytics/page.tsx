import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AnalyticsContent } from '@/components/analytics/analytics-content'

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch sold horses
  const { data: soldHorses } = await supabase
    .from('horses')
    .select(`
      *,
      horse_images (
        url,
        is_primary
      )
    `)
    .eq('seller_id', user.id)
    .eq('status', 'SOLD')
    .order('sold_date', { ascending: false })

  // Calculate statistics
  const totalRevenue = soldHorses?.reduce((sum, horse) => sum + (horse.sold_price || 0), 0) || 0
  const averagePrice = soldHorses && soldHorses.length > 0
    ? totalRevenue / soldHorses.length
    : 0
  const totalSold = soldHorses?.length || 0

  // Get sales by month for the chart
  const salesByMonth = soldHorses?.reduce((acc, horse) => {
    if (horse.sold_date) {
      const month = new Date(horse.sold_date).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric'
      })
      if (!acc[month]) {
        acc[month] = { month, count: 0, revenue: 0 }
      }
      acc[month].count++
      acc[month].revenue += horse.sold_price || 0
    }
    return acc
  }, {} as Record<string, { month: string; count: number; revenue: number }>) || {}

  const monthlyData: { month: string; count: number; revenue: number }[] = Object.values(salesByMonth).slice(-12) // Last 12 months

  // Get active listings count for comparison
  const { count: activeListings } = await supabase
    .from('horses')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', user.id)
    .eq('status', 'ACTIVE')

  const stats = {
    totalRevenue,
    totalSold,
    averagePrice,
    activeListings: activeListings || 0,
    monthlyData
  }

  return <AnalyticsContent user={user} soldHorses={soldHorses || []} stats={stats} />
}