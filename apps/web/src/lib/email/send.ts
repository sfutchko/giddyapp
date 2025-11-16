'use server'

import * as React from 'react'
import { resend, EMAIL_CONFIG } from './config'
import { render } from '@react-email/render'

// Helper to check if email is enabled
function isEmailEnabled() {
  if (!resend) {
    console.warn('Email sending is disabled: RESEND_API_KEY not configured')
    return false
  }
  return true
}
import OfferReceivedEmail from './templates/offer-received'
import OfferAcceptedEmail from './templates/offer-accepted'
import OfferRejectedEmail from './templates/offer-rejected'
import CounterOfferEmail from './templates/counter-offer'
import OfferExpiredEmail from './templates/offer-expired'
import PaymentConfirmationEmail from './templates/payment-confirmation'
import EscrowReleasedEmail from './templates/escrow-released'
import PriceDropAlertEmail from './templates/price-drop-alert'
import ViewingRequestReceivedEmail from './templates/viewing-request-received'

// Offer notification emails

export async function sendOfferReceivedEmail(params: {
  to: string
  sellerName: string
  buyerName: string
  horseName: string
  offerAmount: number
  message?: string
  offerId: string
}) {
  if (!isEmailEnabled()) return { error: 'Email not configured' }

  const { to, offerId, ...emailProps } = params

  const html = await render(
    OfferReceivedEmail({
      ...emailProps,
      offerUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/offers/${offerId}`,
    })
  )

  return await resend!.emails.send({
    from: EMAIL_CONFIG.from,
    to,
    subject: `New offer on ${params.horseName}`,
    html,
  })
}

export async function sendOfferAcceptedEmail(params: {
  to: string
  buyerName: string
  sellerName: string
  horseName: string
  offerAmount: number
  offerId: string
}) {
  if (!isEmailEnabled()) return { error: 'Email not configured' }

  const { to, offerId, ...emailProps } = params

  const html = await render(
    OfferAcceptedEmail({
      ...emailProps,
      checkoutUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/${offerId}`,
    })
  )

  return await resend!.emails.send({
    from: EMAIL_CONFIG.from,
    to,
    subject: `Your offer on ${params.horseName} was accepted! 🎉`,
    html,
  })
}

export async function sendOfferRejectedEmail(params: {
  to: string
  buyerName: string
  sellerName: string
  horseName: string
  offerAmount: number
  horseId: string
}) {
  if (!isEmailEnabled()) return { error: 'Email not configured' }

  const { to, horseId, ...emailProps } = params

  const html = await render(
    OfferRejectedEmail({
      ...emailProps,
      horseUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/horses/${horseId}`,
    })
  )

  return await resend!.emails.send({
    from: EMAIL_CONFIG.from,
    to,
    subject: `Update on your offer for ${params.horseName}`,
    html,
  })
}

export async function sendCounterOfferEmail(params: {
  to: string
  buyerName: string
  sellerName: string
  horseName: string
  originalOffer: number
  counterOffer: number
  message?: string
  offerId: string
}) {
  if (!isEmailEnabled()) return { error: 'Email not configured' }

  const { to, offerId, ...emailProps } = params

  const html = await render(
    CounterOfferEmail({
      ...emailProps,
      offerUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/offers/${offerId}`,
    })
  )

  return await resend!.emails.send({
    from: EMAIL_CONFIG.from,
    to,
    subject: `Counter offer on ${params.horseName}`,
    html,
  })
}

export async function sendOfferExpiredEmail(params: {
  to: string
  buyerName: string
  horseName: string
  offerAmount: number
  offerId: string
}) {
  if (!isEmailEnabled()) return { error: 'Email not configured' }

  const { to, offerId, ...emailProps } = params

  const html = await render(
    OfferExpiredEmail({
      ...emailProps,
      offerUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/offers`,
    })
  )

  return await resend!.emails.send({
    from: EMAIL_CONFIG.from,
    to,
    subject: `Your offer on ${params.horseName} has expired`,
    html,
  })
}

// Payment and escrow emails

export async function sendPaymentConfirmationEmail(params: {
  to: string
  buyerName: string
  horseName: string
  amount: number
  transactionId: string
  sellerName: string
}) {
  if (!isEmailEnabled()) return { error: 'Email not configured' }

  const html = await render(
    PaymentConfirmationEmail({
      ...params,
      dashboardUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/transactions`,
    })
  )

  return await resend!.emails.send({
    from: EMAIL_CONFIG.from,
    to,
    subject: `Payment confirmed for ${params.horseName}`,
    html,
  })
}

export async function sendEscrowReleasedEmail(params: {
  to: string
  recipientName: string
  recipientType: 'buyer' | 'seller'
  horseName: string
  amount: number
  transactionId: string
}) {
  if (!isEmailEnabled()) return { error: 'Email not configured' }

  const html = await render(
    EscrowReleasedEmail({
      ...params,
      dashboardUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/transactions`,
    })
  )

  const subject =
    params.recipientType === 'seller'
      ? `Payment released for ${params.horseName}`
      : `Transaction complete for ${params.horseName}`

  return await resend!.emails.send({
    from: EMAIL_CONFIG.from,
    to,
    subject,
    html,
  })
}

// Price drop alerts

export async function sendPriceDropAlertEmail(params: {
  to: string
  buyerName: string
  horseName: string
  originalPrice: number
  newPrice: number
  horseId: string
  horseImage?: string
}) {
  if (!isEmailEnabled()) return { error: 'Email not configured' }

  const { to, horseId, ...emailProps } = params

  const html = await render(
    PriceDropAlertEmail({
      ...emailProps,
      horseUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/horses/${horseId}`,
    })
  )

  return await resend!.emails.send({
    from: EMAIL_CONFIG.from,
    to,
    subject: `🔥 Price drop on ${params.horseName}!`,
    html,
  })
}

// Viewing request emails

export async function sendViewingRequestReceivedEmail(params: {
  to: string
  sellerName: string
  buyerName: string
  horseName: string
  requestedDate: string
  requestedTime: string
  message?: string
  phone?: string
  email?: string
  requestId: string
}) {
  if (!isEmailEnabled()) return { error: 'Email not configured' }

  const { to, requestId, sellerName, buyerName, horseName, requestedDate, requestedTime, message, phone, email } = params

  const emailComponent = ViewingRequestReceivedEmail({
    sellerName,
    buyerName,
    horseName,
    requestedDate,
    requestedTime,
    message,
    phone,
    email,
    requestUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/viewing-requests`,
  })

  const html = await render(emailComponent)

  return await resend!.emails.send({
    from: EMAIL_CONFIG.from,
    to,
    subject: `New viewing request for ${params.horseName}`,
    html,
  })
}
