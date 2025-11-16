'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { stripe, STRIPE_CONFIG, formatCurrency } from '@/lib/stripe/config'
import { sendEscrowReleasedEmail } from '@/lib/email/send'

interface Transaction {
  id: string
  horse_id: string
  buyer_id: string
  seller_id: string
  final_price_cents: number
  platform_fee_cents: number
  seller_receives_cents: number
  stripe_payment_intent_id: string
  stripe_transfer_id: string | null
  status: string
  escrow_release_date: string
  escrow_released_at: string | null
  created_at: string
}

/**
 * Get user's transactions (buyer or seller)
 */
export async function getUserTransactions(): Promise<{
  success: boolean
  transactions?: any[]
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Fetch transactions without nested joins to avoid schema cache issues
    const { data: transactionsData, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError)
      return { success: false, error: transactionsError.message }
    }

    if (!transactionsData || transactionsData.length === 0) {
      return { success: true, transactions: [] }
    }

    // Manually fetch related data
    const horseIds = transactionsData.map(t => t.horse_id)
    const buyerIds = [...new Set(transactionsData.map(t => t.buyer_id))]
    const sellerIds = [...new Set(transactionsData.map(t => t.seller_id))]

    const [horsesResult, buyersResult, sellersResult] = await Promise.all([
      supabase.from('horses').select('id, name, slug').in('id', horseIds),
      supabase.from('profiles').select('id, name, email').in('id', buyerIds),
      supabase.from('profiles').select('id, name, email').in('id', sellerIds),
    ])

    // Create lookup maps
    const horsesMap = new Map(horsesResult.data?.map(h => [h.id, h]))
    const buyersMap = new Map(buyersResult.data?.map(b => [b.id, b]))
    const sellersMap = new Map(sellersResult.data?.map(s => [s.id, s]))

    // Combine data
    const transactions = transactionsData.map(t => ({
      ...t,
      horses: horsesMap.get(t.horse_id),
      buyer: buyersMap.get(t.buyer_id),
      seller: sellersMap.get(t.seller_id),
    }))

    return { success: true, transactions }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Get single transaction details
 */
