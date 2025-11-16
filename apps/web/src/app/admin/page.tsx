import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminDashboard } from '@/components/admin/admin-dashboard'

export default async function AdminPage() {
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

  // Fetch admin statistics
  const [
    { count: totalUsers },
    { count: totalHorses },
    { count: pendingVerifications },
    { data: recentVerifications },
    { data: recentListings },
    { data: recentUsers }
  ] = await Promise.all([
    // Total users
    supabase.from('profiles').select('*', { count: 'exact', head: true }),

    // Total horses
    supabase.from('horses').select('*', { count: 'exact', head: true }),

    // Pending verifications
    supabase
      .from('seller_verifications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),

    // Recent verification requests - fetch separately to handle the join properly
    supabase
      .from('seller_verifications')
      .select('*')
      .order('submitted_at', { ascending: false })
      .limit(5),

    // Recent listings
    supabase
      .from('horses')
      .select(`
        *,
        profiles (
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5),

    // Recent users (fetch more for the user management panel)
    supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
  ])

  // Fetch user profiles for verifications
  let verificationsWithProfiles = recentVerifications || []
  if (recentVerifications && recentVerifications.length > 0) {
    const userIds = recentVerifications.map(v => v.user_id)
    const { data: userProfiles } = await supabase
      .from('profiles')
      .select('id, name, email')
      .in('id', userIds)

    if (userProfiles) {
      verificationsWithProfiles = recentVerifications.map(verification => {
        const profile = userProfiles.find(p => p.id === verification.user_id)
        return {
          ...verification,
          profiles: profile || { name: 'Unknown', email: 'unknown@email.com' }
        }
      })
    }
  }

  // Fetch owner profiles for listings
  let listingsWithProfiles = recentListings || []
  if (recentListings && recentListings.length > 0) {
    const ownerIds = recentListings.map(l => l.owner_id)
    const { data: ownerProfiles } = await supabase
      .from('profiles')
      .select('id, name, email')
      .in('id', ownerIds)

    if (ownerProfiles) {
      listingsWithProfiles = recentListings.map(listing => {
        const profile = ownerProfiles.find(p => p.id === listing.owner_id)
        return {
          ...listing,
          profiles: profile || { name: 'Unknown', email: 'unknown@email.com' }
        }
      })
    }
  }

  const stats = {
    totalUsers: totalUsers || 0,
    totalHorses: totalHorses || 0,
    pendingVerifications: pendingVerifications || 0,
    totalRevenue: 0 // Would come from payments
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminDashboard
        stats={stats}
        recentVerifications={verificationsWithProfiles}
        recentListings={listingsWithProfiles}
        recentUsers={recentUsers || []}
      />
    </div>
  )
}