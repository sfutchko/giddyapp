'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Loader2, Lock, Shield, Clock, DollarSign } from 'lucide-react'
import Image from 'next/image'
import { formatCurrency } from '@/lib/utils/currency'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CheckoutFormProps {
  horse: any
  user: any
  offerId?: string
  offerAmount?: number
  primaryImage?: string
}

export function CheckoutForm({ horse, user, offerId, offerAmount, primaryImage }: CheckoutFormProps) {
  const [clientSecret, setClientSecret] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentDetails, setPaymentDetails] = useState<any>(null)

  const finalPrice = offerAmount || horse.price
  const finalPriceCents = Math.round(finalPrice * 100)

  useEffect(() => {
    // Create PaymentIntent
    fetch('/api/payments/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        horseId: horse.id,
        offerId: offerId || null,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
          setLoading(false)
          return
        }
        setClientSecret(data.clientSecret)
        setPaymentDetails({
          amount: data.amount,
          platformFee: data.platformFee,
          sellerReceives: data.sellerReceives,
        })
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to initialize payment')
        setLoading(false)
      })
  }, [horse.id, offerId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-900 font-semibold mb-2">Payment Setup Error</h3>
        <p className="text-red-700">{error}</p>
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <p className="text-gray-700">Unable to initialize payment. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Payment Form */}
      <div className="lg:col-span-2">
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#16a34a',
              },
            },
          }}
        >
          <PaymentForm
            clientSecret={clientSecret}
            horse={horse}
            finalPrice={finalPrice}
            offerId={offerId}
          />
        </Elements>
      </div>

      {/* Right Column - Order Summary */}
      <div className="space-y-6">
        {/* Horse Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {primaryImage && (
            <div className="relative h-48 w-full">
              <Image
                src={primaryImage}
                alt={horse.name}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="p-4">
            <h3 className="font-bold text-lg text-gray-900">{horse.name}</h3>
            <p className="text-sm text-gray-600">
              {horse.breed} • {horse.age} years old
            </p>
            {offerAmount && (
              <p className="text-xs text-green-600 mt-1">Accepted Offer</p>
            )}
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Payment Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Horse Price</span>
              <span className="font-medium">${finalPrice.toLocaleString()}</span>
            </div>
            {paymentDetails && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Platform Fee (5%)</span>
                  <span className="text-gray-700">{formatCurrency(paymentDetails.platformFee)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-semibold text-gray-900">Total Amount</span>
                  <span className="text-xl font-bold text-gray-900">
                    {formatCurrency(paymentDetails.amount)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Escrow Protection */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-green-900">Escrow Protection</h3>
          </div>
          <ul className="space-y-2 text-sm text-green-800">
            <li className="flex items-start gap-2">
              <Lock className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Payment held securely until you approve</span>
            </li>
            <li className="flex items-start gap-2">
              <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>7-day inspection period to verify horse condition</span>
            </li>
            <li className="flex items-start gap-2">
              <DollarSign className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Funds released to seller after your approval</span>
            </li>
          </ul>
        </div>

        {/* Security Notice */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">Secure Payment</span>
          </div>
          <p className="text-xs text-gray-600">
            Your payment information is encrypted and processed securely by Stripe. We never store your card details.
          </p>
        </div>
      </div>
    </div>
  )
}

function PaymentForm({ clientSecret, horse, finalPrice, offerId }: any) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [processing, setProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)
    setErrorMessage(null)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success?horseId=${horse.id}${offerId ? `&offerId=${offerId}` : ''}`,
      },
    })

    if (error) {
      setErrorMessage(error.message || 'An error occurred during payment')
      setProcessing(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Information</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <PaymentElement />

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={!stripe || processing}
          className="w-full px-6 py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
        >
          {processing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Lock className="h-5 w-5" />
              Pay ${finalPrice.toLocaleString()} Securely
            </>
          )}
        </button>

        <p className="text-xs text-center text-gray-500">
          By completing this purchase, you agree to our Terms of Service and Privacy Policy
        </p>
      </form>
    </div>
  )
}
