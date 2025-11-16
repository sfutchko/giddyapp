'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface BlockedUser {
  id: string
  blocker_id: string
  blocked_id: string
  reason?: string | null
  created_at: string
  blocked_profile?: {
    id: string
    name?: string | null
    full_name?: string | null
    avatar_url?: string | null
  }
}

/**
 * Get all users blocked by the current user
 */
export async function getBlockedUsers() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('blocked_users')
    .select(`
      *,
      blocked_profile:profiles!blocked_users_blocked_id_fkey(
        id,
        name,
        full_name,
        avatar_url
      )
    `)
    .eq('blocker_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching blocked users:', error)
    return { error: 'Failed to fetch blocked users' }
  }

  return { blockedUsers: data as BlockedUser[] }
}

/**
 * Check if a user is blocked by the current user
 */
export async function isUserBlocked(userId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { isBlocked: false }
  }

  const { data, error } = await supabase
    .from('blocked_users')
    .select('id')
    .eq('blocker_id', user.id)
    .eq('blocked_id', userId)
    .single()

  return { isBlocked: !!data }
}

/**
 * Check if current user is blocked by another user
 */
export async function isBlockedBy(userId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { isBlocked: false }
  }

  const { data, error } = await supabase
    .from('blocked_users')
    .select('id')
    .eq('blocker_id', userId)
    .eq('blocked_id', user.id)
    .single()

  return { isBlocked: !!data }
}

/**
 * Block a user
 */
export async function blockUser(userId: string, reason?: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  if (user.id === userId) {
    return { error: 'Cannot block yourself' }
  }

  // Check if already blocked
  const { isBlocked } = await isUserBlocked(userId)
  if (isBlocked) {
    return { error: 'User is already blocked' }
  }

  const { data, error } = await supabase
    .from('blocked_users')
    .insert({
      blocker_id: user.id,
      blocked_id: userId,
      reason: reason || null
    })
    .select()
    .single()

  if (error) {
    console.error('Error blocking user:', error)
    return { error: 'Failed to block user' }
  }

  // Revalidate relevant paths
  revalidatePath('/messages')
  revalidatePath('/settings/blocked-users')

  return { success: true, block: data }
}

/**
 * Unblock a user
 */
export async function unblockUser(userId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('blocked_users')
    .delete()
    .eq('blocker_id', user.id)
    .eq('blocked_id', userId)

  if (error) {
    console.error('Error unblocking user:', error)
    return { error: 'Failed to unblock user' }
  }

  // Revalidate relevant paths
  revalidatePath('/messages')
  revalidatePath('/settings/blocked-users')

  return { success: true }
}

/**
 * Get list of user IDs blocked by current user (for filtering)
 */
export async function getBlockedUserIds() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { blockedIds: [] }
  }

  const { data, error } = await supabase
    .from('blocked_users')
    .select('blocked_id')
    .eq('blocker_id', user.id)

  if (error) {
    console.error('Error fetching blocked user IDs:', error)
    return { blockedIds: [] }
  }

  return { blockedIds: data.map(b => b.blocked_id) }
}

/**
 * Get list of user IDs that have blocked current user (for filtering)
 */
export async function getUsersWhoBlockedMe() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { blockerIds: [] }
  }

  const { data, error } = await supabase
    .from('blocked_users')
    .select('blocker_id')
    .eq('blocked_id', user.id)

  if (error) {
    console.error('Error fetching users who blocked me:', error)
    return { blockerIds: [] }
  }

  return { blockerIds: data.map(b => b.blocker_id) }
}