export async function getTransaction(transactionId: string): Promise<{
  success: boolean
  transaction?: any
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Fetch transaction without nested joins to avoid schema cache issues
    const { data: transactionData, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .single()

    if (transactionError || !transactionData) {
      console.error('Error fetching transaction:', transactionError)
      return { success: false, error: 'Transaction not found' }
    }

    // Manually fetch related data
    const [horseResult, buyerResult, sellerResult] = await Promise.all([
      supabase.from('horses').select('id, name, slug, breed, age, price').eq('id', transactionData.horse_id).single(),
      supabase.from('profiles').select('id, name, email').eq('id', transactionData.buyer_id).single(),
      supabase.from('profiles').select('id, name, email').eq('id', transactionData.seller_id).single(),
    ])

    // Combine data
    const transaction = {
      ...transactionData,
      horses: horseResult.data,
      buyer: buyerResult.data,
      seller: sellerResult.data,
    }

    return { success: true, transaction }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Release escrow funds to seller (manual release by buyer)
 */
export async function releaseEscrow(transactionId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get transaction
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('buyer_id', user.id) // Only buyer can manually release
      .single()

    if (fetchError || !transaction) {
      return { success: false, error: 'Transaction not found or unauthorized' }
    }

    if (transaction.status !== 'payment_held') {
      return { success: false, error: 'Transaction cannot be released in current status' }
    }

    // Get seller's Stripe account (using admin client to bypass RLS)
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { data: stripeAccount } = await supabaseAdmin
      .from('stripe_accounts')
      .select('stripe_account_id')
      .eq('user_id', transaction.seller_id)
      .single()

    if (!stripeAccount) {
      return { success: false, error: 'Seller payment account not found' }
    }

    // Create transfer to seller
    // Note: In test mode, this may fail with "insufficient funds" because the platform
    // account has $0 balance. In production, funds from payments will be available.
    // Use the "Mark as Completed (Test)" button for testing purposes.
    const transfer = await stripe.transfers.create({
      amount: transaction.seller_receives_cents,
      currency: STRIPE_CONFIG.CURRENCY,
      destination: stripeAccount.stripe_account_id,
      description: `Escrow release for transaction ${transactionId}`,
      metadata: {
        transaction_id: transactionId,
        horse_id: transaction.horse_id,
      },
    })

    // Update transaction
    await supabase
      .from('transactions')
      .update({
        status: 'completed',
        stripe_transfer_id: transfer.id,
        escrow_released_at: new Date().toISOString(),
        escrow_released_by: user.id,
        completed_at: new Date().toISOString(),
      })
      .eq('id', transactionId)

    // Log event
    await supabase
      .from('transaction_events')
      .insert({
        transaction_id: transactionId,
        event_type: 'funds_released',
        previous_status: 'payment_held',
        new_status: 'completed',
        triggered_by: user.id,
        metadata: { transfer_id: transfer.id },
        notes: 'Funds manually released by buyer',
      })

    // Notify seller
    await supabase
      .from('notifications')
      .insert({
        user_id: transaction.seller_id,
        type: 'payment_released',
        title: 'Payment Released',
        message: `Escrow funds have been released. ${formatCurrency(transaction.seller_receives_cents)} is being transferred to your account.`,
        link: `/transactions/${transactionId}`,
      })

    // Send escrow release emails
    const { data: horse } = await supabaseAdmin
      .from('horses')
      .select('name')
      .eq('id', transaction.horse_id)
      .single()

    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email')
      .in('id', [transaction.buyer_id, transaction.seller_id])

    const buyerProfile = profiles?.find(p => p.id === transaction.buyer_id)
    const sellerProfile = profiles?.find(p => p.id === transaction.seller_id)

    // Email seller
    if (sellerProfile?.email) {
      try {
        await sendEscrowReleasedEmail({
          to: sellerProfile.email,
          recipientName: sellerProfile.full_name || 'there',
          recipientType: 'seller',
          horseName: horse?.name || 'the horse',
          amount: transaction.seller_receives_cents / 100,
          transactionId,
        })
      } catch (emailError) {
        console.error('Failed to send escrow released email to seller:', emailError)
      }
    }

    // Email buyer
    if (buyerProfile?.email) {
      try {
        await sendEscrowReleasedEmail({
          to: buyerProfile.email,
          recipientName: buyerProfile.full_name || 'there',
          recipientType: 'buyer',
          horseName: horse?.name || 'the horse',
          amount: transaction.final_price_cents / 100,
          transactionId,
        })
      } catch (emailError) {
        console.error('Failed to send escrow released email to buyer:', emailError)
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error releasing escrow:', error)
    return { success: false, error: error.message || 'Failed to release escrow' }
  }
}

/**
 * Automatically release escrow for transactions past their release date
 * This should be called by a cron job
 */
export async function autoReleaseEscrow(): Promise<{
  success: boolean
  releasedCount?: number
  error?: string
}> {
  try {
    // Use admin client for cron job (no user context)
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Find transactions ready for release
    const { data: transactions } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('status', 'payment_held')
      .lte('escrow_release_date', new Date().toISOString())

    if (!transactions || transactions.length === 0) {
      return { success: true, releasedCount: 0 }
    }

    let releasedCount = 0

    for (const transaction of transactions) {
      try {
        // Get seller's Stripe account (using admin client)
        const { data: stripeAccount } = await supabaseAdmin
          .from('stripe_accounts')
          .select('stripe_account_id')
          .eq('user_id', transaction.seller_id)
          .single()

        if (!stripeAccount) {
          console.error(`No Stripe account for seller ${transaction.seller_id}`)
          continue
        }

        // Get the charge ID from the payment intent
        const paymentIntent = await stripe.paymentIntents.retrieve(transaction.stripe_payment_intent_id)
        const chargeId = paymentIntent.latest_charge as string

        if (!chargeId) {
          console.error(`No charge found for transaction ${transaction.id}`)
          continue
        }

        // Create transfer
        const transfer = await stripe.transfers.create({
          amount: transaction.seller_receives_cents,
          currency: STRIPE_CONFIG.CURRENCY,
          destination: stripeAccount.stripe_account_id,
          source_transaction: chargeId,
          description: `Auto escrow release for transaction ${transaction.id}`,
          metadata: {
            transaction_id: transaction.id,
            horse_id: transaction.horse_id,
          },
        })

        // Update transaction
        await supabaseAdmin
          .from('transactions')
          .update({
            status: 'completed',
            stripe_transfer_id: transfer.id,
            escrow_released_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
          })
          .eq('id', transaction.id)

        // Log event
        await supabaseAdmin
          .from('transaction_events')
          .insert({
            transaction_id: transaction.id,
            event_type: 'funds_released',
            previous_status: 'payment_held',
            new_status: 'completed',
            metadata: { transfer_id: transfer.id, auto_release: true },
            notes: 'Funds automatically released after escrow period',
          })

        // Notify seller
        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: transaction.seller_id,
            type: 'payment_released',
            title: 'Payment Released',
            message: `Escrow period complete. ${formatCurrency(transaction.seller_receives_cents)} is being transferred to your account.`,
            link: `/transactions/${transaction.id}`,
          })

        releasedCount++
      } catch (error) {
        console.error(`Error releasing transaction ${transaction.id}:`, error)
        // Continue with next transaction
      }
    }

    return { success: true, releasedCount }
  } catch (error: any) {
    console.error('Error in auto release:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Manually mark transaction as completed (for testing/admin purposes)
 * Use this for transactions where funds were already transferred via old payment flow
 */
export async function manuallyCompleteTransaction(transactionId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get transaction
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('buyer_id', user.id) // Only buyer can manually complete
      .single()

    if (fetchError || !transaction) {
      return { success: false, error: 'Transaction not found or unauthorized' }
    }

    if (transaction.status !== 'payment_held') {
      return { success: false, error: 'Transaction cannot be completed in current status' }
    }

    // Use admin client for updates to bypass RLS
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Update transaction status to completed
    const { error: updateError } = await supabaseAdmin
      .from('transactions')
      .update({
        status: 'completed',
        escrow_released_at: new Date().toISOString(),
        escrow_released_by: user.id,
        completed_at: new Date().toISOString(),
      })
      .eq('id', transactionId)

    if (updateError) {
      console.error('Error updating transaction:', updateError)
      return { success: false, error: updateError.message }
    }

    // Log event
    await supabaseAdmin
      .from('transaction_events')
      .insert({
        transaction_id: transactionId,
        event_type: 'manually_completed',
        previous_status: 'payment_held',
        new_status: 'completed',
        triggered_by: user.id,
        notes: 'Transaction manually marked as completed (test/legacy transaction)',
      })

    // Notify seller
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: transaction.seller_id,
        type: 'payment_released',
        title: 'Transaction Completed',
        message: `Transaction has been completed.`,
        link: `/transactions/${transactionId}`,
      })

    return { success: true }
  } catch (error: any) {
    console.error('Error manually completing transaction:', error)
    return { success: false, error: error.message || 'Failed to complete transaction' }
  }
}

/**
 * Request refund for a transaction (buyer or seller can request)
 */
export async function requestRefund(
  transactionId: string,
  reason: string,
  amount?: number // Optional partial refund amount in cents
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get transaction
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .single()

    if (fetchError || !transaction) {
      return { success: false, error: 'Transaction not found or unauthorized' }
    }

    // Only allow refunds for payment_held or completed status
    if (!['payment_held', 'completed'].includes(transaction.status)) {
      return { success: false, error: 'Refunds can only be requested for held or completed transactions' }
    }

    // Create refund request record
    await supabase
      .from('refund_requests')
      .insert({
        transaction_id: transactionId,
        requested_by: user.id,
        reason,
        amount_cents: amount || transaction.final_price_cents,
        status: 'pending',
      })

    // Log event
    await supabase
      .from('transaction_events')
      .insert({
        transaction_id: transactionId,
        event_type: 'refund_requested',
        previous_status: transaction.status,
        new_status: transaction.status,
        triggered_by: user.id,
        notes: reason,
        amount_cents: amount || transaction.final_price_cents,
      })

    // Notify the other party
    const otherPartyId = user.id === transaction.buyer_id ? transaction.seller_id : transaction.buyer_id
    const isFullRefund = !amount || amount === transaction.final_price_cents

    await supabase
      .from('notifications')
      .insert({
        user_id: otherPartyId,
        type: 'refund_requested',
        title: 'Refund Requested',
        message: `A ${isFullRefund ? 'full' : 'partial'} refund has been requested for transaction. Reason: ${reason}`,
        link: `/transactions/${transactionId}`,
      })

    return { success: true }
  } catch (error: any) {
    console.error('Error requesting refund:', error)
    return { success: false, error: error.message || 'Failed to request refund' }
  }
}

