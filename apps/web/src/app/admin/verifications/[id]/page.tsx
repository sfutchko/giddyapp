import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { VerificationReview } from '@/components/admin/verification-review'

export default async function VerificationReviewPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    redirect('/') // Not authorized
  }

  // Fetch verification details
  const { data: verification, error } = await supabase
    .from('seller_verifications')
    .select(`
      *,
      verification_documents (
        id,
        type,
        url,
        name,
        uploaded_at
      )
    `)
    .eq('id', id)
    .single()

  if (error || !verification) {
    notFound()
  }

  // Fetch user profile separately
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('id, name, email, created_at')
    .eq('id', verification.user_id)
    .single()

  // Attach profile to verification
  const verificationWithProfile = {
    ...verification,
    profiles: userProfile || { id: verification.user_id, name: 'Unknown', email: 'unknown@email.com', created_at: new Date().toISOString() }
  }

  // Fetch user's listing history
  const { data: listings } = await supabase
    .from('horses')
    .select('id, name, created_at, status')
    .eq('owner_id', verification.user_id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Fetch previous verification attempts
  const { data: previousAttempts } = await supabase
    .from('seller_verifications')
    .select('id, status, submitted_at, reviewed_at, rejection_reason')
    .eq('user_id', verification.user_id)
    .neq('id', id)
    .order('submitted_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-100">
      <VerificationReview
        verification={verificationWithProfile}
        listings={listings || []}
        previousAttempts={previousAttempts || []}
        adminId={user.id}
      />
    </div>
  )
}