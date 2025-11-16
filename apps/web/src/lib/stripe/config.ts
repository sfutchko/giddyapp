import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

export const STRIPE_CONFIG = {
  // Platform fee percentage (5%)
  PLATFORM_FEE_PERCENTAGE: 5.0,

  // Stripe processing fees
  STRIPE_FEE_PERCENTAGE: 2.9,
  STRIPE_FEE_FIXED_CENTS: 30,

  // Escrow hold period (days)
  ESCROW_HOLD_DAYS: 7,

  // Currency
  CURRENCY: 'usd' as const,

  // Connect account type
  CONNECT_ACCOUNT_TYPE: 'express' as const,
} as const

/**
 * Calculate platform fee, Stripe fees, and seller amount
 * All calculations use integers (cents) to avoid floating point issues
 */
export function calculateFees(amountCents: number): {
  amountCents: number
  platformFeeCents: number
  stripeFeeCents: number
  totalFeesCents: number
  sellerReceivesCents: number
  platformNetCents: number
} {
  // Validate input
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error('Amount must be a positive integer representing cents')
  }

  // Calculate Stripe fee: (amount * 2.9%) + $0.30
  // Stripe charges on the total amount
  const stripeFeeCents = Math.round((amountCents * STRIPE_CONFIG.STRIPE_FEE_PERCENTAGE) / 100) + STRIPE_CONFIG.STRIPE_FEE_FIXED_CENTS

  // Calculate platform fee: amount * 5%
  const platformFeeCents = Math.round((amountCents * STRIPE_CONFIG.PLATFORM_FEE_PERCENTAGE) / 100)

  // Total fees
  const totalFeesCents = platformFeeCents + stripeFeeCents

  // Amount seller receives
  const sellerReceivesCents = amountCents - totalFeesCents

  // Platform net (platform fee minus Stripe fees)
  const platformNetCents = platformFeeCents - stripeFeeCents

  return {
    amountCents,
    platformFeeCents,
    stripeFeeCents,
    totalFeesCents,
    sellerReceivesCents,
    platformNetCents,
  }
}

/**
 * Format cents to dollar string
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

/**
 * Convert dollars to cents (safely handles decimals)
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100)
}

/**
 * Convert cents to dollars
 */
export function centsToDollars(cents: number): number {
  return cents / 100
}
