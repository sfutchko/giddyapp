import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { VerificationCenter } from '@/components/verification/verification-center'

export default async function VerificationPage() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch existing verification request if any
  const { data: verification } = await supabase
    .from('seller_verifications')
    .select(`
      *,
      verification_documents (*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Check if user already has verified status
  const isAlreadyVerified = profile?.seller_verified === true

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <VerificationCenter
          user={user}
          profile={profile}
          verification={verification}
          isAlreadyVerified={isAlreadyVerified}
        />
      </div>
    </div>
  )
}