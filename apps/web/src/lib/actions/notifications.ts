'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type NotificationType =
  | 'message'
  | 'offer'
  | 'offer_accepted'
  | 'offer_rejected'
  | 'offer_countered'
  | 'price_change'
  | 'listing_sold'
  | 'listing_expired'
  | 'viewing_request'
  | 'viewing_approved'
  | 'viewing_declined'
  | 'review'
  | 'system'
  | 'favorite_listing_update'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  horse_id?: string | null
  offer_id?: string | null
  message_id?: string | null
  viewing_request_id?: string | null
  metadata?: Record<string, any>
  action_url?: string | null
  is_read: boolean
  is_archived: boolean
  read_at?: string | null
  sent_via_email: boolean
  sent_via_push: boolean
  email_sent_at?: string | null
  push_sent_at?: string | null
  created_at: string
  // Relations
  horse?: {
    id: string
    name: string
    slug: string
    price: number
    horse_images?: Array<{ url: string; is_primary: boolean }>
  }
}

export interface NotificationPreferences {
  id: string
  user_id: string
  // In-app
  in_app_messages: boolean
  in_app_offers: boolean
  in_app_viewing_requests: boolean
  in_app_price_changes: boolean
  in_app_reviews: boolean
  in_app_system: boolean
  // Email
  email_messages: boolean
  email_offers: boolean
  email_viewing_requests: boolean
  email_price_changes: boolean
  email_reviews: boolean
  email_system: boolean
  email_marketing: boolean
  // Push
  push_messages: boolean
  push_offers: boolean
  push_viewing_requests: boolean
  push_price_changes: boolean
  push_reviews: boolean
  // Digest
  email_digest_frequency: 'instant' | 'daily' | 'weekly' | 'never'
  // Quiet hours
  quiet_hours_enabled: boolean
  quiet_hours_start?: string | null
  quiet_hours_end?: string | null
  quiet_hours_timezone: string
  created_at: string
  updated_at: string
}

/**
 * Get notifications for current user
 */
export async function getNotifications(options?: {
  unreadOnly?: boolean
  limit?: number
  type?: NotificationType
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  let query = supabase
    .from('notifications')
    .select(`
      *,
      horse:horses(id, name, slug, price, horse_images(url, is_primary))
    `)
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  if (options?.unreadOnly) {
    query = query.eq('is_read', false)
  }

  if (options?.type) {
    query = query.eq('type', options.type)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching notifications:', error)
    return { error: 'Failed to fetch notifications' }
  }

  return { notifications: data as Notification[] }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { count: 0 }
  }

  const { data, error } = await supabase
    .rpc('get_unread_notification_count', { p_user_id: user.id })

  if (error) {
    console.error('Error fetching unread count:', error)
    return { count: 0 }
  }

  return { count: data || 0 }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error marking notification as read:', error)
    return { error: 'Failed to mark notification as read' }
  }

  revalidatePath('/notifications')
  return { success: true }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .rpc('mark_all_notifications_read', { p_user_id: user.id })

  if (error) {
    console.error('Error marking all notifications as read:', error)
    return { error: 'Failed to mark all notifications as read' }
  }

  revalidatePath('/notifications')
  return { success: true, count: data || 0 }
}

/**
 * Archive notification
 */
export async function archiveNotification(notificationId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_archived: true })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error archiving notification:', error)
    return { error: 'Failed to archive notification' }
  }

  revalidatePath('/notifications')
  return { success: true }
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting notification:', error)
    return { error: 'Failed to delete notification' }
  }

  revalidatePath('/notifications')
  return { success: true }
}

/**
 * Get notification preferences
 */
export async function getNotificationPreferences() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) {
    // If preferences don't exist, create default ones
    if (error.code === 'PGRST116') {
      const { data: newPrefs, error: createError } = await supabase
        .from('notification_preferences')
        .insert({ user_id: user.id })
        .select()
        .single()

      if (createError) {
        console.error('Error creating notification preferences:', createError)
        return { error: 'Failed to create notification preferences' }
      }

      return { preferences: newPrefs as NotificationPreferences }
    }

    console.error('Error fetching notification preferences:', error)
    return { error: 'Failed to fetch notification preferences' }
  }

  return { preferences: data as NotificationPreferences }
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  preferences: Partial<Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('notification_preferences')
    .update(preferences)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating notification preferences:', error)
    return { error: 'Failed to update notification preferences' }
  }

  revalidatePath('/notifications/preferences')
  return { success: true, preferences: data as NotificationPreferences }
}

/**
 * Mark notifications as read by type
 */
export async function markNotificationsByTypeAsRead(types: NotificationType[]) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('is_read', false)
    .in('type', types)

  if (error) {
    console.error('Error marking notifications as read by type:', error)
    return { error: 'Failed to mark notifications as read' }
  }

  revalidatePath('/notifications')
  return { success: true }
}

/**
 * Create a notification (system use)
 */
export async function createNotification(params: {
  userId: string
  type: NotificationType
  title: string
  message: string
  horseId?: string
  offerId?: string
  messageId?: string
  viewingRequestId?: string
  actionUrl?: string
  metadata?: Record<string, any>
}) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .rpc('create_notification', {
      p_user_id: params.userId,
      p_type: params.type,
      p_title: params.title,
      p_message: params.message,
      p_horse_id: params.horseId || null,
      p_offer_id: params.offerId || null,
      p_message_id: params.messageId || null,
      p_viewing_request_id: params.viewingRequestId || null,
      p_action_url: params.actionUrl || null,
      p_metadata: params.metadata || {}
    })

  if (error) {
    console.error('Error creating notification:', error)
    return { error: 'Failed to create notification' }
  }

  return { success: true, notificationId: data }
}
