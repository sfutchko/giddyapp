'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ReportCategory =
  | 'spam'
  | 'harassment'
  | 'inappropriate_content'
  | 'scam'
  | 'fake_listing'
  | 'impersonation'
  | 'other'

export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed'

export interface UserReport {
  id: string
  reporter_id: string
  reported_id: string
  category: ReportCategory
  description: string
  status: ReportStatus
  admin_notes?: string | null
  created_at: string
  updated_at: string
  reported_profile?: {
    id: string
    name?: string | null
    full_name?: string | null
    avatar_url?: string | null
  }
}


/**
 * Report a user
 */
export async function reportUser(
  userId: string,
  category: ReportCategory,
  description: string
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  if (user.id === userId) {
    return { error: 'Cannot report yourself' }
  }

  if (!description || description.trim().length < 10) {
    return { error: 'Please provide a detailed description (at least 10 characters)' }
  }

  // Check if user exists
  const { data: reportedUser, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single()

  if (userError || !reportedUser) {
    return { error: 'User not found' }
  }

  const { data, error } = await supabase
    .from('user_reports')
    .insert({
      reporter_id: user.id,
      reported_id: userId,
      category,
      description: description.trim(),
      status: 'pending'
    })
    .select()
    .single()

  if (error) {
    console.error('Error reporting user:', error)
    return { error: 'Failed to submit report' }
  }

  return { success: true, report: data }
}

/**
 * Get reports submitted by current user
 */
export async function getMyReports() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('user_reports')
    .select(`
      *,
      reported_profile:profiles!user_reports_reported_id_fkey(
        id,
        name,
        full_name,
        avatar_url
      )
    `)
    .eq('reporter_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching reports:', error)
    return { error: 'Failed to fetch reports' }
  }

  return { reports: data as UserReport[] }
}

/**
 * Get all reports (admin only)
 */
export async function getAllReports(status?: ReportStatus) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: 'Unauthorized - Admin access required' }
  }

  let query = supabase
    .from('user_reports')
    .select(`
      *,
      reported_profile:profiles!user_reports_reported_id_fkey(
        id,
        name,
        full_name,
        avatar_url
      ),
      reporter_profile:profiles!user_reports_reporter_id_fkey(
        id,
        name,
        full_name,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching all reports:', error)
    return { error: 'Failed to fetch reports' }
  }

  return { reports: data as UserReport[] }
}

/**
 * Update report status (admin only)
 */
export async function updateReportStatus(
  reportId: string,
  status: ReportStatus,
  adminNotes?: string
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: 'Unauthorized - Admin access required' }
  }

  const updateData: any = { status }
  if (adminNotes !== undefined) {
    updateData.admin_notes = adminNotes
  }

  const { data, error } = await supabase
    .from('user_reports')
    .update(updateData)
    .eq('id', reportId)
    .select()
    .single()

  if (error) {
    console.error('Error updating report:', error)
    return { error: 'Failed to update report' }
  }

  revalidatePath('/admin/reports')

  return { success: true, report: data }
}

/**
 * Get report statistics (admin only)
 */
export async function getReportStats() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: 'Unauthorized - Admin access required' }
  }

  const { data, error } = await supabase
    .from('user_reports')
    .select('status, category')

  if (error) {
    console.error('Error fetching report stats:', error)
    return { error: 'Failed to fetch statistics' }
  }

  const stats = {
    total: data.length,
    pending: data.filter(r => r.status === 'pending').length,
    reviewed: data.filter(r => r.status === 'reviewed').length,
    resolved: data.filter(r => r.status === 'resolved').length,
    dismissed: data.filter(r => r.status === 'dismissed').length,
    byCategory: {} as Record<string, number>
  }

  // Count by category
  data.forEach(report => {
    stats.byCategory[report.category] = (stats.byCategory[report.category] || 0) + 1
  })

  return { stats }
}
