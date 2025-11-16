'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Check, X, MessageSquare, Phone, Mail, CheckCircle2, XCircle } from 'lucide-react'
import { type ViewingRequest } from '@/lib/actions/viewing-requests'
import {
  updateViewingRequestStatus,
  cancelViewingRequest,
  markViewingCompleted
} from '@/lib/actions/viewing-requests'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { markNotificationsByTypeAsRead } from '@/lib/actions/notifications'

interface ViewingRequestsListProps {
  requests: ViewingRequest[]
  type: 'sent' | 'received'
  currentUserId: string
}

export function ViewingRequestsList({ requests, type, currentUserId }: ViewingRequestsListProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const router = useRouter()

  // Mark viewing request notifications as read when viewing this page
  useEffect(() => {
    markNotificationsByTypeAsRead(['viewing_request', 'viewing_approved', 'viewing_declined'])
  }, [])

  const handleApprove = async (requestId: string) => {
    setActionLoading(requestId)
    const result = await updateViewingRequestStatus(requestId, 'approved')

    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success('Viewing request approved!')
      router.refresh()
    }

    setActionLoading(null)
  }

  const handleDecline = async (requestId: string) => {
    setActionLoading(requestId)
    const result = await updateViewingRequestStatus(requestId, 'declined')

    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success('Viewing request declined')
      router.refresh()
    }

    setActionLoading(null)
  }

  const handleCancel = async (requestId: string) => {
    setActionLoading(requestId)
    const result = await cancelViewingRequest(requestId)

    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success('Viewing request cancelled')
      router.refresh()
    }

    setActionLoading(null)
  }

  const handleMarkCompleted = async (requestId: string) => {
    setActionLoading(requestId)
    const result = await markViewingCompleted(requestId)

    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success('Viewing marked as completed')
      router.refresh()
    }

    setActionLoading(null)
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      completed: 'bg-blue-100 text-blue-800'
    }[status] || 'bg-gray-100 text-gray-800'

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${styles}`}>
        {status === 'approved' && <CheckCircle2 className="h-4 w-4" />}
        {status === 'declined' && <XCircle className="h-4 w-4" />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No {type === 'sent' ? 'Requests' : 'Received Requests'} Yet</h3>
        <p className="text-gray-600">
          {type === 'sent'
            ? 'Browse horses and request viewings to see them here'
            : 'Requests from interested buyers will appear here'}
        </p>
        {type === 'sent' && (
          <Link
            href="/horses/map"
            className="inline-block mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
          >
            Browse Horses
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => {
        const horse = request.horse
        const otherUser = type === 'sent' ? request.seller : request.requester
        const primaryImage = horse?.horse_images?.find(img => img.is_primary)?.url || horse?.horse_images?.[0]?.url

        return (
          <div key={request.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start gap-4">
              {/* Horse Image */}
              {horse && primaryImage && (
                <Link href={`/horses/${horse.slug}`} className="flex-shrink-0">
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                    <Image
                      src={primaryImage}
                      alt={horse.name}
                      fill
                      className="object-cover hover:scale-105 transition-transform"
                      sizes="96px"
                    />
                  </div>
                </Link>
              )}

              {/* Request Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    {horse && (
                      <Link
                        href={`/horses/${horse.slug}`}
                        className="text-xl font-bold text-gray-900 hover:text-green-600 transition-colors"
                      >
                        {horse.name}
                      </Link>
                    )}
                    <p className="text-gray-600 mt-1">
                      {type === 'sent' ? 'Seller' : 'Requested by'}: {otherUser?.full_name || otherUser?.name || 'User'}
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <span className="font-medium">{formatDate(request.requested_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <span className="font-medium">{formatTime(request.requested_time)}</span>
                  </div>
                  {request.phone && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="h-5 w-5 text-gray-500" />
                      <a href={`tel:${request.phone}`} className="hover:text-green-600">{request.phone}</a>
                    </div>
                  )}
                  {request.email && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Mail className="h-5 w-5 text-gray-500" />
                      <a href={`mailto:${request.email}`} className="hover:text-green-600">{request.email}</a>
                    </div>
                  )}
                </div>

                {request.message && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                      <p className="text-gray-700 text-sm">{request.message}</p>
                    </div>
                  </div>
                )}

                {request.seller_notes && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm font-semibold text-blue-900 mb-1">Seller Notes:</p>
                    <p className="text-blue-800 text-sm">{request.seller_notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {type === 'received' && request.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(request.id)}
                        disabled={actionLoading === request.id}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleDecline(request.id)}
                        disabled={actionLoading === request.id}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                        Decline
                      </button>
                    </>
                  )}

                  {type === 'sent' && request.status === 'pending' && (
                    <button
                      onClick={() => handleCancel(request.id)}
                      disabled={actionLoading === request.id}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                      Cancel Request
                    </button>
                  )}

                  {request.status === 'approved' && (
                    <button
                      onClick={() => handleMarkCompleted(request.id)}
                      disabled={actionLoading === request.id}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Mark as Completed
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
