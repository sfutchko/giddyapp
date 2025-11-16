'use client'

import { Star, Award, ShieldCheck } from 'lucide-react'
import type { UserReputation } from '@/lib/actions/reviews'

interface UserReputationProps {
  reputation: UserReputation
  compact?: boolean
}

export function UserReputationDisplay({ reputation, compact = false }: UserReputationProps) {
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

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600'
    if (rating >= 4.0) return 'text-blue-600'
    if (rating >= 3.0) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {renderStars(reputation.average_rating)}
        <span className={`font-semibold ${getRatingColor(reputation.average_rating)}`}>
          {reputation.average_rating.toFixed(1)}
        </span>
        <span className="text-sm text-gray-500">
          ({reputation.total_reviews} {reputation.total_reviews === 1 ? 'review' : 'reviews'})
        </span>
        {reputation.is_top_rated && (
          <Award className="h-5 w-5 text-yellow-500" title="Top Rated" />
        )}
      </div>
    )
  }

  const ratingDistribution = [
    { stars: 5, count: reputation.rating_5_count },
    { stars: 4, count: reputation.rating_4_count },
    { stars: 3, count: reputation.rating_3_count },
    { stars: 2, count: reputation.rating_2_count },
    { stars: 1, count: reputation.rating_1_count }
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">
            Reputation Score: {reputation.reputation_score}/100
          </h3>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-2">
              {renderStars(reputation.average_rating)}
              <span className={`text-xl font-semibold ${getRatingColor(reputation.average_rating)}`}>
                {reputation.average_rating.toFixed(1)}
              </span>
            </div>
            <span className="text-gray-600">
              ({reputation.total_reviews} total {reputation.total_reviews === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        </div>

        {/* Badges */}
        <div className="flex gap-2">
          {reputation.is_top_rated && (
            <div className="flex items-center gap-1 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-lg">
              <Award className="h-5 w-5" />
              <span className="text-sm font-medium">Top Rated</span>
            </div>
          )}
          {reputation.is_verified_seller && (
            <div className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-sm font-medium">Verified</span>
            </div>
          )}
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900">Rating Distribution</h4>
        {ratingDistribution.map(({ stars, count }) => {
          const percentage = reputation.total_reviews > 0 ? (count / reputation.total_reviews) * 100 : 0
          return (
            <div key={stars} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-16">{stars} star{stars !== 1 ? 's' : ''}</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
            </div>
          )
        })}
      </div>

      {/* Category Ratings (if seller) */}
      {reputation.as_seller_reviews > 0 && (
        <div className="space-y-3 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-gray-900">As a Seller</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Communication</p>
              {renderStars(reputation.average_communication)}
              <p className="text-sm font-medium text-gray-900 mt-1">
                {reputation.average_communication.toFixed(1)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Accuracy</p>
              {renderStars(reputation.average_accuracy)}
              <p className="text-sm font-medium text-gray-900 mt-1">
                {reputation.average_accuracy.toFixed(1)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Professionalism</p>
              {renderStars(reputation.average_professionalism)}
              <p className="text-sm font-medium text-gray-900 mt-1">
                {reputation.average_professionalism.toFixed(1)}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600 pt-3 border-t border-gray-100">
            <span>Seller Rating:</span>
            <div className="flex items-center gap-2">
              {renderStars(reputation.as_seller_rating)}
              <span className="font-medium">{reputation.as_seller_rating.toFixed(1)}</span>
              <span>({reputation.as_seller_reviews} reviews)</span>
            </div>
          </div>
        </div>
      )}

      {/* Buyer Stats */}
      {reputation.as_buyer_reviews > 0 && (
        <div className="space-y-2 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-gray-900">As a Buyer</h4>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Buyer Rating:</span>
            <div className="flex items-center gap-2">
              {renderStars(reputation.as_buyer_rating)}
              <span className="font-medium">{reputation.as_buyer_rating.toFixed(1)}</span>
              <span>({reputation.as_buyer_reviews} reviews)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
