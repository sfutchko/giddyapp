import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe, STRIPE_CONFIG } from '@/lib/stripe/config'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature found' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentSuccess(supabase, paymentIntent)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentFailed(supabase, paymentIntent)
        break
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        await handleAccountUpdate(supabase, account)
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        await handleRefund(supabase, charge)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentSuccess(supabase: any, paymentIntent: Stripe.PaymentIntent) {
  const metadata = paymentIntent.metadata

  // Update payment intent status
  await supabase
    .from('payment_intents')
    .update({ status: 'succeeded' })
    .eq('stripe_payment_intent_id', paymentIntent.id)

  // Create transaction record
  const escrowReleaseDate = new Date()
  escrowReleaseDate.setDate(escrowReleaseDate.getDate() + STRIPE_CONFIG.ESCROW_HOLD_DAYS)

  const { data: transaction } = await supabase
    .from('transactions')
    .insert({
      horse_id: metadata.horse_id,
      buyer_id: metadata.buyer_id,
      seller_id: metadata.seller_id,
      offer_id: metadata.offer_id || null,
      listing_price_cents: parseInt(metadata.listing_price_cents),
      final_price_cents: parseInt(metadata.final_price_cents),
      platform_fee_cents: parseInt(metadata.platform_fee_cents),
      seller_receives_cents: parseInt(metadata.seller_receives_cents),
      stripe_payment_intent_id: paymentIntent.id,
      status: 'payment_held',
      escrow_release_date: escrowReleaseDate.toISOString(),
    })
    .select()
    .single()

  if (transaction) {
    // Log transaction event
    await supabase
      .from('transaction_events')
      .insert({
        transaction_id: transaction.id,
        event_type: 'payment_succeeded',
        previous_status: 'pending',
        new_status: 'payment_held',
        triggered_by: metadata.buyer_id,
        metadata: { payment_intent_id: paymentIntent.id },
        notes: 'Payment successfully processed and funds held in escrow',
      })

    // Update horse status to SOLD
    await supabase
      .from('horses')
      .update({
        status: 'SOLD',
        sold_price: parseInt(metadata.final_price_cents) / 100,
        sold_date: new Date().toISOString(),
      })
      .eq('id', metadata.horse_id)

    // Reject other pending offers for this horse
    if (metadata.offer_id) {
      await supabase
        .from('offers')
        .update({ status: 'rejected' })
        .eq('horse_id', metadata.horse_id)
        .eq('status', 'pending')
        .neq('id', metadata.offer_id)
    }

    // Create notifications
    await supabase
      .from('notifications')
      .insert([
        {
          user_id: metadata.seller_id,
          type: 'sale_completed',
          title: 'Horse Sold!',
          message: `Your horse ${metadata.horse_name} has been sold. Funds will be released after ${STRIPE_CONFIG.ESCROW_HOLD_DAYS} days.`,
          link: `/transactions/${transaction.id}`,
        },
        {
          user_id: metadata.buyer_id,
          type: 'purchase_completed',
          title: 'Purchase Complete',
          message: `You have successfully purchased ${metadata.horse_name}. The seller has been notified.`,
          link: `/transactions/${transaction.id}`,
        },
      ])
  }

  console.log('Payment succeeded:', paymentIntent.id)
}

async function handlePaymentFailed(supabase: any, paymentIntent: Stripe.PaymentIntent) {
  await supabase
    .from('payment_intents')
    .update({ status: 'failed' })
    .eq('stripe_payment_intent_id', paymentIntent.id)

  console.log('Payment failed:', paymentIntent.id)
}

async function handleAccountUpdate(supabase: any, account: Stripe.Account) {
  await supabase
    .from('stripe_accounts')
    .update({
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted || false,
    })
    .eq('stripe_account_id', account.id)

  console.log('Account updated:', account.id)
}

async function handleRefund(supabase: any, charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string

  // Find transaction
  const { data: transaction } = await supabase
    .from('transactions')
    .select('*')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .single()

  if (transaction) {
    const refundAmountCents = charge.amount_refunded

    // Update transaction status
    const newStatus = refundAmountCents === charge.amount ? 'refunded' : 'partially_refunded'

    await supabase
      .from('transactions')
      .update({ status: newStatus })
      .eq('id', transaction.id)

    // Log event
    await supabase
      .from('transaction_events')
      .insert({
        transaction_id: transaction.id,
        event_type: 'refund_completed',
        previous_status: transaction.status,
        new_status: newStatus,
        amount_cents: refundAmountCents,
        metadata: { charge_id: charge.id },
        notes: `Refund of $${(refundAmountCents / 100).toFixed(2)} processed`,
      })

    // If fully refunded, reactivate the horse
    if (newStatus === 'refunded') {
      await supabase
        .from('horses')
        .update({ status: 'ACTIVE' })
        .eq('id', transaction.horse_id)
    }
  }

  console.log('Refund processed:', charge.id)
}
