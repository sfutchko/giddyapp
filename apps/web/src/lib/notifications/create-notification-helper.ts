/**
 * Notification Helper
 *
 * Centralized utility for creating notifications across the app.
 * Import and use these functions from server actions to automatically
 * create notifications when events occur.
 */

import { createNotification } from '@/lib/actions/notifications'

/**
 * Create notification when a new message is received
 */
export async function notifyNewMessage(params: {
  recipientId: string
  senderName: string
  horseId?: string
  horseName?: string
  horseSlug?: string
  messagePreview: string
}) {
  await createNotification({
    userId: params.recipientId,
    type: 'message',
    title: 'New message',
    message: `${params.senderName}: ${params.messagePreview.substring(0, 100)}${params.messagePreview.length > 100 ? '...' : ''}`,
    horseId: params.horseId,
    actionUrl: params.horseSlug ? `/messages?horse=${params.horseSlug}` : '/messages',
    metadata: {
      sender_name: params.senderName,
      horse_name: params.horseName
    }
  })
}

/**
 * Create notification when a new offer is received
 */
export async function notifyNewOffer(params: {
  sellerId: string
  buyerName: string
  horseId: string
  horseName: string
  horseSlug: string
  offerAmount: number
  offerId: string
}) {
  await createNotification({
    userId: params.sellerId,
    type: 'offer',
    title: 'New offer received',
    message: `${params.buyerName} made an offer of $${params.offerAmount.toLocaleString()} on ${params.horseName}`,
    horseId: params.horseId,
    offerId: params.offerId,
    actionUrl: `/offers`,
    metadata: {
      buyer_name: params.buyerName,
      horse_name: params.horseName,
      offer_amount: params.offerAmount
    }
  })
}

/**
 * Create notification when an offer is accepted
 */
export async function notifyOfferAccepted(params: {
  buyerId: string
  sellerName: string
  horseId: string
  horseName: string
  horseSlug: string
  offerAmount: number
  offerId: string
}) {
  await createNotification({
    userId: params.buyerId,
    type: 'offer_accepted',
    title: '🎉 Offer accepted!',
    message: `${params.sellerName} accepted your offer of $${params.offerAmount.toLocaleString()} on ${params.horseName}`,
    horseId: params.horseId,
    offerId: params.offerId,
    actionUrl: `/offers`,
    metadata: {
      seller_name: params.sellerName,
      horse_name: params.horseName,
      offer_amount: params.offerAmount
    }
  })
}

/**
 * Create notification when an offer is rejected
 */
export async function notifyOfferRejected(params: {
  buyerId: string
  sellerName: string
  horseId: string
  horseName: string
  horseSlug: string
  offerId: string
}) {
  await createNotification({
    userId: params.buyerId,
    type: 'offer_rejected',
    title: 'Offer declined',
    message: `${params.sellerName} declined your offer on ${params.horseName}`,
    horseId: params.horseId,
    offerId: params.offerId,
    actionUrl: `/horses/${params.horseSlug}`,
    metadata: {
      seller_name: params.sellerName,
      horse_name: params.horseName
    }
  })
}

/**
 * Create notification when a counter-offer is made
 */
export async function notifyCounterOffer(params: {
  recipientId: string
  counterpartyName: string
  horseId: string
  horseName: string
  horseSlug: string
  counterAmount: number
  offerId: string
}) {
  await createNotification({
    userId: params.recipientId,
    type: 'offer_countered',
    title: 'Counter-offer received',
    message: `${params.counterpartyName} countered with $${params.counterAmount.toLocaleString()} on ${params.horseName}`,
    horseId: params.horseId,
    offerId: params.offerId,
    actionUrl: `/offers`,
    metadata: {
      counterparty_name: params.counterpartyName,
      horse_name: params.horseName,
      counter_amount: params.counterAmount
    }
  })
}

/**
 * Create notification when a viewing request is received
 */
export async function notifyViewingRequest(params: {
  sellerId: string
  requesterName: string
  horseId: string
  horseName: string
  horseSlug: string
  requestedDate: string
  requestedTime: string
  viewingRequestId: string
}) {
  await createNotification({
    userId: params.sellerId,
    type: 'viewing_request',
    title: 'New viewing request',
    message: `${params.requesterName} requested to view ${params.horseName} on ${params.requestedDate} at ${params.requestedTime}`,
    horseId: params.horseId,
    viewingRequestId: params.viewingRequestId,
    actionUrl: `/dashboard/viewing-requests`,
    metadata: {
      requester_name: params.requesterName,
      horse_name: params.horseName,
      requested_date: params.requestedDate,
      requested_time: params.requestedTime
    }
  })
}

/**
 * Create notification when a viewing request is approved
 */
export async function notifyViewingApproved(params: {
  requesterId: string
  sellerName: string
  horseId: string
  horseName: string
  horseSlug: string
  requestedDate: string
  requestedTime: string
  viewingRequestId: string
}) {
  await createNotification({
    userId: params.requesterId,
    type: 'viewing_approved',
    title: 'Viewing request approved',
    message: `${params.sellerName} approved your viewing request for ${params.horseName} on ${params.requestedDate} at ${params.requestedTime}`,
    horseId: params.horseId,
    viewingRequestId: params.viewingRequestId,
    actionUrl: `/dashboard/viewing-requests`,
    metadata: {
      seller_name: params.sellerName,
      horse_name: params.horseName,
      requested_date: params.requestedDate,
      requested_time: params.requestedTime
    }
  })
}

/**
 * Create notification when a viewing request is declined
 */
export async function notifyViewingDeclined(params: {
  requesterId: string
  sellerName: string
  horseId: string
  horseName: string
  horseSlug: string
  viewingRequestId: string
}) {
  await createNotification({
    userId: params.requesterId,
    type: 'viewing_declined',
    title: 'Viewing request declined',
    message: `${params.sellerName} declined your viewing request for ${params.horseName}`,
    horseId: params.horseId,
    viewingRequestId: params.viewingRequestId,
    actionUrl: `/horses/${params.horseSlug}`,
    metadata: {
      seller_name: params.sellerName,
      horse_name: params.horseName
    }
  })
}

/**
 * Create notification when a horse is sold
 */
export async function notifyListingSold(params: {
  sellerId: string
  horseName: string
  salePrice: number
  horseId: string
}) {
  await createNotification({
    userId: params.sellerId,
    type: 'listing_sold',
    title: '🎉 Horse sold!',
    message: `${params.horseName} has been sold for $${params.salePrice.toLocaleString()}`,
    horseId: params.horseId,
    actionUrl: `/analytics`,
    metadata: {
      horse_name: params.horseName,
      sale_price: params.salePrice
    }
  })
}

/**
 * Create notification when a review is received
 */
export async function notifyNewReview(params: {
  userId: string
  reviewerName: string
  rating: number
  horseId?: string
  horseName?: string
}) {
  await createNotification({
    userId: params.userId,
    type: 'review',
    title: 'New review',
    message: `${params.reviewerName} left you a ${params.rating}-star review${params.horseName ? ` for ${params.horseName}` : ''}`,
    horseId: params.horseId,
    actionUrl: '/profile',
    metadata: {
      reviewer_name: params.reviewerName,
      rating: params.rating,
      horse_name: params.horseName
    }
  })
}

/**
 * Create a system notification
 */
export async function notifySystem(params: {
  userId: string
  title: string
  message: string
  actionUrl?: string
}) {
  await createNotification({
    userId: params.userId,
    type: 'system',
    title: params.title,
    message: params.message,
    actionUrl: params.actionUrl
  })
}
