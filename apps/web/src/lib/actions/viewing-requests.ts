'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { sendViewingRequestReceivedEmail } from '@/lib/email/send'

export type ViewingRequestStatus = 'pending' | 'approved' | 'declined' | 'cancelled' | 'completed'

export interface ViewingRequest {
  id: string
  horse_id: string
  requester_id: string
  seller_id: string
  requested_date: string
  requested_time: string
  status: ViewingRequestStatus
  message?: string | null
  seller_notes?: string | null
  phone?: string | null
  email?: string | null
  created_at: string
  updated_at: string
  approved_at?: string | null
  declined_at?: string | null
  cancelled_at?: string | null
  completed_at?: string | null
  horse?: {
    id: string
    name: string
    slug: string
    price: number
    horse_images?: Array<{ url: string; is_primary: boolean }>
  }
  requester?: {
    id: string
    name?: string | null
    full_name?: string | null
    email?: string | null
  }
  seller?: {
    id: string
    name?: string | null
    full_name?: string | null
    email?: string | null
  }
}

/**
 * Create a viewing request
 */
export async function createViewingRequest(
  horseId: string,
  sellerId: string,
  requestedDate: string,
  requestedTime: string,
  message?: string,
  phone?: string,
  email?: string
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  if (user.id === sellerId) {
    return { error: 'Cannot request to view your own horse' }
  }

  // Validate date is in the future
  const requestDate = new Date(requestedDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (requestDate < today) {
    return { error: 'Viewing date must be in the future' }
  }

  const { data, error } = await supabase
    .from('viewing_requests')
    .insert({
      horse_id: horseId,
      requester_id: user.id,
      seller_id: sellerId,
      requested_date: requestedDate,
      requested_time: requestedTime,
      message: message || null,
      phone: phone || null,
      email: email || user.email || null,
      status: 'pending'
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating viewing request:', error)
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    })
    return { error: `Failed to create viewing request: ${error.message}` }
  }

  console.log('✅ Viewing request created successfully, ID:', data.id)

  // Get horse and user info for email using service client
  console.log('📧 Starting email notification process...')
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

  // Get horse name
  const { data: horse } = await supabaseAdmin
    .from('horses')
    .select('name')
    .eq('id', horseId)
    .single()

  console.log('🐴 Horse data retrieved:', horse)

  // Get buyer and seller profiles
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('id, name, email')
    .in('id', [user.id, sellerId])

  if (profilesError) {
    console.error('❌ Error fetching profiles:', profilesError)
  }
  console.log('👥 Profiles retrieved:', profiles)

  const buyerProfile = profiles?.find(p => p.id === user.id)
  const sellerProfile = profiles?.find(p => p.id === sellerId)

  console.log('👤 Buyer profile:', buyerProfile)
  console.log('👤 Seller profile:', sellerProfile)

  // Send email notification to seller
  if (sellerProfile?.email && horse) {
    console.log('📤 Attempting to send email to:', sellerProfile.email)
    try {
      const emailResult = await sendViewingRequestReceivedEmail({
        to: sellerProfile.email,
        sellerName: sellerProfile.name || 'there',
        buyerName: buyerProfile?.name || 'A buyer',
        horseName: horse.name,
        requestedDate: requestedDate,
        requestedTime: requestedTime,
        message: message,
        phone: phone,
        email: email || buyerProfile?.email,
        requestId: data.id,
      })
      console.log('✉️ Email sent successfully:', emailResult)
    } catch (emailError) {
      console.error('❌ Failed to send viewing request email:', emailError)
      // Don't fail the whole operation if email fails
    }
  } else {
    console.log('⚠️ Email not sent - Missing data:', {
      hasSellerEmail: !!sellerProfile?.email,
      hasHorse: !!horse,
      sellerEmail: sellerProfile?.email,
      horseName: horse?.name
    })
  }

  revalidatePath(`/horses/${horseId}`)
  revalidatePath('/dashboard/viewing-requests')

  return { success: true, request: data as ViewingRequest }
}

/**
 * Get viewing requests for current user (as requester)
 */
export async function getMyViewingRequests(status?: ViewingRequestStatus) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  let query = supabase
    .from('viewing_requests')
    .select(`
      *,
      horse:horses(id, name, slug, price, horse_images(url, is_primary))
    `)
    .eq('requester_id', user.id)
    .order('requested_date', { ascending: true })
    .order('requested_time', { ascending: true })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching viewing requests:', error)
    return { error: 'Failed to fetch viewing requests' }
  }

  // Fetch seller profiles separately
  if (data && data.length > 0) {
    const sellerIds = [...new Set(data.map(r => r.seller_id))]
    const { data: sellers } = await supabase
      .from('profiles')
      .select('id, name, full_name, email')
      .in('id', sellerIds)

    const sellersMap = new Map(sellers?.map(s => [s.id, s]) || [])

    const requestsWithProfiles = data.map(request => ({
      ...request,
      seller: sellersMap.get(request.seller_id) || null
    }))

    return { requests: requestsWithProfiles as ViewingRequest[] }
  }

  return { requests: data as ViewingRequest[] }
}

