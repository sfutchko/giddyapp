import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OffersContent } from '@/components/offers/offers-content'

export default async function OffersPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch offers where user is either buyer or seller
  const { data: offers } = await supabase
    .from('offers')
    .select(`
      *,
      horse:horses(
        id,
        name,
        slug,
        price,
        horse_images(url, is_primary)
      ),
      offer_events(
        id,
        event_type,
        event_data,
        created_at,
        created_by
      )
    `)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  // Fetch transactions for accepted offers to show transaction status
  const acceptedOfferIds = offers?.filter(o => o.status === 'accepted').map(o => o.id) || []
  let transactionsMap = new Map()

  if (acceptedOfferIds.length > 0) {
    const { data: transactions } = await supabase
      .from('transactions')
      .select('offer_id, id, status')
      .in('offer_id', acceptedOfferIds)

    transactions?.forEach(t => {
      if (t.offer_id) {
        transactionsMap.set(t.offer_id, t)
      }
    })
  }

  // Attach transaction data to offers
  const offersWithTransactions = offers?.map(o => ({
    ...o,
    transaction: transactionsMap.get(o.id) || null
  })) || []

  // Separate sent and received offers
  const sentOffers = offersWithTransactions.filter(o => o.buyer_id === user.id)
  const receivedOffers = offersWithTransactions.filter(o => o.seller_id === user.id)

  return <OffersContent user={user} sentOffers={sentOffers} receivedOffers={receivedOffers} />
}