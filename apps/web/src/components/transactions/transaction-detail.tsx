'use client'

import { useState, useEffect } from 'react'
import { getTransaction, getTransactionEvents, releaseEscrow, requestRefund, manuallyCompleteTransaction, getRefundRequests } from '@/lib/actions/transactions'
import { formatCurrency } from '@/lib/utils/currency'
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Calendar,
  User,
  FileText,
  ExternalLink,
  Loader2,
  RotateCcw,
  X
} from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { EscrowCountdown } from './escrow-countdown'
import { TransactionTimeline } from './transaction-timeline'

interface Transaction {
  id: string
  horse_id: string
  buyer_id: string
  seller_id: string
  listing_price_cents: number
  final_price_cents: number
  platform_fee_cents: number
  seller_receives_cents: number
  status: string
  escrow_release_date: string
  escrow_released_at: string | null
  created_at: string
  completed_at: string | null
  horses: {
    id: string
    name: string
    slug: string
    breed: string
    age: number
    price: number
  }
  buyer: {
    id: string
    name: string
    email: string
  }
  seller: {
    id: string
    name: string
    email: string
  }
}

export function TransactionDetail({ transactionId }: { transactionId: string }) {
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [events, setEvents] = useState<any[]>([])
  const [refundRequests, setRefundRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [releasing, setReleasing] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [refundReason, setRefundReason] = useState('')
  const [requestingRefund, setRequestingRefund] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [transactionId])

  async function loadData() {
    setLoading(true)

    const [transactionResult, eventsResult, refundsResult] = await Promise.all([
      getTransaction(transactionId),
      getTransactionEvents(transactionId),
      getRefundRequests(transactionId)
    ])

    if (transactionResult.success && transactionResult.transaction) {
      setTransaction(transactionResult.transaction)
    }

    if (eventsResult.success && eventsResult.events) {
      setEvents(eventsResult.events)
    }

    if (refundsResult.success && refundsResult.requests) {
      setRefundRequests(refundsResult.requests)
    }

    setLoading(false)
  }

  async function handleReleaseEscrow() {
    if (!confirm('Are you sure you want to release the escrow funds to the seller? This action cannot be undone.')) {
      return
    }

    setReleasing(true)
    console.log('Releasing escrow for transaction:', transactionId)
    const result = await releaseEscrow(transactionId)
    console.log('Release escrow result:', result)

    if (result.success) {
      toast({
        title: 'Success',
        description: 'Escrow funds have been released to the seller',
      })
      await loadData() // Reload data
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to release escrow',
        variant: 'destructive',
      })
    }
    setReleasing(false)
  }

  async function handleManualComplete() {
    if (!confirm('Are you sure you want to manually mark this transaction as completed? Use this only for testing or if funds were already transferred.')) {
      return
    }

    setReleasing(true)
    const result = await manuallyCompleteTransaction(transactionId)

    if (result.success) {
      toast({
        title: 'Success',
        description: 'Transaction marked as completed',
      })
      await loadData() // Reload data
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to complete transaction',
        variant: 'destructive',
      })
    }
    setReleasing(false)
  }

  async function handleRequestRefund() {
    if (!refundReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for the refund request',
        variant: 'destructive',
      })
      return
    }

    setRequestingRefund(true)
    const result = await requestRefund(transactionId, refundReason)

    if (result.success) {
      toast({
        title: 'Success',
        description: 'Refund request submitted successfully',
      })
      setShowRefundModal(false)
      setRefundReason('')
      await loadData() // Reload data
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to request refund',
        variant: 'destructive',
      })
    }
    setRequestingRefund(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Transaction not found</p>
        <Link href="/transactions" className="text-green-600 hover:text-green-700 mt-4 inline-block">
          Back to Transactions
        </Link>
      </div>
    )
  }

  const isBuyer = transaction.buyer_id === transaction.buyer.id
  const canReleaseEscrow = isBuyer && transaction.status === 'payment_held'

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/transactions"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Transactions
      </Link>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {transaction.horses.name}
            </h1>
            <p className="text-gray-600">
              Transaction ID: {transaction.id.slice(0, 8)}...
            </p>
          </div>
          <StatusBadge status={transaction.status} />
        </div>
      </div>

      {/* Refund Request Alert */}
      {refundRequests.length > 0 && refundRequests.some(r => r.status === 'pending') && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-2">
                Refund Request Pending
              </h3>
              {refundRequests
                .filter(r => r.status === 'pending')
                .map(request => {
                  const isRequester = request.requested_by === transaction.buyer_id || request.requested_by === transaction.seller_id
                  const requesterName = request.requester?.name || 'User'

                  return (
                    <div key={request.id} className="bg-white rounded-lg p-4 mb-3 border border-red-200">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-red-900">
                            {request.requested_by === transaction.buyer_id ? 'Buyer' : 'Seller'} Requested Refund
                          </p>
                          <p className="text-sm text-red-700 mt-1">
                            Amount: {formatCurrency(request.amount_cents)}
                          </p>
                        </div>
                        <p className="text-xs text-red-600">
                          {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="bg-red-50 rounded p-3 mb-3">
                        <p className="text-sm font-medium text-red-900 mb-1">Reason:</p>
                        <p className="text-sm text-red-800">{request.reason}</p>
                      </div>
                      {request.requested_by !== transaction.buyer_id && request.requested_by !== transaction.seller_id && (
                        <p className="text-sm text-red-700 italic">
                          This request is under review. Both parties will be notified of the outcome.
                        </p>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      )}

      {/* Escrow Alert */}
      {transaction.status === 'payment_held' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-2">
                {isBuyer ? 'Funds in Escrow' : 'Awaiting Payment Release'}
              </h3>
              <p className="text-amber-800 mb-4">
                {isBuyer
                  ? 'Your payment is being held securely. Release funds when you\'re satisfied with the transaction, or wait for automatic release.'
                  : 'The buyer\'s payment is being held in escrow. Funds will be automatically transferred to your account after the escrow period.'}
              </p>
              <EscrowCountdown releaseDate={transaction.escrow_release_date} />
              {canReleaseEscrow && (
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={handleReleaseEscrow}
                    disabled={releasing}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {releasing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Releasing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        Release Escrow Now
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleManualComplete}
                    disabled={releasing}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white font-medium rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {releasing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        Mark as Completed (Test)
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financial Breakdown */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Financial Breakdown</h2>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Original Listing Price</span>
                <span className="font-medium">{formatCurrency(transaction.listing_price_cents)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Final Sale Price</span>
                <span className="font-semibold">{formatCurrency(transaction.final_price_cents)}</span>
              </div>
              <div className="flex justify-between py-2 border-b text-sm">
                <span className="text-gray-600">Platform Fee (5%)</span>
                <span className="text-gray-700">-{formatCurrency(transaction.platform_fee_cents)}</span>
              </div>
              {isBuyer ? (
                <div className="flex justify-between py-3 bg-gray-50 px-4 rounded-md">
                  <span className="font-semibold text-gray-900">You Paid</span>
                  <span className="text-xl font-bold text-gray-900">
                    {formatCurrency(transaction.final_price_cents)}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between py-3 bg-green-50 px-4 rounded-md">
                  <span className="font-semibold text-green-900">You Receive</span>
                  <span className="text-xl font-bold text-green-700">
                    {formatCurrency(transaction.seller_receives_cents)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Horse Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Horse Details</h2>
            <div className="space-y-3">
              <DetailRow label="Name" value={transaction.horses.name} />
              <DetailRow label="Breed" value={transaction.horses.breed} />
              <DetailRow label="Age" value={`${transaction.horses.age} years`} />
              <Link
                href={`/horses/${transaction.horses.slug}`}
                className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium text-sm"
              >
                View Listing
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Transaction Timeline */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Transaction History</h2>
            <TransactionTimeline events={events} />
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Transaction Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Transaction Info</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600 mb-1">Created</p>
                <p className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(transaction.created_at).toLocaleString()}
                </p>
              </div>
              {transaction.completed_at && (
                <div>
                  <p className="text-gray-600 mb-1">Completed</p>
                  <p className="font-medium flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    {new Date(transaction.completed_at).toLocaleString()}
                  </p>
                </div>
              )}
              {transaction.escrow_released_at && (
                <div>
                  <p className="text-gray-600 mb-1">Escrow Released</p>
                  <p className="font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    {new Date(transaction.escrow_released_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Parties */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Parties</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-600 mb-2">BUYER</p>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-sm">{transaction.buyer.name || 'Anonymous'}</p>
                    <p className="text-xs text-gray-600">{transaction.buyer.email}</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-2">SELLER</p>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-sm">{transaction.seller.name || 'Anonymous'}</p>
                    <p className="text-xs text-gray-600">{transaction.seller.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Help */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
            <p className="text-sm text-blue-800 mb-4">
              If you have any issues with this transaction, contact support.
            </p>
            <Link
              href="/support"
              className="inline-flex items-center gap-2 text-sm text-blue-700 hover:text-blue-800 font-medium"
            >
              <FileText className="h-4 w-4" />
              Contact Support
            </Link>
          </div>

          {/* Refund Button */}
          {['payment_held', 'completed'].includes(transaction.status) && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Request Refund</h3>
              <p className="text-sm text-gray-600 mb-4">
                If there's an issue with this transaction, you can request a refund.
              </p>
              <button
                onClick={() => setShowRefundModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                <RotateCcw className="h-5 w-5" />
                Request Refund
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Request Refund</h2>
              <button
                onClick={() => setShowRefundModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                Please provide a detailed reason for your refund request. This will be reviewed and the other party will be notified.
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Refund
              </label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Please explain why you're requesting a refund..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRefundModal(false)}
                disabled={requestingRefund}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestRefund}
                disabled={requestingRefund || !refundReason.trim()}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {requestingRefund ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-5 w-5" />
                    Submit Request
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              Note: Refund requests are reviewed on a case-by-case basis. Both parties will be notified of the request.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const configs = {
    payment_held: { label: 'In Escrow', color: 'bg-amber-100 text-amber-700', icon: Clock },
    completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    refunded: { label: 'Refunded', color: 'bg-purple-100 text-purple-700', icon: DollarSign },
    cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-700', icon: AlertTriangle },
  }

  const config = configs[status as keyof typeof configs] || configs.payment_held
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium ${config.color}`}>
      <Icon className="h-5 w-5" />
      {config.label}
    </span>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