/**
 * Get viewing requests for horses owned by current user (as seller)
 */
export async function getReceivedViewingRequests(status?: ViewingRequestStatus) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  let query = supabase
    .from('viewing_requests')
    .select(`
      *,
      horse:horses(id, name, slug, price, horse_images(url, is_primary))
    `)
    .eq('seller_id', user.id)
    .order('requested_date', { ascending: true })
    .order('requested_time', { ascending: true })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching received viewing requests:', error)
    return { error: 'Failed to fetch viewing requests' }
  }

  // Fetch requester profiles separately
  if (data && data.length > 0) {
    const requesterIds = [...new Set(data.map(r => r.requester_id))]
    const { data: requesters } = await supabase
      .from('profiles')
      .select('id, name, full_name, email')
      .in('id', requesterIds)

    const requestersMap = new Map(requesters?.map(r => [r.id, r]) || [])

    const requestsWithProfiles = data.map(request => ({
      ...request,
      requester: requestersMap.get(request.requester_id) || null
    }))

    return { requests: requestsWithProfiles as ViewingRequest[] }
  }

  return { requests: data as ViewingRequest[] }
}

/**
 * Get viewing requests for a specific horse
 */
export async function getHorseViewingRequests(horseId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('viewing_requests')
    .select('*')
    .eq('horse_id', horseId)
    .eq('seller_id', user.id)
    .order('requested_date', { ascending: true })
    .order('requested_time', { ascending: true })

  if (error) {
    console.error('Error fetching horse viewing requests:', error)
    return { error: 'Failed to fetch viewing requests' }
  }

  return { requests: data as ViewingRequest[] }
}

/**
 * Update viewing request status (seller only)
 */
export async function updateViewingRequestStatus(
  requestId: string,
  status: 'approved' | 'declined',
  sellerNotes?: string
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const updateData: any = { status }
  if (sellerNotes) {
    updateData.seller_notes = sellerNotes
  }

  const { data, error } = await supabase
    .from('viewing_requests')
    .update(updateData)
    .eq('id', requestId)
    .eq('seller_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating viewing request:', error)
    return { error: 'Failed to update viewing request' }
  }

  revalidatePath('/dashboard/viewing-requests')

  return { success: true, request: data as ViewingRequest }
}

/**
 * Cancel viewing request (requester only)
 */
export async function cancelViewingRequest(requestId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('viewing_requests')
    .update({ status: 'cancelled' })
    .eq('id', requestId)
    .eq('requester_id', user.id)
    .eq('status', 'pending') // Can only cancel pending requests
    .select()
    .single()

  if (error) {
    console.error('Error cancelling viewing request:', error)
    return { error: 'Failed to cancel viewing request' }
  }

  revalidatePath('/dashboard/viewing-requests')

  return { success: true, request: data as ViewingRequest }
}

/**
 * Mark viewing as completed
 */
export async function markViewingCompleted(requestId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // First verify the request exists and is approved
  const { data: request, error: fetchError } = await supabase
    .from('viewing_requests')
    .select('*')
    .eq('id', requestId)
    .single()

  if (fetchError || !request) {
    console.error('Error fetching viewing request:', fetchError)
    return { error: 'Viewing request not found' }
  }

  // Verify user is either seller or requester
  if (request.seller_id !== user.id && request.requester_id !== user.id) {
    return { error: 'Not authorized to complete this viewing' }
  }

  // Verify status is approved
  if (request.status !== 'approved') {
    return { error: 'Can only complete approved viewings' }
  }

  // Update to completed (completed_at will be set automatically by trigger)
  const { data, error } = await supabase
    .from('viewing_requests')
    .update({ status: 'completed' })
    .eq('id', requestId)
    .select()
    .single()

  if (error) {
    console.error('Error marking viewing as completed:', error)
    return { error: 'Failed to mark viewing as completed' }
  }

  revalidatePath('/dashboard/viewing-requests')

  return { success: true, request: data as ViewingRequest }
}

/**
 * Delete viewing request (requester only, pending only)
 */
export async function deleteViewingRequest(requestId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('viewing_requests')
    .delete()
    .eq('id', requestId)
    .eq('requester_id', user.id)
    .eq('status', 'pending')

  if (error) {
    console.error('Error deleting viewing request:', error)
    return { error: 'Failed to delete viewing request' }
  }

  revalidatePath('/dashboard/viewing-requests')

  return { success: true }
}
