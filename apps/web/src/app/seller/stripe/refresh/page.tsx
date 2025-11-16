import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function StripeRefreshPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Redirect back to setup page if they need to retry onboarding
  redirect('/seller/stripe')
}
