'use client'

import { Star, Award } from 'lucide-react'
import type { UserReputation, Review } from '@/lib/actions/reviews'
import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'

interface SellerReviewsSectionProps {
  sellerId: string
  sellerName: string
  reputation: UserReputation | null
  recentReviews: Review[]
}

export function SellerReviewsSection({
  sellerId,
  sellerName,
  reputation,
  recentReviews
}: SellerReviewsSectionProps) {
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= Math.round(rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  if (!reputation || reputation.total_reviews === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Seller Reviews</h3>
        <p className="text-gray-600 text-sm">This seller has no reviews yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Seller Reviews</h3>
        {reputation.is_top_rated && (
          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
            <Award className="h-3 w-3" />
            Top Rated
          </div>
        )}
      </div>

      {/* Overall Rating */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900">
            {reputation.average_rating.toFixed(1)}
          </div>
          {renderStars(reputation.average_rating)}
          <div className="text-xs text-gray-500 mt-1">
            {reputation.total_reviews} {reputation.total_reviews === 1 ? 'review' : 'reviews'}
          </div>
        </div>

        {/* Rating Distribution (compact) */}
        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count =
              stars === 5
                ? reputation.rating_5_count
                : stars === 4
                ? reputation.rating_4_count
                : stars === 3
                ? reputation.rating_3_count
                : stars === 2
                ? reputation.rating_2_count
                : reputation.rating_1_count
            const percentage = reputation.total_reviews > 0 ? (count / reputation.total_reviews) * 100 : 0
            return (
              <div key={stars} className="flex items-center gap-2">
                <span className="text-xs text-gray-600 w-8">{stars} ★</span>
                <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-yellow-400 h-1.5 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 w-6 text-right">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Category Ratings (if seller has them) */}
      {reputation.as_seller_reviews > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4 pb-4 border-b border-gray-200">
          <div className="text-center">
            <div className="text-xs text-gray-600 mb-1">Communication</div>
            <div className="text-sm font-semibold text-gray-900">
              {reputation.average_communication.toFixed(1)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600 mb-1">Accuracy</div>
            <div className="text-sm font-semibold text-gray-900">
              {reputation.average_accuracy.toFixed(1)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600 mb-1">Professionalism</div>
            <div className="text-sm font-semibold text-gray-900">
              {reputation.average_professionalism.toFixed(1)}
            </div>
          </div>
        </div>
      )}

      {/* Recent Reviews */}
      {recentReviews.length > 0 && (
        <div className="space-y-3 mb-4">
          <h4 className="text-sm font-semibold text-gray-900">Recent Reviews</h4>
          {recentReviews.slice(0, 3).map((review) => {
            const reviewerName = review.reviewer?.full_name || review.reviewer?.name || 'Anonymous'
            return (
              <div key={review.id} className="border-b border-gray-100 pb-3 last:border-0">
                <div className="flex items-start gap-2">
                  {review.reviewer?.avatar_url && (
                    <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={review.reviewer.avatar_url}
                        alt={reviewerName}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 text-sm">{reviewerName}</span>
                      {renderStars(review.rating)}
                    </div>
                    {review.title && (
                      <p className="font-medium text-gray-900 text-sm mb-1">{review.title}</p>
                    )}
                    <p className="text-gray-600 text-sm line-clamp-2">{review.review_text}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* View All Link */}
      {reputation.total_reviews > 3 && (
        <Link
          href={`/sellers/${sellerId}/reviews`}
          className="text-green-600 hover:text-green-700 text-sm font-medium block text-center"
        >
          View all {reputation.total_reviews} reviews →
        </Link>
      )}
    </div>
  )
}
