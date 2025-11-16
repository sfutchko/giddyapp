'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, Phone, Mail, User, CheckCircle, Loader2, DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { MakeOfferModal } from '@/components/offers/make-offer-modal'

interface ContactSellerProps {
  seller: {
    id: string
    name?: string | null
    full_name?: string | null
    email?: string
    phone?: string
    bio?: string | null
    is_verified_seller?: boolean
    location?: string | null
  } | null
  horseId: string
  horseName: string
  horseSlug: string
  horsePrice: number
  existingOffer?: {
    id: string
    amount: number
    status: string
    created_at: string
  } | null
  hasExistingConversation?: boolean
}

export function ContactSeller({ seller, horseId, horseName, horseSlug, horsePrice, existingOffer, hasExistingConversation = false }: ContactSellerProps) {
  const [showContactInfo, setShowContactInfo] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [showMessageForm, setShowMessageForm] = useState(false)
  const [sending, setSending] = useState(false)
  const [messageSent, setMessageSent] = useState(false)
  const [showMakeOffer, setShowMakeOffer] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Check if there's an existing conversation (from prop or session state)
  const hasConversation = hasExistingConversation || messageSent

  if (!seller) {
    return (
      <div className="text-gray-500 text-sm">
        Seller information not available
      </div>
    )
  }

  const handleSendMessage = async () => {
    if (!messageText.trim() || sending) return

    setSending(true)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Please login to send messages')
        router.push('/login')
        return
      }

      // Don't allow messaging yourself
      if (user.id === seller.id) {
        toast.error("You can't message yourself")
        return
      }

      // Generate conversation ID (consistent between users)
      // Using a shorter format to avoid potential database length issues
      const conversationId = `${horseId}-${[user.id, seller.id].sort().join('-')}`

      // Send the message
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          recipient_id: seller.id,
          horse_id: horseId,
          content: messageText.trim()
        })

      if (error) throw error

      toast.success('Message sent successfully!')
      setMessageText('')
      setShowMessageForm(false)
      setMessageSent(true)

    } catch (error: any) {
      console.error('Error sending message:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      toast.error(error.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Seller Info */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-gray-500" />
          </div>
          {seller.is_verified_seller && (
            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white">
              <CheckCircle className="h-3 w-3 text-white" />
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900">
              {seller.name || seller.full_name || 'Anonymous Seller'}
            </p>
            {seller.is_verified_seller && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                <CheckCircle className="h-3 w-3" />
                Verified
              </span>
            )}
          </div>
          {seller.location && (
            <p className="text-sm text-gray-500">{seller.location}</p>
          )}
        </div>
      </div>

      {seller.bio && (
        <p className="text-sm text-gray-600">{seller.bio}</p>
      )}

      {/* Contact Buttons */}
      <div className="space-y-2">
        {hasConversation ? (
          <button
            onClick={() => router.push('/messages')}
            className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <MessageCircle className="h-5 w-5" />
            View Conversation
          </button>
        ) : (
          <>
            {existingOffer && existingOffer.amount ? (
              <button
                onClick={() => router.push('/offers')}
                className="w-full px-4 py-3 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
              >
                <DollarSign className="h-5 w-5" />
                {existingOffer.status === 'pending' && 'Offer Pending'}
                {existingOffer.status === 'countered' && 'Counter Offer Received'}
                {' - $'}{existingOffer.amount.toLocaleString()}
              </button>
            ) : (
              <button
                onClick={() => setShowMakeOffer(true)}
                className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <DollarSign className="h-5 w-5" />
                Make Offer
              </button>
            )}
            <button
              onClick={() => setShowMessageForm(!showMessageForm)}
              className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle className="h-5 w-5" />
              Send Message
            </button>
          </>
        )}
      </div>

      {/* Contact Info Section */}
      {!hasConversation && (
        <div className="border-t pt-4">
          <button
            onClick={() => setShowContactInfo(!showContactInfo)}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            {showContactInfo ? 'Hide Contact Info' : 'Show Contact Info'}
          </button>
          {showContactInfo && (
            <div className="mt-3 bg-gray-50 rounded-lg p-4 space-y-3">
              {seller.email && (
                <a
                  href={`mailto:${seller.email}`}
                  className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">{seller.email}</span>
                </a>
              )}
              {seller.phone && (
                <a
                  href={`tel:${seller.phone}`}
                  className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">{seller.phone}</span>
                </a>
              )}
              {!seller.email && !seller.phone && (
                <p className="text-sm text-gray-500">
                  Contact information not provided
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Message Form */}
      {showMessageForm && !hasConversation && (
        <div className="border-t pt-4">
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Hi, I'm interested in your horse..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            rows={4}
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSendMessage}
              disabled={!messageText.trim() || sending}
              className="flex-1 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send'
              )}
            </button>
            <button
              onClick={() => {
                setShowMessageForm(false)
                setMessageText('')
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Make Offer Modal */}
      <MakeOfferModal
        isOpen={showMakeOffer}
        onClose={() => setShowMakeOffer(false)}
        horseId={horseId}
        horseName={horseName}
        horsePrice={horsePrice}
        sellerId={seller.id}
        onSuccess={() => router.refresh()}
      />
    </div>
  )
}