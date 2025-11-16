'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import Image from 'next/image'
import {
  DollarSign,
  Clock,
  Check,
  X,
  ArrowRight,
  MessageSquare,
  Truck,
  Stethoscope,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Receipt
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { formatRelativeTime } from '@/lib/utils'
import { markNotificationsByTypeAsRead } from '@/lib/actions/notifications'
import {
  sendOfferAcceptedEmail,
  sendOfferRejectedEmail,
  sendCounterOfferEmail,
} from '@/lib/email/send'
import { extendOffer, checkExpiredOffers } from '@/lib/actions/offers'

interface Offer {
  id: string
  horse_id: string
  buyer_id: string
  seller_id: string
  offer_amount: number
  offer_type: 'initial' | 'counter'
  parent_offer_id?: string
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'withdrawn' | 'countered'
  message?: string
  includes_transport: boolean
  includes_vetting: boolean
  contingencies?: string
  expires_at?: string
  responded_at?: string
  response_message?: string
  created_at: string
  horse: {
    id: string
    name: string
    slug: string
    price: number
    horse_images?: Array<{ url: string; is_primary: boolean }>
  }
  offer_events?: Array<{
    id: string
    event_type: string
    event_data: any
    created_at: string
    created_by: string
  }>
}

interface OffersContentProps {
  user: User
  sentOffers: Offer[]
  receivedOffers: Offer[]
}

export function OffersContent({ user, sentOffers, receivedOffers }: OffersContentProps) {
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received')
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null)
  const [showCounterModal, setShowCounterModal] = useState(false)
  const [counterAmount, setCounterAmount] = useState('')
  const [responseMessage, setResponseMessage] = useState('')
  const [processing, setProcessing] = useState(false)
  const supabase = createClient()

  // Mark offer-related notifications as read when viewing this page
  useEffect(() => {
    markNotificationsByTypeAsRead(['offer', 'offer_accepted', 'offer_rejected', 'offer_countered'])
  }, [])

  // Check for expired offers on page load
  useEffect(() => {
    checkExpiredOffers()
  }, [])

  const handleAcceptOffer = async (offer: Offer) => {
    if (!confirm('Are you sure you want to accept this offer? The buyer will be notified to complete payment.')) return

    setProcessing(true)
    try {
      // Update offer status
      const { error: updateError } = await supabase
        .from('offers')
        .update({
          status: 'accepted',
          responded_at: new Date().toISOString(),
          response_message: responseMessage || null
        })
        .eq('id', offer.id)

      if (updateError) throw updateError

      // Create event
      await supabase
        .from('offer_events')
        .insert({
          offer_id: offer.id,
          event_type: 'offer_accepted',
          event_data: { response_message: responseMessage },
          created_by: user.id
        })

      // Update any other pending offers for the same horse to rejected
      await supabase
        .from('offers')
        .update({ status: 'rejected', response_message: 'Another offer was accepted' })
        .eq('horse_id', offer.horse_id)
        .eq('status', 'pending')
        .neq('id', offer.id)

      // Update horse status to PENDING (awaiting payment)
      await supabase
        .from('horses')
        .update({
          status: 'PENDING'
        })
        .eq('id', offer.horse_id)
        .eq('seller_id', user.id)

      // Send notification to buyer to complete payment
      await supabase
        .from('notifications')
        .insert({
          user_id: offer.buyer_id,
          type: 'offer_accepted',
          title: 'Offer Accepted!',
          message: `Your offer of $${offer.offer_amount.toLocaleString()} for ${offer.horse.name} has been accepted. Please complete payment to finalize the purchase.`,
          link: `/checkout/${offer.horse_id}?offerId=${offer.id}`,
        })

      // Get buyer and seller info for email
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', [user.id, offer.buyer_id])

      const buyerProfile = profiles?.find(p => p.id === offer.buyer_id)
      const sellerProfile = profiles?.find(p => p.id === user.id)

      // Send email to buyer
      if (buyerProfile?.email) {
        try {
          await sendOfferAcceptedEmail({
            to: buyerProfile.email,
            buyerName: buyerProfile.full_name || 'there',
            sellerName: sellerProfile?.full_name || 'the seller',
            horseName: offer.horse.name,
            offerAmount: offer.offer_amount,
            offerId: offer.id,
          })
        } catch (emailError) {
          console.error('Failed to send offer accepted email:', emailError)
        }
      }

      toast.success('Offer accepted! Buyer will be notified to complete payment.')
      window.location.reload()

    } catch (error: any) {
      console.error('Error accepting offer:', error)
      toast.error('Failed to accept offer')
    } finally {
      setProcessing(false)
    }
  }

  const handleRejectOffer = async (offer: Offer) => {
    if (!confirm('Are you sure you want to reject this offer?')) return

    setProcessing(true)
    try {
      const { error } = await supabase
        .from('offers')
        .update({
          status: 'rejected',
          responded_at: new Date().toISOString(),
          response_message: responseMessage || null
        })
        .eq('id', offer.id)

      if (error) throw error

      // Create event
      await supabase
        .from('offer_events')
        .insert({
          offer_id: offer.id,
          event_type: 'offer_rejected',
          event_data: { response_message: responseMessage },
          created_by: user.id
        })

      // Get buyer and seller info for email
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', [user.id, offer.buyer_id])

      const buyerProfile = profiles?.find(p => p.id === offer.buyer_id)
      const sellerProfile = profiles?.find(p => p.id === user.id)

      // Send email to buyer
      if (buyerProfile?.email) {
        try {
          await sendOfferRejectedEmail({
            to: buyerProfile.email,
            buyerName: buyerProfile.full_name || 'there',
            sellerName: sellerProfile?.full_name || 'the seller',
            horseName: offer.horse.name,
            offerAmount: offer.offer_amount,
            horseId: offer.horse_id,
          })
        } catch (emailError) {
          console.error('Failed to send offer rejected email:', emailError)
        }
      }

      toast.success('Offer rejected')
      window.location.reload()

    } catch (error: any) {
      console.error('Error rejecting offer:', error)
      toast.error('Failed to reject offer')
    } finally {
      setProcessing(false)
    }
  }

  const handleCounterOffer = async (offer: Offer) => {
    const amount = parseFloat(counterAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid counter offer amount')
      return
    }

    setProcessing(true)
    try {
      // Create counter offer (swap buyer and seller for counter from seller)
      const { data: counterOffer, error: createError } = await supabase
        .from('offers')
        .insert({
          horse_id: offer.horse_id,
          buyer_id: offer.seller_id,  // Seller becomes the "buyer" of counter offer
          seller_id: offer.buyer_id,  // Original buyer becomes the "seller" (receiver)
          offer_amount: amount,
          offer_type: 'counter',
          parent_offer_id: offer.id,
          status: 'pending',
          message: responseMessage,
          includes_transport: offer.includes_transport,
          includes_vetting: offer.includes_vetting,
          contingencies: offer.contingencies,
          expires_at: offer.expires_at
        })
        .select()
        .single()

      if (createError) throw createError

      // Update original offer status
      await supabase
        .from('offers')
        .update({
          status: 'countered',
          responded_at: new Date().toISOString()
        })
        .eq('id', offer.id)

      // Create events
      await supabase
        .from('offer_events')
        .insert([
          {
            offer_id: offer.id,
            event_type: 'offer_countered',
            event_data: { counter_amount: amount },
            created_by: user.id
          },
          {
            offer_id: counterOffer.id,
            event_type: 'counter_offer_created',
            event_data: { original_offer_id: offer.id, amount },
            created_by: user.id
          }
        ])

      // Get buyer and seller info for email
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', [user.id, offer.buyer_id])

      const buyerProfile = profiles?.find(p => p.id === offer.buyer_id)
      const sellerProfile = profiles?.find(p => p.id === user.id)

      // Send email to buyer (original buyer receives counter offer)
      if (buyerProfile?.email) {
        try {
          await sendCounterOfferEmail({
            to: buyerProfile.email,
            buyerName: buyerProfile.full_name || 'there',
            sellerName: sellerProfile?.full_name || 'the seller',
            horseName: offer.horse.name,
            originalOffer: offer.offer_amount,
            counterOffer: amount,
            message: responseMessage || undefined,
            offerId: counterOffer.id,
          })
        } catch (emailError) {
          console.error('Failed to send counter offer email:', emailError)
        }
      }

      toast.success('Counter offer sent!')
      setShowCounterModal(false)
      window.location.reload()

    } catch (error: any) {
      console.error('Error creating counter offer:', error)
      toast.error('Failed to send counter offer')
    } finally {
      setProcessing(false)
    }
  }

  const handleWithdrawOffer = async (offer: Offer) => {
    if (!confirm('Are you sure you want to withdraw this offer?')) return

    setProcessing(true)
    try {
      const { error } = await supabase
        .from('offers')
        .update({ status: 'withdrawn' })
        .eq('id', offer.id)
        .eq('buyer_id', user.id)

      if (error) throw error

      await supabase
        .from('offer_events')
        .insert({
          offer_id: offer.id,
          event_type: 'offer_withdrawn',
          event_data: {},
          created_by: user.id
        })

      toast.success('Offer withdrawn')
      window.location.reload()

    } catch (error: any) {
      console.error('Error withdrawing offer:', error)
      toast.error('Failed to withdraw offer')
    } finally {
      setProcessing(false)
    }
  }

  const handleExtendOffer = async (offer: Offer) => {
    setProcessing(true)
    try {
      await extendOffer(offer.id, 7) // Extend by 7 days

      toast.success('Offer extended by 7 days')
      window.location.reload()

    } catch (error: any) {
      console.error('Error extending offer:', error)
      toast.error(error.message || 'Failed to extend offer')
    } finally {
      setProcessing(false)
    }
  }

  const getPrimaryImage = (images?: { url: string; is_primary: boolean }[]) => {
    return images?.find(img => img.is_primary)?.url || images?.[0]?.url
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'accepted': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'countered': return 'bg-blue-100 text-blue-800'
      case 'expired': return 'bg-gray-100 text-gray-800'
      case 'withdrawn': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const offers = activeTab === 'received' ? receivedOffers : sentOffers

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-green-600">
                GiddyApp
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-green-600 transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Offers</h1>
          <p className="text-gray-600 mt-2">Manage your offers and negotiations</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('received')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'received'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Received Offers ({receivedOffers.length})
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'sent'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Sent Offers ({sentOffers.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Offers List */}
        {offers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">
              {activeTab === 'received'
                ? "You haven't received any offers yet"
                : "You haven't sent any offers yet"}
            </p>
            {activeTab === 'sent' && (
              <Link
                href="/horses/map"
                className="inline-block mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Browse Horses
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {offers.map(offer => {
              // Skip offers where horse has been deleted
              if (!offer.horse) return null

              const horseImage = getPrimaryImage(offer.horse.horse_images)
              const percentageOfAsking = ((offer.offer_amount / offer.horse.price) * 100).toFixed(1)

              return (
                <div key={offer.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start gap-6">
                      {/* Horse Image */}
                      <Link
                        href={`/horses/${offer.horse.slug}`}
                        className="flex-shrink-0"
                      >
                        <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-200">
                          {horseImage ? (
                            <Image
                              src={horseImage}
                              alt={offer.horse.name}
                              fill
                              className="object-cover hover:scale-105 transition-transform"
                              sizes="128px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              No image
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Offer Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <Link
                              href={`/horses/${offer.horse.slug}`}
                              className="text-lg font-semibold text-gray-900 hover:text-green-600"
                            >
                              {offer.horse.name}
                            </Link>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                              <span>Asking: ${offer.horse.price.toLocaleString()}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(offer.status)}`}>
                                {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                              </span>
                            </div>
                          </div>

                          {/* Offer Amount */}
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600">
                              ${offer.offer_amount.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500">
                              {percentageOfAsking}% of asking
                              {parseFloat(percentageOfAsking) < 100 && (
                                <TrendingDown className="inline h-4 w-4 ml-1 text-red-500" />
                              )}
                              {parseFloat(percentageOfAsking) > 100 && (
                                <TrendingUp className="inline h-4 w-4 ml-1 text-green-500" />
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Offer Info */}
                        <div className="mt-4 flex items-center gap-6 text-sm">
                          {offer.includes_transport && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <Truck className="h-4 w-4" />
                              <span>Transport included</span>
                            </div>
                          )}
                          {offer.includes_vetting && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <Stethoscope className="h-4 w-4" />
                              <span>Vetting included</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>{formatRelativeTime(offer.created_at)}</span>
                          </div>
                          {offer.expires_at && new Date(offer.expires_at) > new Date() && (
                            <div className="flex items-center gap-1 text-yellow-600">
                              <AlertCircle className="h-4 w-4" />
                              <span>Expires {formatRelativeTime(offer.expires_at)}</span>
                            </div>
                          )}
                        </div>

                        {/* Message */}
                        {offer.message && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">{offer.message}</p>
                          </div>
                        )}

                        {/* Contingencies */}
                        {offer.contingencies && (
                          <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                            <p className="text-sm font-medium text-yellow-800 mb-1">Contingencies:</p>
                            <p className="text-sm text-yellow-700">{offer.contingencies}</p>
                          </div>
                        )}

                        {/* Actions */}
                        {offer.status === 'accepted' && (
                          <div className="mt-4">
                            {(offer as any).transaction ? (
                              // Show transaction status
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-semibold text-blue-900">
                                      {activeTab === 'sent' ? 'Payment Completed' : 'Payment Received'}
                                    </p>
                                    <p className="text-sm text-blue-700 mt-1">
                                      {(offer as any).transaction.status === 'payment_held' && 'Funds are in escrow'}
                                      {(offer as any).transaction.status === 'completed' && 'Transaction completed'}
                                      {(offer as any).transaction.status === 'refund_requested' && 'Refund requested'}
                                      {(offer as any).transaction.status === 'refunded' && 'Transaction refunded'}
                                    </p>
                                  </div>
                                  <Link
                                    href={`/transactions/${(offer as any).transaction.id}`}
                                    className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                  >
                                    <Receipt className="h-5 w-5" />
                                    View Transaction
                                  </Link>
                                </div>
                              </div>
                            ) : activeTab === 'sent' ? (
                              // Show payment button for buyer
                              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-semibold text-green-900">Offer Accepted!</p>
                                    <p className="text-sm text-green-700 mt-1">
                                      Complete your purchase with secure escrow protection
                                    </p>
                                  </div>
                                  <Link
                                    href={`/checkout/${offer.horse_id}?offerId=${offer.id}`}
                                    className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                                  >
                                    <DollarSign className="h-5 w-5" />
                                    Complete Payment
                                  </Link>
                                </div>
                              </div>
                            ) : (
                              // Show waiting for payment for seller
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                  <Clock className="h-5 w-5 text-amber-600" />
                                  <div>
                                    <p className="font-semibold text-amber-900">Waiting for Payment</p>
                                    <p className="text-sm text-amber-700 mt-1">
                                      Buyer has been notified to complete payment
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        {offer.status === 'pending' && (
                          <div className="mt-4 flex items-center gap-3">
                            {activeTab === 'received' ? (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedOffer(offer)
                                    handleAcceptOffer(offer)
                                  }}
                                  disabled={processing}
                                  className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                  <Check className="h-4 w-4" />
                                  Accept
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedOffer(offer)
                                    setCounterAmount((offer.offer_amount * 1.1).toFixed(0))
                                    setShowCounterModal(true)
                                  }}
                                  disabled={processing}
                                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                  <ArrowRight className="h-4 w-4" />
                                  Counter
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedOffer(offer)
                                    handleRejectOffer(offer)
                                  }}
                                  disabled={processing}
                                  className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                  <X className="h-4 w-4" />
                                  Reject
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleWithdrawOffer(offer)}
                                disabled={processing}
                                className="px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                              >
                                <X className="h-4 w-4" />
                                Withdraw
                              </button>
                            )}
                          </div>
                        )}
                        {offer.status === 'expired' && activeTab === 'sent' && (
                          <div className="mt-4">
                            <button
                              onClick={() => handleExtendOffer(offer)}
                              disabled={processing}
                              className="px-4 py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                              <Clock className="h-4 w-4" />
                              Extend Offer (7 days)
                            </button>
                          </div>
                        )}

                        {/* Response Message */}
                        {offer.response_message && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm font-medium text-blue-800 mb-1">Response:</p>
                            <p className="text-sm text-blue-700">{offer.response_message}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Counter Offer Modal */}
      {showCounterModal && selectedOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Counter Offer</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Counter Offer Amount
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="number"
                    value={counterAmount}
                    onChange={(e) => setCounterAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Original offer: ${selectedOffer.offer_amount.toLocaleString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  placeholder="Add a message with your counter offer..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleCounterOffer(selectedOffer)}
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Send Counter Offer
                </button>
                <button
                  onClick={() => {
                    setShowCounterModal(false)
                    setCounterAmount('')
                    setResponseMessage('')
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}