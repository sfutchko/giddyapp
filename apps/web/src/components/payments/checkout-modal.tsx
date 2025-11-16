'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { CheckoutForm } from './checkout-form'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CheckoutModalProps {
  open: boolean
  onClose: () => void
  horseId: string
  horseName: string
  price: number
  offerId?: string
}

export function CheckoutModal({ open, onClose, horseId, horseName, price, offerId }: CheckoutModalProps) {
  const [clientSecret, setClientSecret] = useState<string>('')
  const [paymentDetails, setPaymentDetails] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open && !clientSecret) {
      createPaymentIntent()
    }
  }, [open])

  async function createPaymentIntent() {
    setLoading(true)
    try {
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          horseId,
          offerId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create payment intent')
      }

      const data = await response.json()
      setClientSecret(data.clientSecret)
      setPaymentDetails(data)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#16a34a',
    },
  }

  const options = {
    clientSecret,
    appearance,
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Complete Your Purchase</DialogTitle>
        </DialogHeader>

        {loading || !clientSecret ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          </div>
        ) : (
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm
              horseName={horseName}
              price={price}
              paymentDetails={paymentDetails}
              onSuccess={() => {
                toast({
                  title: 'Success!',
                  description: 'Payment successful. Redirecting...',
                })
                // Redirect to success page
                window.location.href = '/checkout/success'
              }}
              onError={(error) => {
                toast({
                  title: 'Payment Failed',
                  description: error,
                  variant: 'destructive',
                })
              }}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  )
}
