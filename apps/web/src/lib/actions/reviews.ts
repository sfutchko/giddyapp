'use server'

import { createClient } from '@/lib/supabase/server'

// ============================================================================
// TYPES
// ============================================================================

export type ReviewType = 'buyer_to_seller' | 'seller_to_buyer'

export type ReviewStatus = 'pending' | 'published' | 'hidden' | 'flagged' | 'removed'

export type ReportReason = 'spam' | 'offensive' | 'fake' | 'irrelevant' | 'personal_info' | 'other'

export interface Review {
  id: string
  reviewer_id: string
  reviewee_id: string
  offer_id: string
  horse_id: string
  review_type: ReviewType
  rating: number
  communication_rating?: number | null
  accuracy_rating?: number | null
  professionalism_rating?: number | null
  title?: string | null
  review_text: string
  photo_urls?: string[] | null
  status: ReviewStatus
  moderation_note?: string | null
  moderated_at?: string | null
  moderated_by?: string | null
  helpful_count: number
  not_helpful_count: number
  seller_reply?: string | null
  seller_replied_at?: string | null
  verified_purchase: boolean
  created_at: string
  updated_at: string
  // Joined data
  reviewer?: {
    user_id: string
    name?: string | null
    full_name?: string | null
    avatar_url?: string | null
  }
  reviewee?: {
    user_id: string
    name?: string | null
    full_name?: string | null
    avatar_url?: string | null
  }
  horse?: {
    id: string
    name: string
    slug: string
    horse_images?: Array<{ url: string; is_primary: boolean }>
  }
  user_vote?: {
    is_helpful: boolean
  }
}

export interface UserReputation {
  user_id: string
  total_reviews: number
  average_rating: number
  rating_5_count: number
  rating_4_count: number
  rating_3_count: number
  rating_2_count: number
  rating_1_count: number
  average_communication: number
  average_accuracy: number
  average_professionalism: number
  as_seller_reviews: number
  as_seller_rating: number
  as_buyer_reviews: number
  as_buyer_rating: number
  reputation_score: number
  is_top_rated: boolean
  is_verified_seller: boolean
  last_calculated_at: string
}

export interface CreateReviewData {
  offerId: string
  rating: number
  communicationRating?: number
  accuracyRating?: number
  professionalismRating?: number
  title?: string
  reviewText: string
  photoUrls?: string[]
}

// ============================================================================
// REVIEW FUNCTIONS
// ============================================================================

/**
 * Check if a user can review an offer
 */
export async function canReviewOffer(offerId: string) {
  const supabase = await createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return { canReview: false, error: 'Not authenticated' }
  }

  try {
    const { data, error } = await supabase.rpc('can_review_offer', {
      p_offer_id: offerId,
      p_user_id: user.id
    })

    if (error) {
      console.error('Error checking review eligibility:', error)
      return { canReview: false, error: error.message }
    }

    return { canReview: data as boolean }
  } catch (error) {
    console.error('Error checking review eligibility:', error)
    return { canReview: false, error: 'Failed to check review eligibility' }
  }
}

/**
 * Create a new review
 */
export async function createReview(data: CreateReviewData) {
  const supabase = await createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  try {
    // Get offer details to determine reviewee and review type
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select('buyer_id, seller_id, horse_id, status')
      .eq('id', data.offerId)
      .single()

    if (offerError || !offer) {
      return { error: 'Offer not found' }
    }

    if (offer.status !== 'accepted') {
      return { error: 'Can only review completed transactions' }
    }

    // Determine reviewee and review type
    let revieweeId: string
    let reviewType: ReviewType

    if (user.id === offer.buyer_id) {
      revieweeId = offer.seller_id
      reviewType = 'buyer_to_seller'
    } else if (user.id === offer.seller_id) {
      revieweeId = offer.buyer_id
      reviewType = 'seller_to_buyer'
    } else {
      return { error: 'Not authorized to review this transaction' }
    }

    // Check if review already exists
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('reviewer_id', user.id)
      .eq('offer_id', data.offerId)
      .single()

    if (existingReview) {
      return { error: 'You have already reviewed this transaction' }
    }

    // Create review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        offer_id: data.offerId,
        horse_id: offer.horse_id,
        review_type: reviewType,
        rating: data.rating,
        communication_rating: data.communicationRating,
        accuracy_rating: data.accuracyRating,
        professionalism_rating: data.professionalismRating,
        title: data.title,
        review_text: data.reviewText,
        photo_urls: data.photoUrls,
        status: 'published'
      })
      .select()
      .single()

    if (reviewError) {
      console.error('Error creating review:', reviewError)
      return { error: reviewError.message }
    }

    return { success: true, review }
  } catch (error) {
    console.error('Error creating review:', error)
    return { error: 'Failed to create review' }
  }
}

