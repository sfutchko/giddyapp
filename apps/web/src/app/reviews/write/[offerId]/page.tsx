import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canReviewOffer } from '@/lib/actions/reviews'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ReviewForm } from '@/components/reviews/review-form'

export default async function WriteReviewForOfferPage({
  params
}: {
  params: { offerId: string }
}) {
  const supabase = await createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user can review this offer
  const canReview = await canReviewOffer(params.offerId)

  if ('error' in canReview || !canReview.canReview) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/reviews/write"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Reviews
          </Link>

          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Cannot Write Review</h1>
            <p className="text-gray-600">
              {canReview.error || 'You are not eligible to review this transaction.'}
            </p>
            <Link
              href="/reviews/write"
              className="inline-block mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              View Reviewable Transactions
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Get offer details
  const { data: offer, error: offerError } = await supabase
    .from('offers')
    .select(`
      *,
      buyer:profiles!offers_buyer_id_fkey(user_id, name, full_name, avatar_url),
      seller:profiles!offers_seller_id_fkey(user_id, name, full_name, avatar_url),
      horse:horses(id, name, slug, horse_images(url, is_primary))
    `)
    .eq('id', params.offerId)
    .single()

  if (offerError || !offer) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Offer Not Found</h1>
          <p className="text-red-600 mt-4">The transaction you're trying to review doesn't exist.</p>
        </div>
      </div>
    )
  }

  const isBuyer = offer.buyer_id === user.id
  const reviewee = isBuyer ? offer.seller : offer.buyer
  const revieweeName = reviewee?.full_name || reviewee?.name || 'Unknown User'
  const revieweeAvatar = reviewee?.avatar_url
  const reviewType = isBuyer ? 'buyer_to_seller' : 'seller_to_buyer'

  const horseImage = offer.horse?.horse_images?.find((img) => img.is_primary)?.url ||
                     offer.horse?.horse_images?.[0]?.url

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/reviews/write"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Reviewable Transactions
        </Link>

        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Write a Review</h1>
          <p className="text-gray-600 mb-8">
            Share your experience with this transaction to help others in the community.
          </p>

          <ReviewForm
            offerId={params.offerId}
            horseName={offer.horse?.name || 'Unknown Horse'}
            horseImage={horseImage}
            revieweeName={revieweeName}
            revieweeAvatar={revieweeAvatar}
            reviewType={reviewType as 'buyer_to_seller' | 'seller_to_buyer'}
            onSuccess={() => {
              redirect('/profile/reviews')
            }}
            onCancel={() => {
              redirect('/reviews/write')
            }}
          />
        </div>
      </div>
    </div>
  )
}
