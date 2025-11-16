import { notFound } from 'next/navigation'
import { getHorseBySlug, getSimilarHorses } from '@/lib/actions/horses'
import { HorseDetails } from '@/components/horses/horse-details'
import { ContactSeller } from '@/components/horses/contact-seller'
import { ImageGallery } from '@/components/horses/image-gallery'
import { WatchButton } from '@/components/horses/watch-button'
import { VideoGallery } from '@/components/horses/video-gallery'
import { DocumentViewer } from '@/components/horses/document-viewer'
import { SimilarHorses } from '@/components/horses/similar-horses'
import { ViewTracker } from '@/components/horses/view-tracker'
import { RecentlyViewedTracker } from '@/components/horses/recently-viewed-tracker'
import { RequestViewingButton } from '@/components/horses/request-viewing-button'
import { SellerReviewsSection } from '@/components/reviews/seller-reviews-section'
import { getUserReputation, getUserReviews } from '@/lib/actions/reviews'
import { createClient } from '@/lib/supabase/server'
import { BackToMapButton } from '@/components/horses/back-to-map-button'

export default async function HorseDetailsPage({
  params,
}: {
  params: { slug: string }
}) {
  const result = await getHorseBySlug(params.slug)

  if ('error' in result) {
    notFound()
  }

  const horse = result.horse
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const similarHorsesResult = await getSimilarHorses(horse.id, horse.breed, 4)
  const similarHorses = similarHorsesResult.horses || []
  const primaryImage = horse.horse_images?.find((img: any) => img.is_primary)?.url ||
                       horse.horse_images?.[0]?.url

  const isOwnHorse = user?.id === horse.seller_id

  // Get seller reviews
  let sellerReputation = null
  let sellerReviews: any[] = []

  if (horse.seller_id) {
    const reputationResult = await getUserReputation(horse.seller_id)
    sellerReputation = 'reputation' in reputationResult ? reputationResult.reputation : null

    const reviewsResult = await getUserReviews(horse.seller_id, { limit: 5 })
    sellerReviews = 'reviews' in reviewsResult ? reviewsResult.reviews : []
  }

  // Get user's existing offer, viewing request, and messages for this horse
  let existingOffer = null
  let existingViewingRequest = null
  let hasExistingConversation = false

  if (user) {
    // Check for existing offer
    const { data: offerData } = await supabase
      .from('offers')
      .select('id, offer_amount, status, created_at')
      .eq('horse_id', horse.id)
      .eq('buyer_id', user.id)
      .in('status', ['pending', 'countered'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    existingOffer = offerData ? {
      id: offerData.id,
      amount: offerData.offer_amount,
      status: offerData.status,
      created_at: offerData.created_at
    } : null

    // Check for existing viewing request
    const { data: viewingData } = await supabase
      .from('viewing_requests')
      .select('*')
      .eq('horse_id', horse.id)
      .eq('requester_id', user.id)
      .in('status', ['pending', 'approved'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    existingViewingRequest = viewingData

    // Check for existing conversation with seller
    if (horse.seller_id) {
      const { data: messageData, count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('horse_id', horse.id)
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${horse.seller_id}),and(sender_id.eq.${horse.seller_id},recipient_id.eq.${user.id})`)
        .limit(1)

      hasExistingConversation = (count ?? 0) > 0
    }
  }

  console.log('Debug viewing button:', {
    userId: user?.id,
    sellerId: horse.seller_id,
    isOwnHorse,
    shouldShow: !isOwnHorse && user
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <ViewTracker horseId={horse.id} />
      <RecentlyViewedTracker
        horseId={horse.id}
        horseName={horse.name}
        horseSlug={horse.slug}
        horseImage={primaryImage}
        horsePrice={horse.price}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back to Map Button */}
        <div className="mb-4">
          <BackToMapButton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <ImageGallery images={horse.horse_images || []} name={horse.name} />

            {/* Video Gallery */}
            <VideoGallery videos={horse.horse_videos || []} />

            {/* Horse Details */}
            <HorseDetails horse={horse} />

            {/* Document Viewer */}
            <DocumentViewer documents={horse.horse_documents || []} />

            {/* Similar Horses */}
            <SimilarHorses horses={similarHorses} />
          </div>

          {/* Sidebar - 1 column */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Price Card */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="mb-4">
                  <p className="text-3xl font-bold text-green-600">
                    ${horse.price.toLocaleString()}
                  </p>
                  {horse.metadata?.negotiable && (
                    <p className="text-sm text-gray-500 mt-1">Price negotiable</p>
                  )}
                </div>

                {/* Quick Info */}
                <div className="space-y-2 mb-6 pb-6 border-b">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Location</span>
                    <span className="font-medium">
                      {horse.location?.city}, {horse.location?.state}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Listed</span>
                    <span className="font-medium">
                      {new Date(horse.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Views</span>
                    <span className="font-medium">{horse.view_count || 0}</span>
                  </div>
                </div>

                {/* Farm Info */}
                {horse.farm_name && (
                  <div className="mb-6 pb-6 border-b">
                    <div className="flex items-center gap-3">
                      {horse.farm_logo_url && (
                        <div className="relative w-12 h-12 flex-shrink-0">
                          <img
                            src={horse.farm_logo_url}
                            alt={horse.farm_name}
                            className="object-contain w-full h-full"
                          />
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Listed by</p>
                        <p className="font-semibold text-gray-900">{horse.farm_name}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Watch Button */}
                <div className="mb-6 pb-6 border-b">
                  <WatchButton
                    horseId={horse.id}
                    horseName={horse.name}
                    className="w-full"
                    showCount={true}
                  />
                </div>

                {/* Request Viewing Button */}
                {horse.seller_id && (
                  <div className="mb-6 pb-6 border-b">
                    <RequestViewingButton
                      horseId={horse.id}
                      horseName={horse.name}
                      sellerId={horse.seller_id}
                      className="w-full"
                      existingRequest={existingViewingRequest}
                    />
                  </div>
                )}

                {/* Contact Seller */}
                <ContactSeller
                  seller={horse.profiles}
                  horseId={horse.id}
                  horseName={horse.name}
                  horseSlug={horse.slug}
                  horsePrice={horse.price}
                  existingOffer={existingOffer}
                  hasExistingConversation={hasExistingConversation}
                />
              </div>

              {/* Seller Reviews */}
              {horse.seller_id && horse.profiles && (
                <SellerReviewsSection
                  sellerId={horse.seller_id}
                  sellerName={horse.profiles.full_name || horse.profiles.name || 'Seller'}
                  reputation={sellerReputation}
                  recentReviews={sellerReviews}
                />
              )}

              {/* Safety Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Safety Tips</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Always meet in person before purchasing</li>
                  <li>• Request a pre-purchase vet exam</li>
                  <li>• Verify registration papers</li>
                  <li>• Use secure payment methods</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}