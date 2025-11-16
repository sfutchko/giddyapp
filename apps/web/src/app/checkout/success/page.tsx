import { CheckCircle, ArrowRight, FileText, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { STRIPE_CONFIG } from '@/lib/stripe/config'
import { sendPaymentConfirmationEmail } from '@/lib/email/send'

interface SearchParams {
  payment_intent?: string
  horseId?: string
  offerId?: string
}

export default async function CheckoutSuccessPage({
  searchParams
}: {
  searchParams: SearchParams
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Ensure transaction exists (fallback if webhook hasn't fired yet)
  if (searchParams.payment_intent) {

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

    // Check if transaction already exists
    const { data: existingTransaction, error: txCheckError } = await supabaseAdmin
      .from('transactions')
      .select('id')
      .eq('stripe_payment_intent_id', searchParams.payment_intent)
      .single()

    if (!existingTransaction && searchParams.horseId) {

      // Get payment intent metadata
      const { data: paymentIntent, error: piError } = await supabaseAdmin
        .from('payment_intents')
        .select('*')
        .eq('stripe_payment_intent_id', searchParams.payment_intent)
        .single()

      if (paymentIntent) {
        // Create transaction (webhook will update if it fires later)
        const escrowReleaseDate = new Date()
        escrowReleaseDate.setDate(escrowReleaseDate.getDate() + STRIPE_CONFIG.ESCROW_HOLD_DAYS)

        const { data: transaction } = await supabaseAdmin
          .from('transactions')
          .insert({
            horse_id: paymentIntent.horse_id,
            buyer_id: paymentIntent.buyer_id,
            seller_id: paymentIntent.seller_id,
            offer_id: searchParams.offerId || null,
            listing_price_cents: paymentIntent.amount_cents,
            final_price_cents: paymentIntent.amount_cents,
            platform_fee_cents: paymentIntent.platform_fee_cents,
            seller_receives_cents: paymentIntent.seller_amount_cents,
            stripe_payment_intent_id: searchParams.payment_intent,
            status: 'payment_held',
            escrow_release_date: escrowReleaseDate.toISOString(),
          })
          .select()
          .single()

        if (transaction) {
          // Update horse status
          await supabaseAdmin
            .from('horses')
            .update({
              status: 'SOLD',
              sold_price: paymentIntent.amount_cents / 100,
              sold_date: new Date().toISOString(),
            })
            .eq('id', paymentIntent.horse_id)

          // Get horse name for notifications
          const { data: horse } = await supabaseAdmin
            .from('horses')
            .select('name')
            .eq('id', paymentIntent.horse_id)
            .single()

          // Create notifications
          await supabaseAdmin
            .from('notifications')
            .insert([
              {
                user_id: paymentIntent.seller_id,
                type: 'sale_completed',
                title: 'Horse Sold!',
                message: `Your horse ${horse?.name || ''} has been sold. Funds will be released after ${STRIPE_CONFIG.ESCROW_HOLD_DAYS} days.`,
                link: `/transactions/${transaction.id}`,
              },
              {
                user_id: paymentIntent.buyer_id,
                type: 'purchase_completed',
                title: 'Purchase Complete',
                message: `You have successfully purchased ${horse?.name || ''}. The seller has been notified.`,
                link: `/transactions/${transaction.id}`,
              },
            ])

          // Send payment confirmation email
          const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, email')
            .in('id', [paymentIntent.buyer_id, paymentIntent.seller_id])

          const buyerProfile = profiles?.find(p => p.id === paymentIntent.buyer_id)
          const sellerProfile = profiles?.find(p => p.id === paymentIntent.seller_id)

          if (buyerProfile?.email) {
            try {
              await sendPaymentConfirmationEmail({
                to: buyerProfile.email,
                buyerName: buyerProfile.full_name || 'there',
                horseName: horse?.name || 'the horse',
                amount: paymentIntent.amount_cents / 100,
                transactionId: transaction.id,
                sellerName: sellerProfile?.full_name || 'the seller',
              })
            } catch (emailError) {
              console.error('Failed to send payment confirmation email:', emailError)
            }
          }
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>

          <p className="text-lg text-gray-600 mb-8">
            Your purchase has been completed successfully. The seller has been notified and will be in touch soon.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
            <h2 className="font-semibold text-blue-900 mb-3">What Happens Next?</h2>
            <ul className="space-y-3 text-blue-800 text-sm">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-900 flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <span>Your payment is being held securely in escrow for 7 days to protect both parties</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-900 flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <span>The seller will contact you to arrange viewing, pre-purchase exam, and delivery details</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-900 flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <span>After the 7-day escrow period, funds are automatically released to the seller</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-900 flex items-center justify-center text-xs font-bold">
                  4
                </span>
                <span>If there are any issues, contact support before the escrow period ends</span>
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <ArrowRight className="h-5 w-5" />
              Go to Dashboard
            </Link>

            <Link
              href="/messages"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              View Messages
            </Link>

            <Link
              href="/transactions"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileText className="h-5 w-5" />
              View Transactions
            </Link>
          </div>

          <div className="border-t pt-6">
            <p className="text-sm text-gray-600">
              A confirmation email has been sent to your registered email address.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Need help?{' '}
              <Link href="/support" className="text-green-600 hover:text-green-700 font-medium">
                Contact Support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
