'use client'

import { useState } from 'react'
import { X, DollarSign, Truck, Stethoscope, Calendar, Info, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { createOffer } from '@/lib/actions/offers'

interface MakeOfferModalProps {
  isOpen: boolean
  onClose: () => void
  horseId: string
  horseName: string
  horsePrice: number
  sellerId: string
  onSuccess?: () => void
}

export function MakeOfferModal({
  isOpen,
  onClose,
  horseId,
  horseName,
  horsePrice,
  sellerId,
  onSuccess
}: MakeOfferModalProps) {
  const [offerAmount, setOfferAmount] = useState(horsePrice.toString())
  const [includesTransport, setIncludesTransport] = useState(false)
  const [includesVetting, setIncludesVetting] = useState(false)
  const [message, setMessage] = useState('')
  const [contingencies, setContingencies] = useState('')
  const [expiresIn, setExpiresIn] = useState('7') // days
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const amount = parseFloat(offerAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid offer amount')
      return
    }

    setSubmitting(true)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Please login to make an offer')
        router.push('/login')
        return
      }

      // Don't allow offering on own horses
      if (user.id === sellerId) {
        toast.error("You can't make an offer on your own horse")
        return
      }

      // Use server action to create offer and send email
      const offer = await createOffer({
        horseId,
        sellerId,
        horseName,
        amount,
        message: message || undefined,
        includesTransport,
        includesVetting,
        contingencies: contingencies || undefined,
        expiresInDays: parseInt(expiresIn)
      })

      toast.success('Offer submitted successfully!')
      onClose()

      // If onSuccess callback provided, call it (for page refresh)
      // Otherwise redirect to offers page
      if (onSuccess) {
        onSuccess()
      } else {
        router.push(`/offers?highlight=${offer.id}`)
      }

    } catch (error: any) {
      console.error('Error submitting offer:', error)
      toast.error(error.message || 'Failed to submit offer')
    } finally {
      setSubmitting(false)
    }
  }

  const percentageOfAsking = ((parseFloat(offerAmount) || 0) / horsePrice * 100).toFixed(1)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[90] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Make an Offer</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Horse Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Making offer on</p>
            <p className="font-semibold text-gray-900">{horseName}</p>
            <p className="text-sm text-gray-600 mt-1">
              Asking price: ${horsePrice.toLocaleString()}
            </p>
          </div>

          {/* Offer Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Offer Amount
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="number"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0"
                required
              />
            </div>
            {offerAmount && (
              <p className="mt-1 text-sm text-gray-500">
                {percentageOfAsking}% of asking price
              </p>
            )}
          </div>

          {/* Inclusions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Offer Includes
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={includesTransport}
                  onChange={(e) => setIncludesTransport(e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <Truck className="h-5 w-5 text-gray-400" />
                <span className="text-gray-700">Transport arrangements</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={includesVetting}
                  onChange={(e) => setIncludesVetting(e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <Stethoscope className="h-5 w-5 text-gray-400" />
                <span className="text-gray-700">Pre-purchase vet examination</span>
              </label>
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message to Seller (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              placeholder="Add any notes about your offer..."
            />
          </div>

          {/* Contingencies */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contingencies (Optional)
            </label>
            <textarea
              value={contingencies}
              onChange={(e) => setContingencies(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              placeholder="e.g., Subject to satisfactory vet check, financing approval, etc."
            />
          </div>

          {/* Expiration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Offer Expires In
            </label>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <select
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="1">24 hours</option>
                <option value="3">3 days</option>
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
              </select>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">How offers work</p>
              <ul className="space-y-1 text-xs">
                <li>• The seller will be notified of your offer immediately</li>
                <li>• They can accept, reject, or counter your offer</li>
                <li>• You'll be notified of their response</li>
                <li>• Offers are not legally binding until a purchase agreement is signed</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <DollarSign className="h-5 w-5" />
                  Submit Offer
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}