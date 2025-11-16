import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserReviews, getUserReputation, getReviewsByUser } from '@/lib/actions/reviews'
import { UserReputationDisplay } from '@/components/reviews/user-reputation'
import { ReviewCard } from '@/components/reviews/review-card'
import Link from 'next/link'
import { Star, Edit } from 'lucide-react'

export default async function ProfileReviewsPage() {
  const supabase = await createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get reviews received by the user
  const receivedResult = await getUserReviews(user.id)
  const receivedReviews = 'reviews' in receivedResult ? (receivedResult.reviews || []) : []

  // Get reviews written by the user
  const writtenResult = await getReviewsByUser(user.id)
  const writtenReviews = 'reviews' in writtenResult ? (writtenResult.reviews || []) : []

  // Get user reputation
  const reputationResult = await getUserReputation(user.id)
  const reputation = 'reputation' in reputationResult ? reputationResult.reputation : null

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Reviews</h1>
          <p className="text-gray-600">
            View your reputation and manage reviews you've received and written.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Reviews Received */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Reviews Received ({receivedReviews.length})
                </h2>
              </div>

              {receivedReviews.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No reviews yet</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Complete transactions to start receiving reviews.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {receivedReviews.map((review) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      currentUserId={user.id}
                      showHorseInfo
                      allowReply
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Reviews Written */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Reviews Written ({writtenReviews.length})
                </h2>
                <Link
                  href="/reviews/write"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <Edit className="h-5 w-5" />
                  Write Review
                </Link>
              </div>

              {writtenReviews.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <Edit className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">You haven't written any reviews yet</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Complete a transaction to leave a review.
                  </p>
                  <Link
                    href="/reviews/write"
                    className="inline-block mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Write Your First Review
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {writtenReviews.map((review) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      currentUserId={user.id}
                      showHorseInfo
                      showRevieweeInfo
                      allowDelete
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {reputation && <UserReputationDisplay reputation={reputation} />}
          </div>
        </div>
      </div>
    </div>
  )
}
