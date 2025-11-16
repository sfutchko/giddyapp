'use client'

import { useState } from 'react'
import { Star, ThumbsUp, ThumbsDown, Flag, MessageSquare, MoreVertical, Trash2 } from 'lucide-react'
import type { Review } from '@/lib/actions/reviews'
import { voteReviewHelpful, reportReview, addSellerReply, deleteReview } from '@/lib/actions/reviews'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'

interface ReviewCardProps {
  review: Review
  currentUserId?: string
  showHorseInfo?: boolean
  showRevieweeInfo?: boolean
  allowReply?: boolean
  allowDelete?: boolean
}

export function ReviewCard({
  review,
  currentUserId,
  showHorseInfo = false,
  showRevieweeInfo = true,
  allowReply = false,
  allowDelete = false
}: ReviewCardProps) {
  const router = useRouter()
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyText, setReplyText] = useState(review.seller_reply || '')
  const [submittingReply, setSubmittingReply] = useState(false)
  const [showReportForm, setShowReportForm] = useState(false)
  const [voting, setVoting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isOwnReview = currentUserId === review.reviewer_id
  const canReply = allowReply && currentUserId === review.reviewee_id && !review.seller_reply

  const handleVote = async (isHelpful: boolean) => {
    if (!currentUserId) {
      toast.error('Please log in to vote on reviews')
      return
    }

    setVoting(true)
    const result = await voteReviewHelpful(review.id, isHelpful)
    setVoting(false)

    if ('error' in result) {
      toast.error(result.error)
    } else {
      router.refresh()
    }
  }

  const handleReply = async () => {
    if (!replyText.trim()) {
      toast.error('Reply cannot be empty')
      return
    }

    setSubmittingReply(true)
    const result = await addSellerReply(review.id, replyText)
    setSubmittingReply(false)

    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success('Reply added successfully')
      setShowReplyForm(false)
      router.refresh()
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    const result = await deleteReview(review.id)
    setDeleting(false)

    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success('Review deleted successfully')
      router.refresh()
    }
  }

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const starSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  const reviewerName = review.reviewer?.full_name || review.reviewer?.name || 'Anonymous'
  const revieweeName = review.reviewee?.full_name || review.reviewee?.name || 'User'

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          {/* Reviewer Avatar */}
          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
            {review.reviewer?.avatar_url ? (
              <Image
                src={review.reviewer.avatar_url}
                alt={reviewerName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 font-medium">
                {reviewerName[0]?.toUpperCase()}
              </div>
            )}
          </div>

          {/* Reviewer Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-900">{reviewerName}</h4>
              {review.verified_purchase && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                  Verified Purchase
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {renderStars(review.rating, 'md')}
              <span className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>

        {/* Actions Menu */}
        {(isOwnReview && allowDelete) && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-gray-400 hover:text-red-600 transition-colors"
            title="Delete review"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Horse Info (if showing) */}
      {showHorseInfo && review.horse && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          {review.horse.horse_images?.[0] && (
            <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={review.horse.horse_images[0].url}
                alt={review.horse.name}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">{review.horse.name}</p>
            <p className="text-sm text-gray-600">
              {review.review_type === 'buyer_to_seller' ? 'Purchased from' : 'Sold to'} {revieweeName}
            </p>
          </div>
        </div>
      )}

      {/* Review Title */}
      {review.title && (
        <h5 className="font-semibold text-gray-900">{review.title}</h5>
      )}

      {/* Review Text */}
      <p className="text-gray-700 whitespace-pre-line">{review.review_text}</p>

      {/* Category Ratings (for seller reviews) */}
      {review.review_type === 'buyer_to_seller' && (
        review.communication_rating || review.accuracy_rating || review.professionalism_rating
      ) && (
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          {review.communication_rating && (
            <div>
              <p className="text-xs text-gray-600 mb-1">Communication</p>
              {renderStars(review.communication_rating)}
            </div>
          )}
          {review.accuracy_rating && (
            <div>
              <p className="text-xs text-gray-600 mb-1">Accuracy</p>
              {renderStars(review.accuracy_rating)}
            </div>
          )}
          {review.professionalism_rating && (
            <div>
              <p className="text-xs text-gray-600 mb-1">Professionalism</p>
              {renderStars(review.professionalism_rating)}
            </div>
          )}
        </div>
      )}

      {/* Seller Reply */}
      {review.seller_reply && (
        <div className="ml-12 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
          <div className="flex items-start gap-3">
            <MessageSquare className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-gray-900 mb-1">Response from {revieweeName}</p>
              <p className="text-gray-700">{review.seller_reply}</p>
              <p className="text-xs text-gray-500 mt-2">
                {formatDistanceToNow(new Date(review.seller_replied_at!), { addSuffix: true })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reply Form */}
      {showReplyForm && canReply && (
        <div className="ml-12 space-y-3">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write your response..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleReply}
              disabled={submittingReply || !replyText.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submittingReply ? 'Submitting...' : 'Post Reply'}
            </button>
            <button
              onClick={() => {
                setShowReplyForm(false)
                setReplyText(review.seller_reply || '')
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
        {/* Helpful Votes */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleVote(true)}
            disabled={voting || !currentUserId}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
              review.user_vote?.is_helpful
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } disabled:opacity-50`}
          >
            <ThumbsUp className="h-4 w-4" />
            <span className="text-sm font-medium">{review.helpful_count}</span>
          </button>
          <button
            onClick={() => handleVote(false)}
            disabled={voting || !currentUserId}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
              review.user_vote && !review.user_vote.is_helpful
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } disabled:opacity-50`}
          >
            <ThumbsDown className="h-4 w-4" />
            <span className="text-sm font-medium">{review.not_helpful_count}</span>
          </button>
        </div>

        {/* Reply Button */}
        {canReply && !showReplyForm && (
          <button
            onClick={() => setShowReplyForm(true)}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm font-medium">Reply</span>
          </button>
        )}

        {/* Report Button */}
        {!isOwnReview && currentUserId && (
          <button
            onClick={() => setShowReportForm(true)}
            className="flex items-center gap-1 text-gray-600 hover:text-red-600 transition-colors ml-auto"
          >
            <Flag className="h-4 w-4" />
            <span className="text-sm font-medium">Report</span>
          </button>
        )}
      </div>
    </div>
  )
}
