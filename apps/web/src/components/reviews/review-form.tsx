'use client'

import { useState } from 'react'
import { Star, Upload, X, Loader2 } from 'lucide-react'
import { createReview, type CreateReviewData } from '@/lib/actions/reviews'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface ReviewFormProps {
  offerId: string
  horseName: string
  horseImage?: string
  revieweeName: string
  revieweeAvatar?: string
  reviewType: 'buyer_to_seller' | 'seller_to_buyer'
  onSuccess?: () => void
  onCancel?: () => void
}

export function ReviewForm({
  offerId,
  horseName,
  horseImage,
  revieweeName,
  revieweeAvatar,
  reviewType,
  onSuccess,
  onCancel
}: ReviewFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [communicationRating, setCommunicationRating] = useState(0)
  const [accuracyRating, setAccuracyRating] = useState(0)
  const [professionalismRating, setProfessionalismRating] = useState(0)
  const [title, setTitle] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [photos, setPhotos] = useState<string[]>([])

  const isBuyerReview = reviewType === 'buyer_to_seller'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    if (reviewText.trim().length < 10) {
      toast.error('Review must be at least 10 characters')
      return
    }

    setSubmitting(true)

    const reviewData: CreateReviewData = {
      offerId,
      rating,
      reviewText,
      title: title.trim() || undefined,
      photoUrls: photos.length > 0 ? photos : undefined
    }

    // Add category ratings for seller reviews
    if (isBuyerReview) {
      if (communicationRating > 0) reviewData.communicationRating = communicationRating
      if (accuracyRating > 0) reviewData.accuracyRating = accuracyRating
      if (professionalismRating > 0) reviewData.professionalismRating = professionalismRating
    }

    const result = await createReview(reviewData)

    setSubmitting(false)

    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success('Review submitted successfully!')
      router.refresh()
      onSuccess?.()
    }
  }

  const StarRating = ({
    value,
    onChange,
    onHover,
    label,
    required = false
  }: {
    value: number
    onChange: (value: number) => void
    onHover?: (value: number) => void
    label: string
    required?: boolean
  }) => {
    const [localHover, setLocalHover] = useState(0)
    const displayRating = onHover ? (localHover || value) : value

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => (onHover ? setLocalHover(star) : null)}
              onMouseLeave={() => (onHover ? setLocalHover(0) : null)}
              className="focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
            >
              <Star
                className={`h-8 w-8 transition-colors ${
                  star <= displayRating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-gray-200 text-gray-300'
                }`}
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-gray-600">
            {value > 0 ? `${value} star${value !== 1 ? 's' : ''}` : 'Not rated'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Review Header */}
      <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
        {horseImage && (
          <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
            <Image src={horseImage} alt={horseName} fill className="object-cover" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{horseName}</h3>
          <div className="flex items-center gap-2 mt-1">
            {revieweeAvatar && (
              <div className="relative w-6 h-6 rounded-full overflow-hidden">
                <Image src={revieweeAvatar} alt={revieweeName} fill className="object-cover" />
              </div>
            )}
            <p className="text-sm text-gray-600">
              {isBuyerReview ? `Reviewing seller: ${revieweeName}` : `Reviewing buyer: ${revieweeName}`}
            </p>
          </div>
        </div>
      </div>

      {/* Overall Rating */}
      <StarRating
        value={rating}
        onChange={setRating}
        onHover={setHoverRating}
        label="Overall Rating"
        required
      />

      {/* Category Ratings (for seller reviews only) */}
      {isBuyerReview && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900">Detailed Ratings (Optional)</h4>
          <StarRating
            value={communicationRating}
            onChange={setCommunicationRating}
            label="Communication"
          />
          <StarRating
            value={accuracyRating}
            onChange={setAccuracyRating}
            label="Accuracy of Listing"
          />
          <StarRating
            value={professionalismRating}
            onChange={setProfessionalismRating}
            label="Professionalism"
          />
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Review Title (Optional)
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          maxLength={200}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {/* Review Text */}
      <div>
        <label htmlFor="review-text" className="block text-sm font-medium text-gray-700 mb-2">
          Your Review <span className="text-red-500">*</span>
        </label>
        <textarea
          id="review-text"
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Share your experience with this transaction..."
          rows={6}
          minLength={10}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
        />
        <p className="text-sm text-gray-500 mt-1">
          {reviewText.length} characters (minimum 10)
        </p>
      </div>

      {/* Photo Upload (placeholder - would integrate with actual upload service) */}
      {isBuyerReview && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photos (Optional)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Upload photos of the horse</p>
            <p className="text-xs text-gray-500 mt-1">Coming soon</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || rating === 0 || reviewText.trim().length < 10}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </form>
  )
}
