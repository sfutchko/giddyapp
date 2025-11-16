'use client'

import React, { useState } from 'react'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Upload,
  FileText,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  Building,
  User as UserIcon,
  CreditCard,
  FileCheck
} from 'lucide-react'
import { VerificationForm } from './verification-form'
import { useDialog } from '@/components/ui/dialog'
import { formatDate } from '@/lib/utils/format'

interface Profile {
  id: string
  name: string
  email: string
  is_seller?: boolean
  seller_verified?: boolean
}

interface VerificationDocument {
  id: string
  type: string
  url: string
  name: string
  uploaded_at: string
}

interface Verification {
  id: string
  user_id: string
  status: 'pending' | 'approved' | 'rejected' | 'additional_info_required'
  business_name?: string
  business_type?: string
  tax_id?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  website?: string
  submitted_at: string
  reviewed_at?: string
  reviewer_notes?: string
  rejection_reason?: string
  verification_documents?: VerificationDocument[]
}

interface VerificationCenterProps {
  user: User
  profile: Profile | null
  verification: Verification | null
  isAlreadyVerified: boolean
}

export function VerificationCenter({ user, profile, verification, isAlreadyVerified }: VerificationCenterProps) {
  const [showForm, setShowForm] = useState(false)
  const formDialog = useDialog()

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-6 w-6 text-green-600" />
      case 'rejected':
        return <XCircle className="h-6 w-6 text-red-600" />
      case 'pending':
        return <Clock className="h-6 w-6 text-yellow-600" />
      case 'additional_info_required':
        return <AlertCircle className="h-6 w-6 text-orange-600" />
      default:
        return <Shield className="h-6 w-6 text-gray-600" />
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            Verified
          </span>
        )
      case 'rejected':
        return (
          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
            Rejected
          </span>
        )
      case 'pending':
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
            Pending Review
          </span>
        )
      case 'additional_info_required':
        return (
          <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
            Additional Info Required
          </span>
        )
      default:
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
            Not Verified
          </span>
        )
    }
  }

  const verificationBenefits = [
    {
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
      title: 'Verified Badge',
      description: 'Display a trusted seller badge on all your listings'
    },
    {
      icon: <Shield className="h-5 w-5 text-green-600" />,
      title: 'Buyer Confidence',
      description: 'Buyers trust verified sellers more, leading to faster sales'
    },
    {
      icon: <FileCheck className="h-5 w-5 text-green-600" />,
      title: 'Priority Support',
      description: 'Get priority customer support and dispute resolution'
    },
    {
      icon: <Building className="h-5 w-5 text-green-600" />,
      title: 'Business Features',
      description: 'Access advanced business tools and analytics'
    }
  ]

  const requiredDocuments = [
    {
      type: 'government_id',
      icon: <UserIcon className="h-5 w-5" />,
      title: 'Government-Issued ID',
      description: 'Driver\'s license, passport, or state ID',
      required: true
    },
    {
      type: 'business_license',
      icon: <Building className="h-5 w-5" />,
      title: 'Business License',
      description: 'If selling as a business (optional for individuals)',
      required: false
    },
    {
      type: 'proof_of_address',
      icon: <FileText className="h-5 w-5" />,
      title: 'Proof of Address',
      description: 'Utility bill or bank statement from last 3 months',
      required: true
    },
    {
      type: 'bank_statement',
      icon: <CreditCard className="h-5 w-5" />,
      title: 'Bank Account Verification',
      description: 'Bank statement or voided check',
      required: true
    }
  ]

  if (isAlreadyVerified) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/profile"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Verification Center</h1>
                <p className="text-sm text-gray-600">You are a verified seller</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-lg font-semibold text-green-900 mb-2">
                  Your seller account is verified
                </h2>
                <p className="text-green-800 mb-4">
                  You have full access to all seller features and your listings display the verified badge.
                </p>
                {verification?.reviewed_at && (
                  <p className="text-sm text-green-700">
                    Verified on {formatDate(verification.reviewed_at)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Verification Details */}
        {verification && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Verification Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Business Name</p>
                <p className="font-medium text-gray-900">{verification.business_name || 'Individual Seller'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Business Type</p>
                <p className="font-medium text-gray-900">{verification.business_type || 'Individual'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-medium text-gray-900">
                  {verification.city}, {verification.state} {verification.zip}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium text-gray-900">{verification.phone}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (verification) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/profile"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                {getStatusIcon(verification.status)}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">Verification Center</h1>
                <p className="text-sm text-gray-600">Manage your seller verification</p>
              </div>
              {getStatusBadge(verification.status)}
            </div>
          </div>

          {/* Status Messages */}
          {verification.status === 'pending' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-900">Verification Pending</h3>
                  <p className="text-sm text-yellow-800 mt-1">
                    Your verification request is being reviewed. This typically takes 1-2 business days.
                  </p>
                  <p className="text-xs text-yellow-700 mt-2">
                    Submitted on {formatDate(verification.submitted_at)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {verification.status === 'rejected' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-900">Verification Rejected</h3>
                  <p className="text-sm text-red-800 mt-1">
                    {verification.rejection_reason || 'Your verification request was not approved.'}
                  </p>
                  {verification.reviewed_at && (
                    <p className="text-xs text-red-700 mt-2">
                      Reviewed on {formatDate(verification.reviewed_at)}
                    </p>
                  )}
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Submit New Application
                  </button>
                </div>
              </div>
            </div>
          )}

          {verification.status === 'additional_info_required' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-orange-900">Additional Information Required</h3>
                  <p className="text-sm text-orange-800 mt-1">
                    {verification.reviewer_notes || 'We need additional information to complete your verification.'}
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-3 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                  >
                    Provide Information
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submitted Information */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Submitted Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">Business Name</p>
              <p className="font-medium text-gray-900">{verification.business_name || 'Individual Seller'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Business Type</p>
              <p className="font-medium text-gray-900">{verification.business_type || 'Individual'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tax ID</p>
              <p className="font-medium text-gray-900">{verification.tax_id || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium text-gray-900">{verification.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Address</p>
              <p className="font-medium text-gray-900">{verification.address}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Location</p>
              <p className="font-medium text-gray-900">
                {verification.city}, {verification.state} {verification.zip}
              </p>
            </div>
          </div>

          {/* Uploaded Documents */}
          {verification.verification_documents && verification.verification_documents.length > 0 && (
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">Uploaded Documents</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {verification.verification_documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FileText className="h-5 w-5 text-gray-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                      <p className="text-xs text-gray-600">
                        Uploaded {formatDate(doc.uploaded_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // No verification request exists
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/profile"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Seller Verification</h1>
              <p className="text-sm text-gray-600">Become a verified seller on GiddyApp</p>
            </div>
          </div>
        </div>

        {!showForm ? (
          <>
            {/* Benefits */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Why Get Verified?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {verificationBenefits.map((benefit, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex-shrink-0">{benefit.icon}</div>
                    <div>
                      <h3 className="font-medium text-gray-900">{benefit.title}</h3>
                      <p className="text-sm text-gray-600">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Required Documents */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Required Documents</h2>
              <div className="space-y-3 mb-6">
                {requiredDocuments.map((doc, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-white rounded-lg flex-shrink-0">{doc.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{doc.title}</h3>
                        {doc.required && (
                          <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{doc.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowForm(true)}
                className="w-full px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                Start Verification Process
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </>
        ) : (
          <VerificationForm
            user={user}
            profile={profile}
            onCancel={() => setShowForm(false)}
            onSuccess={() => {
              // Refresh the page to show updated status
              window.location.reload()
            }}
          />
        )}
      </div>

      {/* Info Box */}
      {!showForm && (
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Verification Process</h3>
          <ol className="space-y-2 text-sm text-blue-800">
            <li className="flex gap-2">
              <span className="font-medium">1.</span>
              <span>Submit your information and required documents</span>
            </li>
            <li className="flex gap-2">
              <span className="font-medium">2.</span>
              <span>Our team reviews your application (1-2 business days)</span>
            </li>
            <li className="flex gap-2">
              <span className="font-medium">3.</span>
              <span>Receive verification decision via email</span>
            </li>
            <li className="flex gap-2">
              <span className="font-medium">4.</span>
              <span>Once approved, your listings display the verified badge</span>
            </li>
          </ol>
          <p className="mt-4 text-xs text-blue-700">
            All information is securely stored and only used for verification purposes.
          </p>
        </div>
      )}
    </div>
  )
}