/**
 * Process refund for a transaction (admin action)
 */
export async function processRefund(
  transactionId: string,
  amountCents?: number
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get transaction
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single()

    if (fetchError || !transaction) {
      return { success: false, error: 'Transaction not found' }
    }

    // Verify user is authorized (buyer or admin)
    if (transaction.buyer_id !== user.id) {
      return { success: false, error: 'Only buyer can process refunds' }
    }

    const refundAmount = amountCents || transaction.final_price_cents
    const isPartialRefund = refundAmount < transaction.final_price_cents

    // Create Stripe refund
    const refund = await stripe.refunds.create({
      payment_intent: transaction.stripe_payment_intent_id,
      amount: refundAmount,
      reason: 'requested_by_customer',
      metadata: {
        transaction_id: transactionId,
        horse_id: transaction.horse_id,
      },
    })

    // Update transaction status
    const newStatus = isPartialRefund ? 'partially_refunded' : 'refunded'
    await supabase
      .from('transactions')
      .update({
        status: newStatus,
        refunded_amount_cents: refundAmount,
        refunded_at: new Date().toISOString(),
      })
      .eq('id', transactionId)

    // Update refund request if exists
    await supabase
      .from('refund_requests')
      .update({
        status: 'approved',
        processed_at: new Date().toISOString(),
        processed_by: user.id,
      })
      .eq('transaction_id', transactionId)
      .eq('status', 'pending')

    // Log event
    await supabase
      .from('transaction_events')
      .insert({
        transaction_id: transactionId,
        event_type: isPartialRefund ? 'partial_refund_completed' : 'refund_completed',
        previous_status: transaction.status,
        new_status: newStatus,
        triggered_by: user.id,
        amount_cents: refundAmount,
        metadata: { refund_id: refund.id },
        notes: `Refund of ${formatCurrency(refundAmount)} processed`,
      })

    // Notify both parties
    await supabase
      .from('notifications')
      .insert([
        {
          user_id: transaction.buyer_id,
          type: 'refund_processed',
          title: 'Refund Processed',
          message: `Your refund of ${formatCurrency(refundAmount)} has been processed and will appear in your account within 5-10 business days.`,
          link: `/transactions/${transactionId}`,
        },
        {
          user_id: transaction.seller_id,
          type: 'refund_processed',
          title: 'Refund Issued',
          message: `A refund of ${formatCurrency(refundAmount)} has been issued for this transaction.`,
          link: `/transactions/${transactionId}`,
        },
      ])

    return { success: true }
  } catch (error: any) {
    console.error('Error processing refund:', error)
    return { success: false, error: error.message || 'Failed to process refund' }
  }
}

