import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { stripe, calculateFees, STRIPE_CONFIG } from '@/lib/stripe/config'

export async function POST(request: NextRequest) {
  try {
    // Regular client for user auth (with cookies)
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Service role client for querying seller's Stripe account (bypasses RLS)
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

    const body = await request.json()
    const { horseId, offerId } = body

    if (!horseId) {
      return NextResponse.json(
        { error: 'Horse ID is required' },
        { status: 400 }
      )
    }

    // Get horse details
    const { data: horse, error: horseError } = await supabase
      .from('horses')
      .select('id, price, seller_id, name, status')
      .eq('id', horseId)
      .single()

    if (horseError || !horse) {
      return NextResponse.json(
        { error: 'Horse not found' },
        { status: 404 }
      )
    }

    // Allow ACTIVE or PENDING (PENDING means offer was accepted, awaiting payment)
    if (horse.status !== 'ACTIVE' && horse.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Horse is no longer available' },
        { status: 400 }
      )
    }

    // Prevent seller from buying their own horse
    if (horse.seller_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot purchase your own listing' },
        { status: 400 }
      )
    }

    // Determine final price (from offer or listing price)
    let finalPriceCents: number
    if (offerId) {
      const { data: offer } = await supabase
        .from('offers')
        .select('offer_amount, status')
        .eq('id', offerId)
        .eq('status', 'accepted')
        .single()

      if (!offer) {
        return NextResponse.json(
          { error: 'Invalid or non-accepted offer' },
          { status: 400 }
        )
      }
      finalPriceCents = Math.round(offer.offer_amount * 100)
    } else {
      finalPriceCents = Math.round(horse.price * 100)
    }

    // Calculate fees
    const fees = calculateFees(finalPriceCents)

    // Get seller's Stripe account (using admin client to bypass RLS)
    const { data: stripeAccount, error: stripeAccountError } = await supabaseAdmin
      .from('stripe_accounts')
      .select('stripe_account_id, charges_enabled, payouts_enabled, details_submitted')
      .eq('user_id', horse.seller_id)
      .single()

    if (!stripeAccount || !stripeAccount.charges_enabled || !stripeAccount.payouts_enabled) {
      console.error('Payment setup incomplete:', stripeAccount)
      return NextResponse.json(
        { error: 'Seller has not completed payment setup' },
        { status: 400 }
      )
    }

    // Create Payment Intent for escrow (destination charge without immediate transfer)
    // Funds go to platform account and will be manually transferred to seller after escrow period
    const paymentIntent = await stripe.paymentIntents.create({
      amount: fees.amountCents,
      currency: STRIPE_CONFIG.CURRENCY,
      // Don't include transfer_data - we'll manually transfer during escrow release
      // This keeps funds on the platform account for the escrow period
      metadata: {
        horse_id: horseId,
        horse_name: horse.name,
        buyer_id: user.id,
        seller_id: horse.seller_id,
        seller_stripe_account: stripeAccount.stripe_account_id,
        offer_id: offerId || '',
        listing_price_cents: Math.round(horse.price * 100).toString(),
        final_price_cents: finalPriceCents.toString(),
        platform_fee_cents: fees.platformFeeCents.toString(),
        seller_receives_cents: fees.sellerReceivesCents.toString(),
      },
      description: `Purchase of ${horse.name} (Escrow)`,
    })

    // Store payment intent in database (using admin client to bypass RLS)
    const { error: insertError } = await supabaseAdmin
      .from('payment_intents')
      .insert({
        stripe_payment_intent_id: paymentIntent.id,
        horse_id: horseId,
        buyer_id: user.id,
        seller_id: horse.seller_id,
        amount_cents: fees.amountCents,
        platform_fee_cents: fees.platformFeeCents,
        seller_amount_cents: fees.sellerReceivesCents,
        currency: STRIPE_CONFIG.CURRENCY,
        status: paymentIntent.status,
        client_secret: paymentIntent.client_secret,
      })

    if (insertError) {
      console.error('Error storing payment intent:', insertError)
      // Continue anyway, payment intent is created
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: fees.amountCents,
      platformFee: fees.platformFeeCents,
      sellerReceives: fees.sellerReceivesCents,
    })
  } catch (error: any) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
