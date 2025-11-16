'use server'

import { createClient } from '@/lib/supabase/server'
import { stripe, STRIPE_CONFIG } from '@/lib/stripe/config'
import { redirect } from 'next/navigation'

interface StripeAccount {
  id: string
  user_id: string
  stripe_account_id: string
  account_type: string
  charges_enabled: boolean
  payouts_enabled: boolean
  details_submitted: boolean
  country: string | null
  default_currency: string
  email: string | null
}

/**
 * Get or create Stripe Connect account for seller
 */
export async function getOrCreateStripeAccount(): Promise<{
  success: boolean
  account?: StripeAccount
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Check if account already exists
    const { data: existingAccount, error: fetchError } = await supabase
      .from('stripe_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (existingAccount && !fetchError) {
      return { success: true, account: existingAccount }
    }

    // Get user profile for email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('id', user.id)
      .single()

    // Create new Stripe Connect account
    const account = await stripe.accounts.create({
      type: STRIPE_CONFIG.CONNECT_ACCOUNT_TYPE,
      country: 'US',
      email: profile?.email || user.email || undefined,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
    })

    // Store in database
    const { data: newAccount, error: insertError } = await supabase
      .from('stripe_accounts')
      .insert({
        user_id: user.id,
        stripe_account_id: account.id,
        account_type: STRIPE_CONFIG.CONNECT_ACCOUNT_TYPE,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted || false,
        country: account.country || null,
        default_currency: account.default_currency || STRIPE_CONFIG.CURRENCY,
        email: account.email || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error storing Stripe account:', insertError)
      return { success: false, error: 'Failed to store account information' }
    }

    return { success: true, account: newAccount }
  } catch (error: any) {
    console.error('Error creating Stripe account:', error)
    return { success: false, error: error.message || 'Failed to create Stripe account' }
  }
}

/**
 * Create Stripe Connect onboarding link
 */
export async function createConnectOnboardingLink(): Promise<{
  success: boolean
  url?: string
  error?: string
}> {
  try {
    const accountResult = await getOrCreateStripeAccount()

    if (!accountResult.success || !accountResult.account) {
      return { success: false, error: accountResult.error }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const accountLink = await stripe.accountLinks.create({
      account: accountResult.account.stripe_account_id,
      refresh_url: `${baseUrl}/seller/stripe/refresh`,
      return_url: `${baseUrl}/seller/stripe/return`,
      type: 'account_onboarding',
    })

    return { success: true, url: accountLink.url }
  } catch (error: any) {
    console.error('Error creating onboarding link:', error)
    return { success: false, error: error.message || 'Failed to create onboarding link' }
  }
}

/**
 * Create Stripe Connect dashboard link for existing account
 */
export async function createConnectDashboardLink(): Promise<{
  success: boolean
  url?: string
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: account } = await supabase
      .from('stripe_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!account) {
      return { success: false, error: 'No Stripe account found' }
    }

    const loginLink = await stripe.accounts.createLoginLink(account.stripe_account_id)

    return { success: true, url: loginLink.url }
  } catch (error: any) {
    console.error('Error creating dashboard link:', error)
    return { success: false, error: error.message || 'Failed to create dashboard link' }
  }
}

/**
 * Update Stripe account status from Stripe API
 */
export async function syncStripeAccountStatus(): Promise<{
  success: boolean
  account?: StripeAccount
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: account } = await supabase
      .from('stripe_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!account) {
      return { success: false, error: 'No Stripe account found' }
    }

    // Fetch latest status from Stripe
    const stripeAccount = await stripe.accounts.retrieve(account.stripe_account_id)

    // Update database
    const { data: updatedAccount, error: updateError } = await supabase
      .from('stripe_accounts')
      .update({
        charges_enabled: stripeAccount.charges_enabled,
        payouts_enabled: stripeAccount.payouts_enabled,
        details_submitted: stripeAccount.details_submitted || false,
        country: stripeAccount.country || null,
        email: stripeAccount.email || null,
      })
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      return { success: false, error: 'Failed to update account status' }
    }

    return { success: true, account: updatedAccount }
  } catch (error: any) {
    console.error('Error syncing Stripe account:', error)
    return { success: false, error: error.message || 'Failed to sync account' }
  }
}

/**
 * Check if user can receive payments
 */
export async function canReceivePayments(): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return false

    const { data: account } = await supabase
      .from('stripe_accounts')
      .select('charges_enabled, payouts_enabled, details_submitted')
      .eq('user_id', user.id)
      .single()

    if (!account) return false

    return account.charges_enabled && account.payouts_enabled && account.details_submitted
  } catch (error) {
    console.error('Error checking payment capability:', error)
    return false
  }
}

/**
 * Get Stripe account for user
 */
export async function getStripeAccount(): Promise<{
  success: boolean
  account?: StripeAccount
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: account, error: fetchError } = await supabase
      .from('stripe_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (fetchError || !account) {
      return { success: false, error: 'No Stripe account found' }
    }

    return { success: true, account }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch account' }
  }
}