/**
 * Get transaction events/history
 */
export async function getTransactionEvents(transactionId: string): Promise<{
  success: boolean
  events?: any[]
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify user has access to this transaction
    const { data: transaction } = await supabase
      .from('transactions')
      .select('buyer_id, seller_id')
      .eq('id', transactionId)
      .single()

    if (!transaction || (transaction.buyer_id !== user.id && transaction.seller_id !== user.id)) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data: events, error } = await supabase
      .from('transaction_events')
      .select('*')
      .eq('transaction_id', transactionId)
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, events }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Get refund requests for a transaction
 */
export async function getRefundRequests(transactionId: string): Promise<{
  success: boolean
  requests?: any[]
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get transaction to verify user has access
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('buyer_id, seller_id')
      .eq('id', transactionId)
      .single()

    if (txError || !transaction) {
      return { success: false, error: 'Transaction not found' }
    }

    // Verify user is buyer or seller
    if (transaction.buyer_id !== user.id && transaction.seller_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Fetch refund requests
    const { data: requests, error } = await supabase
      .from('refund_requests')
      .select(`
        id,
        transaction_id,
        requested_by,
        reason,
        amount_cents,
        status,
        created_at,
        updated_at,
        requester:requested_by(id, name, email)
      `)
      .eq('transaction_id', transactionId)
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, requests }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
