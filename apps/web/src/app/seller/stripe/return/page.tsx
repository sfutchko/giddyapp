import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { syncStripeAccountStatus } from '@/lib/actions/stripe-connect'
import { CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default async function StripeReturnPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Sync the account status after onboarding
  await syncStripeAccountStatus()

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Setup Complete!
          </h1>

          <p className="text-lg text-gray-600 mb-8">
            Your Stripe Connect account has been successfully configured. You can now receive payments for your horse sales.
          </p>

          <div className="space-y-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              Go to Dashboard
              <ArrowRight className="h-5 w-5" />
            </Link>

            <div className="mt-4">
              <Link
                href="/seller/stripe"
                className="text-green-600 hover:text-green-700 font-medium"
              >
                View Payment Settings
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="font-semibold text-blue-900 mb-2">What's Next?</h2>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li>• You can now accept payments for your horse listings</li>
            <li>• Funds will be held securely for 7 days after each sale</li>
            <li>• Platform fee is 5% + Stripe processing fees (2.9% + $0.30)</li>
            <li>• Access your Stripe Dashboard anytime from payment settings</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
