'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Building2,
  Calendar,
  Globe,
  Phone,
  MapPin,
  Briefcase,
  Clock,
  ChevronRight,
  Eye,
  Shield,
  AlertTriangle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'

interface VerificationDocument {
  id: string
  type: string
  url: string
  name: string
  uploaded_at: string
}

interface Profile {
  id: string
  name: string
  email: string
  created_at: string
}

interface Verification {
  id: string
  user_id: string
  status: string
  business_name?: string
  business_type?: string
  tax_id?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  website?: string
  years_experience?: string
  professional_references?: string
  submitted_at: string
  reviewed_at?: string
  reviewed_by?: string
  reviewer_notes?: string
  rejection_reason?: string
  profiles: Profile
  verification_documents: VerificationDocument[]
}

interface Listing {
  id: string
  name: string
  created_at: string
  status: string
}

interface PreviousAttempt {
  id: string
  status: string
  submitted_at: string
  reviewed_at?: string
  rejection_reason?: string
}

interface VerificationReviewProps {
  verification: Verification
  listings: Listing[]
  previousAttempts: PreviousAttempt[]
  adminId: string
}

export function VerificationReview({
  verification,
  listings,
  previousAttempts,
  adminId
}: VerificationReviewProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [reviewNotes, setReviewNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [showAdditionalInfoModal, setShowAdditionalInfoModal] = useState(false)
  const [additionalInfoRequest, setAdditionalInfoRequest] = useState('')

  const handleApprove = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      // Update verification status
      const { error: verificationError } = await supabase
        .from('seller_verifications')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminId,
          reviewer_notes: reviewNotes
        })
        .eq('id', verification.id)

      if (verificationError) throw verificationError

      // Update user profile to mark as verified seller
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_verified_seller: true,
          seller_verified_at: new Date().toISOString()
        })
        .eq('id', verification.user_id)

      if (profileError) throw profileError

      toast.success('Verification approved successfully')
      router.push('/admin')
      router.refresh() // Force refresh to show updated status
    } catch (error: any) {
      console.error('Error approving verification:', error)
      toast.error(error.message || 'Failed to approve verification')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('seller_verifications')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminId,
          reviewer_notes: reviewNotes,
          rejection_reason: rejectionReason
        })
        .eq('id', verification.id)

      if (error) throw error

      toast.success('Verification rejected')
      router.push('/admin')
      router.refresh() // Force refresh to show updated status
    } catch (error: any) {
      console.error('Error rejecting verification:', error)
      toast.error(error.message || 'Failed to reject verification')
    } finally {
      setIsLoading(false)
      setShowRejectionModal(false)
    }
  }

  const handleRequestAdditionalInfo = async () => {
    if (!additionalInfoRequest.trim()) {
      toast.error('Please specify what additional information is needed')
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('seller_verifications')
        .update({
          status: 'additional_info_required',
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminId,
          reviewer_notes: additionalInfoRequest
        })
        .eq('id', verification.id)

      if (error) throw error

      toast.success('Additional information requested')
      router.push('/admin')
      router.refresh() // Force refresh to show updated status
    } catch (error: any) {
      console.error('Error requesting additional info:', error)
      toast.error(error.message || 'Failed to request additional information')
    } finally {
      setIsLoading(false)
      setShowAdditionalInfoModal(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
      approved: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
      additional_info_required: { bg: 'bg-orange-100', text: 'text-orange-700', icon: AlertCircle }
    }

    const badge = badges[status as keyof typeof badges] || badges.pending
    const Icon = badge.icon

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${badge.bg} ${badge.text}`}>
        <Icon className="h-4 w-4" />
        {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    )
  }

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      government_id: 'Government ID',
      business_license: 'Business License',
      proof_of_address: 'Proof of Address',
      bank_statement: 'Bank Statement'
    }
    return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin Dashboard
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Verification Review</h1>
            <p className="mt-2 text-gray-600">
              Review seller verification request from {verification.profiles.name}
            </p>
          </div>
          {getStatusBadge(verification.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Applicant Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Applicant Information
            </h2>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="mt-1 text-gray-900">{verification.profiles.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="mt-1 text-gray-900">{verification.profiles.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="mt-1 text-gray-900">{verification.phone || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Member Since</label>
                <p className="mt-1 text-gray-900">
                  {new Date(verification.profiles.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Business Information
            </h2>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Business Name</label>
                <p className="mt-1 text-gray-900">
                  {verification.business_name || verification.profiles.name}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Business Type</label>
                <p className="mt-1 text-gray-900 capitalize">
                  {verification.business_type?.replace(/_/g, ' ') || 'Not specified'}
                </p>
              </div>
              {verification.tax_id && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Tax ID/EIN</label>
                  <p className="mt-1 text-gray-900">{verification.tax_id}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Years of Experience</label>
                <p className="mt-1 text-gray-900">{verification.years_experience || 'Not specified'}</p>
              </div>
              {verification.website && (
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-500">Website</label>
                  <p className="mt-1">
                    <a
                      href={verification.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {verification.website}
                    </a>
                  </p>
                </div>
              )}
            </div>

            {/* Address */}
            <div className="mt-6 pt-6 border-t">
              <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Business Address
              </label>
              <p className="mt-1 text-gray-900">
                {verification.address}<br />
                {verification.city}, {verification.state} {verification.zip}
              </p>
            </div>

            {/* References */}
            {verification.professional_references && (
              <div className="mt-6 pt-6 border-t">
                <label className="text-sm font-medium text-gray-500">Professional References</label>
                <p className="mt-1 text-gray-900 whitespace-pre-wrap">
                  {verification.professional_references}
                </p>
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Verification Documents
            </h2>

            <div className="space-y-3">
              {verification.verification_documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {getDocumentTypeLabel(doc.type)}
                      </p>
                      <p className="text-sm text-gray-500">{doc.name}</p>
                      <p className="text-xs text-gray-400">
                        Uploaded {formatDistanceToNow(new Date(doc.uploaded_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View Document"
                    >
                      <Eye className="h-4 w-4" />
                    </a>
                    <a
                      href={doc.url}
                      download={doc.name}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Download Document"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              ))}

              {verification.verification_documents.length === 0 && (
                <p className="text-gray-500 text-center py-8">No documents uploaded</p>
              )}
            </div>
          </div>

          {/* Review Notes */}
          {verification.status === 'pending' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Review Notes</h2>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add internal notes about this verification (optional)"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                rows={4}
              />
            </div>
          )}

          {/* Previous Review Info */}
          {verification.status !== 'pending' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Review Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Reviewed At</label>
                  <p className="mt-1 text-gray-900">
                    {verification.reviewed_at
                      ? new Date(verification.reviewed_at).toLocaleString()
                      : 'Not reviewed yet'}
                  </p>
                </div>
                {verification.reviewer_notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Reviewer Notes</label>
                    <p className="mt-1 text-gray-900 whitespace-pre-wrap">
                      {verification.reviewer_notes}
                    </p>
                  </div>
                )}
                {verification.rejection_reason && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Rejection Reason</label>
                    <p className="mt-1 text-red-600 whitespace-pre-wrap">
                      {verification.rejection_reason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          {verification.status === 'pending' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handleApprove}
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve Verification
                </button>
                <button
                  onClick={() => setShowRejectionModal(true)}
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Reject Application
                </button>
                <button
                  onClick={() => setShowAdditionalInfoModal(true)}
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <AlertCircle className="h-4 w-4" />
                  Request More Info
                </button>
              </div>
            </div>
          )}

          {/* User Activity */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">User Activity</h3>

            {/* Listings */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-500 mb-3">Recent Listings</h4>
              {listings.length > 0 ? (
                <div className="space-y-2">
                  {listings.map((listing) => (
                    <Link
                      key={listing.id}
                      href={`/horses/${listing.id}`}
                      className="block p-2 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <p className="font-medium text-gray-900">{listing.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(listing.created_at).toLocaleDateString()}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No listings yet</p>
              )}
            </div>

            {/* Previous Attempts */}
            {previousAttempts.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">Previous Verification Attempts</h4>
                <div className="space-y-2">
                  {previousAttempts.map((attempt) => (
                    <div key={attempt.id} className="p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">
                          {attempt.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(attempt.submitted_at).toLocaleDateString()}
                        </span>
                      </div>
                      {attempt.rejection_reason && (
                        <p className="text-xs text-red-600 mt-1">
                          {attempt.rejection_reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Risk Indicators */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Risk Assessment
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Account Age</span>
                <span className="text-sm font-medium">
                  {Math.floor(
                    (Date.now() - new Date(verification.profiles.created_at).getTime()) /
                    (1000 * 60 * 60 * 24)
                  )} days
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Documents Provided</span>
                <span className="text-sm font-medium">
                  {verification.verification_documents.length} / 4
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Previous Attempts</span>
                <span className="text-sm font-medium">
                  {previousAttempts.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Reject Verification</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting this verification request.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none mb-4"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectionModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isLoading || !rejectionReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Additional Info Modal */}
      {showAdditionalInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Request Additional Information</h3>
            <p className="text-gray-600 mb-4">
              Specify what additional information or documents are needed.
            </p>
            <textarea
              value={additionalInfoRequest}
              onChange={(e) => setAdditionalInfoRequest(e.target.value)}
              placeholder="Describe what additional information is needed..."
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none mb-4"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowAdditionalInfoModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestAdditionalInfo}
                disabled={isLoading || !additionalInfoRequest.trim()}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}