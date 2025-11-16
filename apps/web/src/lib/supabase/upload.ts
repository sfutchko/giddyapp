import { createClient } from '@/lib/supabase/client'

export async function uploadImageToSupabase(file: File): Promise<{ url: string } | { error: string }> {
  const supabase = createClient()

  // Generate unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
  const filePath = `horse-images/${fileName}`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('media')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) {
    console.error('Upload error:', uploadError)
    return { error: uploadError.message || 'Failed to upload image' }
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('media')
    .getPublicUrl(filePath)

  return { url: publicUrl }
}

export async function uploadVideoToSupabase(file: File, userId: string): Promise<{ url: string } | { error: string }> {
  const supabase = createClient()

  // Generate unique filename with user ID for proper RLS
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
  const filePath = `${userId}/${fileName}`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('horse-videos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) {
    console.error('Video upload error:', uploadError)
    return { error: uploadError.message || 'Failed to upload video' }
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('horse-videos')
    .getPublicUrl(filePath)

  return { url: publicUrl }
}

export async function uploadDocumentToSupabase(file: File, userId: string): Promise<{ url: string; name: string } | { error: string }> {
  const supabase = createClient()

  // Generate unique filename with user ID for proper RLS
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
  const filePath = `${userId}/${fileName}`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('horse-documents')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) {
    console.error('Document upload error:', uploadError)
    return { error: uploadError.message || 'Failed to upload document' }
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('horse-documents')
    .getPublicUrl(filePath)

  return { url: publicUrl, name: file.name }
}