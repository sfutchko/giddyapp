'use client'

import { useState, FormEvent } from 'react'
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { Loader2, ShieldCheck, Lock, CreditCard } from 'lucide-react'

interface CheckoutFormProps {
  horseName: string
  price: number
  paymentDetails: {
    amount: number
    platformFee: number
    sellerReceives: number
  }
  onSuccess: () => void
  onError: (error: string) => void
}

export function CheckoutForm({
  horseName,
  price,
  paymentDetails,
  onSuccess,
  onError,
}: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setLoading(true)
    setErrorMessage('')

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
      })

      if (error) {
        setErrorMessage(error.message || 'An error occurred')
        onError(error.message || 'Payment failed')
      } else {
        onSuccess()
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred')
      onError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Purchase Summary */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-medium text-gray-900">{horseName}</p>
            <p className="text-sm text-gray-600 mt-1">Purchase Price</p>
          </div>
          <p className="text-xl font-bold text-gray-900">
            ${price.toLocaleString()}
          </p>
        </div>

        <div className="border-t border-gray-200 pt-3 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{formatCurrency(paymentDetails.amount)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Platform Fee (5%)</span>
            <span>{formatCurrency(paymentDetails.platformFee)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Processing Fee (Stripe)</span>
            <span>Included</span>
          </div>
          <div className="border-t border-gray-300 pt-2 flex justify-between font-semibold text-gray-900">
            <span>Total</span>
            <span>{formatCurrency(paymentDetails.amount)}</span>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
          <div className="flex gap-2">
            <ShieldCheck className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">7-Day Buyer Protection</p>
              <p className="text-xs mt-1">
                Funds are held securely in escrow. Seller receives payment after the 7-day period unless you report an issue.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Element */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-gray-700 font-medium">
          <CreditCard className="h-5 w-5" />
          <span>Payment Information</span>
        </div>
        <PaymentElement />
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
          {errorMessage}
        </div>
      )}

      {/* Security Note */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Lock className="h-4 w-4" />
        <span>
          Secure payment powered by Stripe. Your payment information is encrypted and never stored on our servers.
        </span>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>Pay {formatCurrency(paymentDetails.amount)}</>
        )}
      </button>

      {/* Terms */}
      <p className="text-xs text-center text-gray-500">
        By completing this purchase, you agree to our{' '}
        <a href="/terms" className="text-green-600 hover:text-green-700">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="/privacy" className="text-green-600 hover:text-green-700">
          Privacy Policy
        </a>
        .
      </p>
    </form>
  )
}
