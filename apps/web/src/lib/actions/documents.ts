'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type DocumentCategory =
  | 'health_certificate'
  | 'vaccination_record'
  | 'coggins_test'
  | 'registration_papers'
  | 'pedigree'
  | 'competition_record'
  | 'training_record'
  | 'ppe_report'
  | 'insurance'
  | 'bill_of_sale'
  | 'other'

interface HorseDocument {
  id: string
  horse_id: string
  uploaded_by: string
  category: DocumentCategory
  title: string
  description: string | null
  file_url: string
  file_name: string
  file_size: number
  file_type: string
  document_date: string | null
  expiration_date: string | null
  issuing_authority: string | null
  is_public: boolean
  is_shared_with_buyers: boolean
  requires_approval: boolean
  is_verified: boolean
  verified_by: string | null
  verified_at: string | null
  verification_notes: string | null
  created_at: string
  updated_at: string
}

/**
 * Get all documents for a horse
 */
export async function getHorseDocuments(horseId: string): Promise<{
  success: boolean
  documents?: any[]
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get horse to check ownership
    const { data: horse } = await supabase
      .from('horses')
      .select('seller_id')
      .eq('id', horseId)
      .single()

    if (!horse) {
      return { success: false, error: 'Horse not found' }
    }

    const isOwner = user?.id === horse.seller_id

    // Build query based on access level
    let query = supabase
      .from('horse_documents')
      .select('*')
      .eq('horse_id', horseId)
      .order('created_at', { ascending: false })

    // If not owner, only show public documents or documents with approved access
    if (!isOwner && user) {
      query = query.or(`is_public.eq.true,id.in.(
        SELECT document_id FROM document_access_requests
        WHERE requester_id='${user.id}' AND status='approved'
      )`)
    } else if (!isOwner) {
      query = query.eq('is_public', true)
    }

    const { data, error } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, documents: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Get single document details
 */
export async function getDocument(documentId: string): Promise<{
  success: boolean
  document?: any
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('horse_documents')
      .select(`
        *,
        horses (id, name, slug, seller_id)
      `)
      .eq('id', documentId)
      .single()

    if (error || !data) {
      return { success: false, error: 'Document not found' }
    }

    return { success: true, document: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Create a new document
 */
export async function createDocument(params: {
  horseId: string
  category: DocumentCategory
  title: string
  description?: string
  fileUrl: string
  fileName: string
  fileSize: number
  fileType: string
  documentDate?: string
  expirationDate?: string
  issuingAuthority?: string
  isPublic?: boolean
  isSharedWithBuyers?: boolean
  requiresApproval?: boolean
}): Promise<{
  success: boolean
  document?: any
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify user owns the horse
    const { data: horse } = await supabase
      .from('horses')
      .select('seller_id')
      .eq('id', params.horseId)
      .single()

    if (!horse || horse.seller_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data, error } = await supabase
      .from('horse_documents')
      .insert({
        horse_id: params.horseId,
        uploaded_by: user.id,
        category: params.category,
        title: params.title,
        description: params.description || null,
        file_url: params.fileUrl,
        file_name: params.fileName,
        file_size: params.fileSize,
        file_type: params.fileType,
        document_date: params.documentDate || null,
        expiration_date: params.expirationDate || null,
        issuing_authority: params.issuingAuthority || null,
        is_public: params.isPublic ?? false,
        is_shared_with_buyers: params.isSharedWithBuyers ?? false,
        requires_approval: params.requiresApproval ?? true,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath(`/horses/${params.horseId}`)
    return { success: true, document: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Update a document
 */
export async function updateDocument(
  documentId: string,
  updates: Partial<HorseDocument>
): Promise<{
  success: boolean
  document?: any
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify ownership
    const { data: document } = await supabase
      .from('horse_documents')
      .select('horse_id, horses(seller_id)')
      .eq('id', documentId)
      .single()

    if (!document || (document.horses as any)?.seller_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data, error } = await supabase
      .from('horse_documents')
      .update(updates)
      .eq('id', documentId)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath(`/horses/${document.horse_id}`)
    return { success: true, document: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Delete a document
 */
export async function deleteDocument(documentId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get document details for cleanup
    const { data: document } = await supabase
      .from('horse_documents')
      .select('horse_id, file_url, horses(seller_id)')
      .eq('id', documentId)
      .single()

    if (!document || (document.horses as any)?.seller_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Delete from database
    const { error } = await supabase
      .from('horse_documents')
      .delete()
      .eq('id', documentId)

    if (error) {
      return { success: false, error: error.message }
    }

    // Delete from storage
    try {
      const path = document.file_url.split('/').slice(-1)[0]
      await supabase.storage.from('horse-documents').remove([path])
    } catch (storageError) {
      console.error('Failed to delete file from storage:', storageError)
    }

    revalidatePath(`/horses/${document.horse_id}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Request access to a document
 */
export async function requestDocumentAccess(
  documentId: string,
  message?: string
): Promise<{
  success: boolean
  request?: any
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get document and horse info
    const { data: document } = await supabase
      .from('horse_documents')
      .select('horse_id')
      .eq('id', documentId)
      .single()

    if (!document) {
      return { success: false, error: 'Document not found' }
    }

    // Create access request
    const { data, error } = await supabase
      .from('document_access_requests')
      .insert({
        document_id: documentId,
        requester_id: user.id,
        horse_id: document.horse_id,
        message: message || null,
      })
      .select()
      .single()

    if (error) {
      // Check if request already exists
      if (error.code === '23505') {
        return { success: false, error: 'You have already requested access to this document' }
      }
      return { success: false, error: error.message }
    }

    return { success: true, request: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Approve or deny document access request
 */
export async function respondToAccessRequest(
  requestId: string,
  approved: boolean,
  responseMessage?: string,
  accessDays?: number
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get request details
    const { data: request } = await supabase
      .from('document_access_requests')
      .select('document_id, horse_id, horses(seller_id)')
      .eq('id', requestId)
      .single()

    if (!request || (request.horses as any)?.seller_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Calculate access expiration if approved
    let accessGrantedUntil = null
    if (approved && accessDays) {
      const expirationDate = new Date()
      expirationDate.setDate(expirationDate.getDate() + accessDays)
      accessGrantedUntil = expirationDate.toISOString()
    }

    // Update request
    const { error } = await supabase
      .from('document_access_requests')
      .update({
        status: approved ? 'approved' : 'denied',
        responded_by: user.id,
        responded_at: new Date().toISOString(),
        response_message: responseMessage || null,
        access_granted_until: accessGrantedUntil,
      })
      .eq('id', requestId)

    if (error) {
      return { success: false, error: error.message }
    }

    // Create notification for requester
    const { data: accessRequest } = await supabase
      .from('document_access_requests')
      .select('requester_id, document_id, horse_documents(title)')
      .eq('id', requestId)
      .single()

    if (accessRequest) {
      await supabase
        .from('notifications')
        .insert({
          user_id: accessRequest.requester_id,
          type: approved ? 'document_access_approved' : 'document_access_denied',
          title: approved ? 'Document Access Approved' : 'Document Access Denied',
          message: approved
            ? `Your request to view "${(accessRequest.horse_documents as any)?.title}" has been approved${accessDays ? ` for ${accessDays} days` : ''}.`
            : `Your request to view "${(accessRequest.horse_documents as any)?.title}" has been denied.${responseMessage ? ` Reason: ${responseMessage}` : ''}`,
        })
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Get document access requests for horse owner
 */
export async function getDocumentAccessRequests(horseId?: string): Promise<{
  success: boolean
  requests?: any[]
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    let query = supabase
      .from('document_access_requests')
      .select(`
        *,
        document_id,
        horse_documents (id, title, category),
        requester:profiles!document_access_requests_requester_id_fkey (id, name, email),
        horses (id, name, seller_id)
      `)
      .order('created_at', { ascending: false })

    if (horseId) {
      query = query.eq('horse_id', horseId)
    }

    const { data, error } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    // Filter to only requests for horses owned by user
    const filteredData = data?.filter((req: any) => req.horses?.seller_id === user.id)

    return { success: true, requests: filteredData }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Get user's own document access requests
 */
export async function getMyDocumentAccessRequests(): Promise<{
  success: boolean
  requests?: any[]
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('document_access_requests')
      .select(`
        *,
        horse_documents (id, title, category),
        horses (id, name, slug)
      `)
      .eq('requester_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, requests: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Log document view
 */
export async function logDocumentView(
  documentId: string,
  sessionId?: string
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Call the database function to log view
    const { error } = await supabase.rpc('log_document_view', {
      p_document_id: documentId,
      p_viewer_id: user.id,
      p_session_id: sessionId || null,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Create shareable link for document
 */
export async function createDocumentShareLink(
  documentId: string,
  expirationDays: number = 7,
  maxViews?: number,
  password?: string
): Promise<{
  success: boolean
  link?: any
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify document ownership
    const { data: document } = await supabase
      .from('horse_documents')
      .select('horses(seller_id)')
      .eq('id', documentId)
      .single()

    if (!document || (document.horses as any)?.seller_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Calculate expiration
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expirationDays)

    // Hash password if provided (simple implementation - use bcrypt in production)
    let passwordHash = null
    if (password) {
      // TODO: Implement proper password hashing
      passwordHash = password // For now, storing plain text (should be hashed)
    }

    const { data, error } = await supabase
      .from('document_share_links')
      .insert({
        document_id: documentId,
        created_by: user.id,
        expires_at: expiresAt.toISOString(),
        max_views: maxViews || null,
        password_hash: passwordHash,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, link: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Get document stats for a horse
 */
export async function getHorseDocumentStats(horseId: string): Promise<{
  success: boolean
  stats?: any
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_horse_document_stats', {
      p_horse_id: horseId,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, stats: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Create vaccination record
 */
export async function createVaccinationRecord(params: {
  horseId: string
  documentId?: string
  vaccineName: string
  vaccineType?: string
  administeredDate: string
  expirationDate?: string
  nextDueDate?: string
  veterinarianName?: string
  veterinarianLicense?: string
  clinicName?: string
  lotNumber?: string
  notes?: string
  adverseReactions?: string
}): Promise<{
  success: boolean
  record?: any
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify horse ownership
    const { data: horse } = await supabase
      .from('horses')
      .select('seller_id')
      .eq('id', params.horseId)
      .single()

    if (!horse || horse.seller_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data, error } = await supabase
      .from('vaccination_records')
      .insert({
        horse_id: params.horseId,
        document_id: params.documentId || null,
        vaccine_name: params.vaccineName,
        vaccine_type: params.vaccineType || null,
        administered_date: params.administeredDate,
        expiration_date: params.expirationDate || null,
        next_due_date: params.nextDueDate || null,
        veterinarian_name: params.veterinarianName || null,
        veterinarian_license: params.veterinarianLicense || null,
        clinic_name: params.clinicName || null,
        lot_number: params.lotNumber || null,
        notes: params.notes || null,
        adverse_reactions: params.adverseReactions || null,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath(`/horses/${params.horseId}`)
    return { success: true, record: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Get vaccination records for a horse
 */
export async function getVaccinationRecords(horseId: string): Promise<{
  success: boolean
  records?: any[]
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('vaccination_records')
      .select('*')
      .eq('horse_id', horseId)
      .order('administered_date', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, records: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Create competition record
 */
export async function createCompetitionRecord(params: {
  horseId: string
  documentId?: string
  competitionName: string
  competitionDate: string
  location?: string
  discipline?: string
  level?: string
  placement?: number
  totalEntries?: number
  score?: string
  ribbon?: string
  riderName?: string
  judgeName?: string
  notes?: string
}): Promise<{
  success: boolean
  record?: any
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify horse ownership
    const { data: horse } = await supabase
      .from('horses')
      .select('seller_id')
      .eq('id', params.horseId)
      .single()

    if (!horse || horse.seller_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data, error } = await supabase
      .from('competition_records')
      .insert({
        horse_id: params.horseId,
        document_id: params.documentId || null,
        competition_name: params.competitionName,
        competition_date: params.competitionDate,
        location: params.location || null,
        discipline: params.discipline || null,
        level: params.level || null,
        placement: params.placement || null,
        total_entries: params.totalEntries || null,
        score: params.score || null,
        ribbon: params.ribbon || null,
        rider_name: params.riderName || null,
        judge_name: params.judgeName || null,
        notes: params.notes || null,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath(`/horses/${params.horseId}`)
    return { success: true, record: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Get competition records for a horse
 */
export async function getCompetitionRecords(horseId: string): Promise<{
  success: boolean
  records?: any[]
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('competition_records')
      .select('*')
      .eq('horse_id', horseId)
      .order('competition_date', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, records: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