/**
 * Get reviews for a specific user
 */
export async function getUserReviews(userId: string, filters?: {
  reviewType?: ReviewType
  minRating?: number
  limit?: number
  offset?: number
}) {
  const supabase = await createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  try {
    let query = supabase
      .from('reviews')
      .select(`
        *,
        reviewer:profiles!reviews_reviewer_id_fkey(user_id, name, full_name, avatar_url),
        horse:horses(id, name, slug, horse_images(url, is_primary))
      `)
      .eq('reviewee_id', userId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    if (filters?.reviewType) {
      query = query.eq('review_type', filters.reviewType)
    }

    if (filters?.minRating) {
      query = query.gte('rating', filters.minRating)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data: reviews, error } = await query

    if (error) {
      console.error('Error fetching reviews:', error)
      return { error: error.message }
    }

    // If user is logged in, get their votes
    if (user) {
      const reviewIds = reviews.map((r) => r.id)
      const { data: votes } = await supabase
        .from('review_helpful_votes')
        .select('review_id, is_helpful')
        .eq('user_id', user.id)
        .in('review_id', reviewIds)

      const votesMap = new Map(votes?.map((v) => [v.review_id, v.is_helpful]))

      return {
        reviews: reviews.map((r) => ({
          ...r,
          user_vote: votesMap.has(r.id) ? { is_helpful: votesMap.get(r.id)! } : undefined
        })) as Review[]
      }
    }

    return { reviews: reviews as Review[] }
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return { error: 'Failed to fetch reviews' }
  }
}

/**
 * Get a single review by ID
 */
export async function getReview(reviewId: string) {
  const supabase = await createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  try {
    const { data: review, error } = await supabase
      .from('reviews')
      .select(`
        *,
        reviewer:profiles!reviews_reviewer_id_fkey(user_id, name, full_name, avatar_url),
        reviewee:profiles!reviews_reviewee_id_fkey(user_id, name, full_name, avatar_url),
        horse:horses(id, name, slug, horse_images(url, is_primary))
      `)
      .eq('id', reviewId)
      .single()

    if (error) {
      console.error('Error fetching review:', error)
      return { error: error.message }
    }

    // Get user's vote if logged in
    if (user) {
      const { data: vote } = await supabase
        .from('review_helpful_votes')
        .select('is_helpful')
        .eq('review_id', reviewId)
        .eq('user_id', user.id)
        .single()

      return {
        review: {
          ...review,
          user_vote: vote ? { is_helpful: vote.is_helpful } : undefined
        } as Review
      }
    }

    return { review: review as Review }
  } catch (error) {
    console.error('Error fetching review:', error)
    return { error: 'Failed to fetch review' }
  }
}

/**
 * Get user reputation
 */
export async function getUserReputation(userId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('user_reputation')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      // If no reputation exists yet, return default
      if (error.code === 'PGRST116') {
        return {
          reputation: {
            user_id: userId,
            total_reviews: 0,
            average_rating: 0,
            rating_5_count: 0,
            rating_4_count: 0,
            rating_3_count: 0,
            rating_2_count: 0,
            rating_1_count: 0,
            average_communication: 0,
            average_accuracy: 0,
            average_professionalism: 0,
            as_seller_reviews: 0,
            as_seller_rating: 0,
            as_buyer_reviews: 0,
            as_buyer_rating: 0,
            reputation_score: 0,
            is_top_rated: false,
            is_verified_seller: false
          } as UserReputation
        }
      }
      console.error('Error fetching reputation:', error)
      return { error: error.message }
    }

    return { reputation: data as UserReputation }
  } catch (error) {
    console.error('Error fetching reputation:', error)
    return { error: 'Failed to fetch reputation' }
  }
}

/**
 * Update a review (edit review text/rating)
 */
export async function updateReview(reviewId: string, updates: {
  rating?: number
  communicationRating?: number
  accuracyRating?: number
  professionalismRating?: number
  title?: string
  reviewText?: string
  photoUrls?: string[]
}) {
  const supabase = await createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  try {
    const { data, error } = await supabase
      .from('reviews')
      .update({
        rating: updates.rating,
        communication_rating: updates.communicationRating,
        accuracy_rating: updates.accuracyRating,
        professionalism_rating: updates.professionalismRating,
        title: updates.title,
        review_text: updates.reviewText,
        photo_urls: updates.photoUrls
      })
      .eq('id', reviewId)
      .eq('reviewer_id', user.id) // RLS will enforce this
      .select()
      .single()

    if (error) {
      console.error('Error updating review:', error)
      return { error: error.message }
    }

    return { success: true, review: data }
  } catch (error) {
    console.error('Error updating review:', error)
    return { error: 'Failed to update review' }
  }
}

/**
 * Add seller reply to a review
 */
