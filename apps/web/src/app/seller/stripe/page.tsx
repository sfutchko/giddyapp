import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StripeConnectSetup } from '@/components/seller/stripe-connect-setup'

export default async function StripeSetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/seller/stripe')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <StripeConnectSetup />
      </div>
    </div>
  )
}
