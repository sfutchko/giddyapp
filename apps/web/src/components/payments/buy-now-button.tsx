'use client'

import { useState } from 'react'
import { CreditCard } from 'lucide-react'
import { CheckoutModal } from './checkout-modal'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface BuyNowButtonProps {
  horseId: string
  horseName: string
  price: number
  sellerId: string
  currentUserId?: string
  horseStatus: string
}

export function BuyNowButton({
  horseId,
  horseName,
  price,
  sellerId,
  currentUserId,
  horseStatus,
}: BuyNowButtonProps) {
  const [showCheckout, setShowCheckout] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleClick = () => {
    // Check if user is logged in
    if (!currentUserId) {
      toast({
        title: 'Login Required',
        description: 'Please login to purchase this horse',
      })
      router.push(`/login?redirect=/horses/${horseId}`)
      return
    }

    // Check if user is trying to buy their own horse
    if (currentUserId === sellerId) {
      toast({
        title: 'Invalid Action',
        description: 'You cannot purchase your own listing',
        variant: 'destructive',
      })
      return
    }

    // Check if horse is available
    if (horseStatus !== 'ACTIVE') {
      toast({
        title: 'Not Available',
        description: 'This horse is no longer available for purchase',
        variant: 'destructive',
      })
      return
    }

    setShowCheckout(true)
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={horseStatus !== 'ACTIVE'}
      >
        <CreditCard className="h-5 w-5" />
        {horseStatus === 'ACTIVE' ? `Buy Now - $${price.toLocaleString()}` : 'Not Available'}
      </button>

      {showCheckout && (
        <CheckoutModal
          open={showCheckout}
          onClose={() => setShowCheckout(false)}
          horseId={horseId}
          horseName={horseName}
          price={price}
        />
      )}
    </>
  )
}
