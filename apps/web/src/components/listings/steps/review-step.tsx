'use client'

import { ListingData } from '../listing-wizard'
import {
  ChevronLeft,
  CheckCircle,
  Edit2,
  DollarSign,
  MapPin,
  Calendar,
  Ruler,
  Info,
  Loader2
} from 'lucide-react'

interface ReviewStepProps {
  data: ListingData
  onBack: () => void
  onSubmit: (status: 'DRAFT' | 'ACTIVE') => void
  isSubmitting: boolean
}

export function ReviewStep({ data, onBack, onSubmit, isSubmitting }: ReviewStepProps) {
  return (
    <div className="space-y-6">
      {/* Success Message */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-900">Almost done!</h3>
            <p className="text-sm text-green-800 mt-1">
              Review your listing details below. You can save as draft or publish immediately.
            </p>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
          <button className="text-green-600 hover:text-green-700">
            <Edit2 className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Name:</span>
            <span className="ml-2 text-gray-900 font-medium">{data.name}</span>
          </div>
          <div>
            <span className="text-gray-500">Breed:</span>
            <span className="ml-2 text-gray-900 font-medium">{data.breed}</span>
          </div>
          <div>
            <span className="text-gray-500">Age:</span>
            <span className="ml-2 text-gray-900 font-medium">{data.age} years</span>
          </div>
          <div>
            <span className="text-gray-500">Gender:</span>
            <span className="ml-2 text-gray-900 font-medium capitalize">
              {data.gender.toLowerCase()}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Height:</span>
            <span className="ml-2 text-gray-900 font-medium">{data.height} hands</span>
          </div>
          <div>
            <span className="text-gray-500">Color:</span>
            <span className="ml-2 text-gray-900 font-medium">{data.color}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
        <p className="text-gray-700 whitespace-pre-line">{data.description}</p>

        <div className="mt-4 space-y-2">
          <div>
            <span className="text-sm text-gray-500">Disciplines:</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {data.disciplines?.map(discipline => (
                <span key={discipline} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                  {discipline}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Farm Details */}
      {data.farmName && (
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Farm Details</h3>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-500">Farm Name:</span>
              <span className="ml-2 text-gray-900 font-medium">{data.farmName}</span>
            </div>
            {data.farmLogo && (
              <div>
                <span className="text-sm text-gray-500">Farm Logo:</span>
                <span className="ml-2 text-green-600">✓ Uploaded</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Media */}
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Media</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <div>
            <span className="text-gray-500">Horse Photos:</span>
            <span className="ml-2 font-medium">{data.images?.length || 0} photo(s)</span>
          </div>
          {data.videos && data.videos.length > 0 && (
            <div>
              <span className="text-gray-500">Videos:</span>
              <span className="ml-2 font-medium">{data.videos.length} video(s)</span>
            </div>
          )}
          {data.documents && data.documents.length > 0 && (
            <div>
              <span className="text-gray-500">Documents:</span>
              <span className="ml-2 font-medium">{data.documents.length} document(s)</span>
              <span className="text-xs text-gray-500 ml-1">(vet records, papers, etc.)</span>
            </div>
          )}
        </div>
      </div>

      {/* Pricing & Location */}
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Pricing & Location</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <span className="text-2xl font-bold text-green-600">
              ${data.price?.toLocaleString()}
            </span>
            {data.negotiable && (
              <span className="text-sm text-gray-500">(Negotiable)</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span className="text-gray-700">
              {data.city}, {data.state} {data.zipCode}
            </span>
          </div>
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Before Publishing:</p>
            <ul className="space-y-1">
              <li>• Ensure all information is accurate</li>
              <li>• Double-check your asking price</li>
              <li>• Verify your contact information is up to date</li>
              <li>• Published listings cannot be edited for 24 hours</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-6 border-t">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <ChevronLeft className="h-5 w-5" />
          Previous
        </button>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onSubmit('DRAFT')}
            disabled={isSubmitting}
            className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={() => onSubmit('ACTIVE')}
            disabled={isSubmitting}
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                Publish Listing
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}