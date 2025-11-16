import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardContent } from '@/components/dashboard/dashboard-content'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user's horses
  const { data: myHorses } = await supabase
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

  // Fetch stats
  const activeListings = myHorses?.filter(h => h.status === 'ACTIVE').length || 0
  const totalViews = myHorses?.reduce((sum, h) => sum + (h.view_count || 0), 0) || 0

  // Fetch favorites count
  const { count: favoritesCount } = await supabase
    .from('favorites')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Fetch unread message count (only messages received by user)
  const { count: messageCount } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', user.id)
    .eq('is_read', false)

  // Fetch ONLY received offers that need action (seller needs to respond)
  const { count: pendingOffersCount } = await supabase
    .from('offers')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', user.id)
    .in('status', ['pending', 'countered'])

  // Fetch accepted offers awaiting payment (buyer side)
  const { data: acceptedOffers } = await supabase
    .from('offers')
    .select(`
      id,
      offer_amount,
      horse_id,
      horses (
        id,
        name,
        slug,
        horse_images (
          url,
          is_primary
        )
      )
    `)
    .eq('buyer_id', user.id)
    .eq('status', 'accepted')
    .order('responded_at', { ascending: false })

  // Filter out offers that already have transactions
  let acceptedOffersAwaitingPayment: any[] = []
  if (acceptedOffers && acceptedOffers.length > 0) {
    const offerIds = acceptedOffers.map(o => o.id)
    const { data: existingTransactions } = await supabase
      .from('transactions')
      .select('offer_id')
      .in('offer_id', offerIds)

    const transactionOfferIds = new Set(existingTransactions?.map(t => t.offer_id) || [])
    acceptedOffersAwaitingPayment = acceptedOffers.filter(offer => !transactionOfferIds.has(offer.id))
  }

  // Fetch viewing requests counts
  const { count: pendingViewingRequestsCount } = await supabase
    .from('viewing_requests')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', user.id)
    .eq('status', 'pending')

  // Fetch total revenue from sold horses
  const { data: soldHorses } = await supabase
    .from('horses')
    .select('sold_price')
    .eq('seller_id', user.id)
    .eq('status', 'SOLD')

  const totalRevenue = soldHorses?.reduce((sum, horse) => sum + (horse.sold_price || 0), 0) || 0

  // Fetch transaction stats
  const { count: totalTransactionsCount } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)

  const { count: activeTransactionsCount } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .eq('status', 'payment_held')

  // Fetch pending refund requests count for user's transactions
  const { data: userTransactions } = await supabase
    .from('transactions')
    .select('id')
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)

  const userTransactionIds = userTransactions?.map(t => t.id) || []
  let pendingRefundRequestsCount = 0

  if (userTransactionIds.length > 0) {
    const { count } = await supabase
      .from('refund_requests')
      .select('*', { count: 'exact', head: true })
      .in('transaction_id', userTransactionIds)
      .eq('status', 'pending')

    pendingRefundRequestsCount = count || 0
  }

  // Fetch watched horses (recent 5)
  const { data: watchedHorsesData } = await supabase
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
        horse_images (
          url,
          is_primary
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const watchedHorses = watchedHorsesData
    ?.filter(item => item.horses)
    .map(item => ({
      ...(item.horses as any),
      watched_at: item.created_at
    })) || []

  const stats = {
    activeListings,
    totalViews,
    watching: favoritesCount || 0,
    unreadMessages: messageCount || 0,
    pendingOffers: pendingOffersCount || 0,
    pendingViewingRequests: pendingViewingRequestsCount || 0,
    totalRevenue,
    totalTransactions: totalTransactionsCount || 0,
    activeTransactions: activeTransactionsCount || 0,
    pendingRefundRequests: pendingRefundRequestsCount
  }

  return <DashboardContent user={user} horses={myHorses || []} stats={stats} watchedHorses={watchedHorses} pendingPayments={acceptedOffersAwaitingPayment || []} />
}