export async function addSellerReply(reviewId: string, reply: string) {
  const supabase = await createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  try {
    const { data, error } = await supabase
      .from('reviews')
      .update({
        seller_reply: reply,
        seller_replied_at: new Date().toISOString()
      })
      .eq('id', reviewId)
      .eq('reviewee_id', user.id) // RLS will enforce this
      .select()
      .single()

    if (error) {
      console.error('Error adding seller reply:', error)
      return { error: error.message }
    }

    return { success: true, review: data }
  } catch (error) {
    console.error('Error adding seller reply:', error)
    return { error: 'Failed to add reply' }
  }
}

/**
 * Vote on a review's helpfulness
 */
export async function voteReviewHelpful(reviewId: string, isHelpful: boolean) {
  const supabase = await createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  try {
    // Check if vote exists
    const { data: existingVote } = await supabase
      .from('review_helpful_votes')
      .select('id, is_helpful')
      .eq('review_id', reviewId)
      .eq('user_id', user.id)
      .single()

    if (existingVote) {
      // Update existing vote
      if (existingVote.is_helpful === isHelpful) {
        // Remove vote if clicking same button
        const { error } = await supabase
          .from('review_helpful_votes')
          .delete()
          .eq('id', existingVote.id)

        if (error) {
          console.error('Error removing vote:', error)
          return { error: error.message }
        }

        return { success: true, action: 'removed' }
      } else {
        // Change vote
        const { error } = await supabase
          .from('review_helpful_votes')
          .update({ is_helpful: isHelpful })
          .eq('id', existingVote.id)

        if (error) {
          console.error('Error updating vote:', error)
          return { error: error.message }
        }

        return { success: true, action: 'updated' }
      }
    } else {
      // Create new vote
      const { error } = await supabase
        .from('review_helpful_votes')
        .insert({
          review_id: reviewId,
          user_id: user.id,
          is_helpful: isHelpful
        })

      if (error) {
        console.error('Error creating vote:', error)
        return { error: error.message }
      }

      return { success: true, action: 'created' }
    }
  } catch (error) {
    console.error('Error voting on review:', error)
    return { error: 'Failed to vote on review' }
  }
}

/**
 * Report a review
 */
export async function reportReview(reviewId: string, reason: ReportReason, description?: string) {
  const supabase = await createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  try {
    const { data, error } = await supabase
      .from('review_reports')
      .insert({
        review_id: reviewId,
        reporter_id: user.id,
        reason,
        description,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        return { error: 'You have already reported this review' }
      }
      console.error('Error reporting review:', error)
      return { error: error.message }
    }

    return { success: true, report: data }
  } catch (error) {
    console.error('Error reporting review:', error)
    return { error: 'Failed to report review' }
  }
}

/**
 * Get reviews written by a user
 */
export async function getReviewsByUser(userId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        reviewee:profiles!reviews_reviewee_id_fkey(user_id, name, full_name, avatar_url),
        horse:horses(id, name, slug, horse_images(url, is_primary))
      `)
      .eq('reviewer_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching reviews by user:', error)
      return { error: error.message }
    }

    return { reviews: data as Review[] }
  } catch (error) {
    console.error('Error fetching reviews by user:', error)
    return { error: 'Failed to fetch reviews' }
  }
}

/**
 * Get offers that can be reviewed by current user
 */
export async function getReviewableOffers() {
  const supabase = await createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  try {
    // Get accepted offers where user hasn't left a review yet
    const { data: offers, error } = await supabase
      .from('offers')
      .select(`
        *,
        horse:horses(id, name, slug, price, horse_images(url, is_primary)),
        buyer:profiles!offers_buyer_id_fkey(user_id, name, full_name, avatar_url),
        seller:profiles!offers_seller_id_fkey(user_id, name, full_name, avatar_url)
      `)
      .eq('status', 'accepted')
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching reviewable offers:', error)
      return { error: error.message }
    }

    // Filter out offers that have been reviewed
    const offerIds = offers.map((o) => o.id)

    const { data: existingReviews } = await supabase
      .from('reviews')
      .select('offer_id')
      .eq('reviewer_id', user.id)
      .in('offer_id', offerIds)

    const reviewedOfferIds = new Set(existingReviews?.map((r) => r.offer_id))

    const reviewableOffers = offers.filter((o) => !reviewedOfferIds.has(o.id))

    return { offers: reviewableOffers }
  } catch (error) {
    console.error('Error fetching reviewable offers:', error)
    return { error: 'Failed to fetch reviewable offers' }
  }
}

/**
 * Delete a review (only for own reviews, within time limit)
 */
export async function deleteReview(reviewId: string) {
  const supabase = await createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  try {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)
      .eq('reviewer_id', user.id)

    if (error) {
      console.error('Error deleting review:', error)
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting review:', error)
    return { error: 'Failed to delete review' }
  }
}
