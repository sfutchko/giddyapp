'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { sendOfferReceivedEmail, sendOfferExpiredEmail } from '@/lib/email/send'

export async function createOffer(params: {
  horseId: string
  sellerId: string
  horseName: string
  amount: number
  message?: string
  includesTransport: boolean
  includesVetting: boolean
  contingencies?: string
  expiresInDays: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be logged in to make an offer')
  }

  const {
    horseId,
    sellerId,
    horseName,
    amount,
    message,
    includesTransport,
    includesVetting,
    contingencies,
    expiresInDays
  } = params

  // Calculate expiration date
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiresInDays)

  // Create the offer
  const { data: offer, error } = await supabase
    .from('offers')
    .insert({
      horse_id: horseId,
      buyer_id: user.id,
      seller_id: sellerId,
      offer_amount: amount,
      message: message || null,
      includes_transport: includesTransport,
      includes_vetting: includesVetting,
      contingencies: contingencies || null,
      expires_at: expiresAt.toISOString()
    })
    .select()
    .single()

  if (error) throw error

  // Create an offer event
  await supabase
    .from('offer_events')
    .insert({
      offer_id: offer.id,
      event_type: 'offer_created',
      event_data: {
        amount,
        includes_transport: includesTransport,
        includes_vetting: includesVetting
      },
      created_by: user.id
    })

  // Use service client to fetch emails (bypasses RLS)
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  // Get seller and buyer info for email
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, name, email')
    .in('id', [user.id, sellerId])

  const buyerProfile = profiles?.find(p => p.id === user.id)
  const sellerProfile = profiles?.find(p => p.id === sellerId)

  // Send email notification to seller
  if (sellerProfile?.email) {
    try {
      await sendOfferReceivedEmail({
        to: sellerProfile.email,
        sellerName: sellerProfile.name || 'there',
        buyerName: buyerProfile?.name || 'A buyer',
        horseName,
        offerAmount: amount,
        message: message || undefined,
        offerId: offer.id,
      })
    } catch (emailError) {
      console.error('Failed to send offer notification email:', emailError)
      // Don't fail the whole operation if email fails
    }
  }

  return offer
}

/**
 * Extend an expired offer by adding more days to the expiration
 */
export async function extendOffer(offerId: string, additionalDays: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be logged in to extend an offer')
  }

  // Get the offer to verify ownership
  const { data: offer, error: fetchError } = await supabase
    .from('offers')
    .select('*')
    .eq('id', offerId)
    .single()

  if (fetchError || !offer) {
    throw new Error('Offer not found')
  }

  // Only buyer can extend their own offers
  if (offer.buyer_id !== user.id) {
    throw new Error('Only the buyer can extend their offer')
  }

  // Can only extend expired or pending offers
  if (offer.status !== 'expired' && offer.status !== 'pending') {
    throw new Error('Can only extend expired or pending offers')
  }

  // Calculate new expiration date
  const newExpiresAt = new Date()
  newExpiresAt.setDate(newExpiresAt.getDate() + additionalDays)

  // Update the offer
  const { error: updateError } = await supabase
    .from('offers')
    .update({
      expires_at: newExpiresAt.toISOString(),
      status: 'pending', // Reset to pending if it was expired
      updated_at: new Date().toISOString()
    })
    .eq('id', offerId)

  if (updateError) throw updateError

  // Create an offer event
  await supabase
    .from('offer_events')
    .insert({
      offer_id: offerId,
      event_type: 'offer_extended',
      event_data: {
        additional_days: additionalDays,
        new_expires_at: newExpiresAt.toISOString()
      },
      created_by: user.id
    })

  return { success: true, newExpiresAt }
}

/**
 * Check for expired offers and mark them as expired
 * This should be called by a cron job or on page load
 */
export async function checkExpiredOffers() {
  const supabase = await createClient()

  // Find all pending offers that have expired
  const { data: expiredOffers, error } = await supabase
    .from('offers')
    .select('id, buyer_id, seller_id, horse_id, offer_amount, horses(name)')
    .eq('status', 'pending')
    .lt('expires_at', new Date().toISOString())

  if (error) {
    console.error('Error checking expired offers:', error)
    return { error: error.message }
  }

  if (!expiredOffers || expiredOffers.length === 0) {
    return { expiredCount: 0 }
  }

  // Update all expired offers
  const { error: updateError } = await supabase
    .from('offers')
    .update({
      status: 'expired',
      updated_at: new Date().toISOString()
    })
    .in('id', expiredOffers.map(o => o.id))

  if (updateError) {
    console.error('Error updating expired offers:', updateError)
    return { error: updateError.message }
  }

  // Create offer events for each expired offer
  const events = expiredOffers.map(offer => ({
    offer_id: offer.id,
    event_type: 'offer_expired',
    event_data: {
      expired_at: new Date().toISOString()
    },
    created_by: offer.buyer_id // System event, attributed to buyer
  }))

  await supabase.from('offer_events').insert(events)

  // Use service client to fetch emails (bypasses RLS)
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  // Get buyer info and send emails
  const buyerIds = [...new Set(expiredOffers.map(o => o.buyer_id))]
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, name, email')
    .in('id', buyerIds)

  // Send emails to buyers
  for (const offer of expiredOffers) {
    const buyerProfile = profiles?.find(p => p.id === offer.buyer_id)
    if (buyerProfile?.email && offer.horses?.name) {
      try {
        await sendOfferExpiredEmail({
          to: buyerProfile.email,
          buyerName: buyerProfile.name || 'there',
          horseName: offer.horses.name,
          offerAmount: offer.offer_amount,
          offerId: offer.id,
        })
      } catch (emailError) {
        console.error('Failed to send offer expired email:', emailError)
        // Don't fail the whole operation if email fails
      }
    }
  }

  return { expiredCount: expiredOffers.length, expiredOffers }
}
