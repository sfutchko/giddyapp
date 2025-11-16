'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { geocodeAddress } from '@/lib/utils/geocoding'

export interface CreateHorseData {
  name: string
  breed: string
  age: number
  gender: 'MARE' | 'GELDING' | 'STALLION'
  height: number
  weight?: number
  color: string
  description: string
  disciplines: string[]
  temperament: string
  healthStatus: string
  registrations?: string
  competitionHistory?: string
  street: string
  city: string
  state: string
  zipCode: string
  price: number
  negotiable: boolean
  farmName?: string
  farmLogoUrl?: string
  status: 'DRAFT' | 'ACTIVE'
  images: Array<{ url: string; isPrimary: boolean; order: number }>
}

function generateSlug(name: string): string {
  const randomId = Math.random().toString(36).substring(2, 8)
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${slug}-${randomId}`
}

export async function createHorseListing(data: CreateHorseData) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Use user.id directly as seller_id since profiles.id = auth.users.id
  const sellerId = user.id

  try {
    // Geocode the address to get lat/lng
    const addressString = `${data.street}, ${data.city}, ${data.state} ${data.zipCode}`

    const geocodeResult = await geocodeAddress(addressString)
    const latitude = geocodeResult?.latitude || null
    const longitude = geocodeResult?.longitude || null

    console.log('🌍 Geocoding result:', { addressString, latitude, longitude })

    // Create the horse listing
    const { data: horse, error: horseError } = await supabase
      .from('horses')
      .insert({
        name: data.name,
        slug: generateSlug(data.name),
        breed: data.breed,
        age: data.age,
        gender: data.gender,
        height: data.height,
        weight: data.weight,
        color: data.color,
        price: data.price,
        description: data.description,
        location: {
          street: data.street,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          country: 'USA',
        },
        latitude,
        longitude,
        seller_id: sellerId,
        status: data.status,
        farm_name: data.farmName,
        farm_logo_url: data.farmLogoUrl,
        metadata: {
          disciplines: data.disciplines,
          temperament: data.temperament,
          healthStatus: data.healthStatus,
          registrations: data.registrations,
          competitionHistory: data.competitionHistory,
          negotiable: data.negotiable,
        },
      })
      .select()
      .single()

    if (horseError) {
      console.error('Error creating horse - Full details:', {
        error: horseError,
        message: horseError.message,
        details: horseError.details,
        hint: horseError.hint,
        code: horseError.code
      })
      return { error: horseError.message || 'Failed to create listing' }
    }

    // Add images if provided
    if (data.images && data.images.length > 0) {
      const imageRecords = data.images.map(img => ({
        horse_id: horse.id,
        url: img.url,
        is_primary: img.isPrimary,
        display_order: img.order,
      }))

      const { error: imageError } = await supabase
        .from('horse_images')
        .insert(imageRecords)

      if (imageError) {
        console.error('Error adding images:', imageError)
      }
    }

    // Revalidate the horses pages
    revalidatePath('/horses')
    revalidatePath('/dashboard')

    return { success: true, horse }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

// Image upload moved to client-side in @/lib/supabase/upload.ts

export interface HorseFilters {
  minPrice?: number
  maxPrice?: number
  breed?: string
  minAge?: number
  maxAge?: number
  minHeight?: number
  maxHeight?: number
  gender?: string
  disciplines?: string[]
  color?: string
  state?: string
  sortBy?: 'price_asc' | 'price_desc' | 'recent' | 'age_asc' | 'age_desc'
}

export async function getHorses(filters?: HorseFilters) {
  const supabase = await createClient()

  let query = supabase
    .from('horses')
    .select(`
      *,
      farm_name,
      farm_logo_url,
      horse_images (
        url,
        is_primary
      )
    `)
    .eq('status', 'ACTIVE')

  // Apply filters
  if (filters) {
    if (filters.minPrice) {
      query = query.gte('price', filters.minPrice)
    }
    if (filters.maxPrice) {
      query = query.lte('price', filters.maxPrice)
    }
    if (filters.breed) {
      query = query.ilike('breed', `%${filters.breed}%`)
    }
    if (filters.minAge) {
      query = query.gte('age', filters.minAge)
    }
    if (filters.maxAge) {
      query = query.lte('age', filters.maxAge)
    }
    if (filters.minHeight) {
      query = query.gte('height', filters.minHeight)
    }
    if (filters.maxHeight) {
      query = query.lte('height', filters.maxHeight)
    }
    if (filters.gender) {
      query = query.eq('gender', filters.gender)
    }
    if (filters.color) {
      query = query.ilike('color', `%${filters.color}%`)
    }
    if (filters.state) {
      query = query.eq('location->>state', filters.state)
    }

    // Sorting
    switch (filters.sortBy) {
      case 'price_asc':
        query = query.order('price', { ascending: true })
        break
      case 'price_desc':
        query = query.order('price', { ascending: false })
        break
      case 'age_asc':
        query = query.order('age', { ascending: true })
        break
      case 'age_desc':
        query = query.order('age', { ascending: false })
        break
      case 'recent':
      default:
        query = query.order('created_at', { ascending: false })
    }
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching horses - Details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    })
    return { error: 'Failed to fetch horses' }
  }

  // Client-side filtering for disciplines (JSONB field)
  let filteredData = data || []
  if (filters?.disciplines && filters.disciplines.length > 0 && data) {
    filteredData = data.filter(horse => {
      const horseDisciplines = horse.metadata?.disciplines || []
      // Check if any of the selected disciplines match
      return filters.disciplines!.some(selectedDiscipline =>
        horseDisciplines.includes(selectedDiscipline)
      )
    })
  }

  // Fetch seller profiles for all horses
  let horsesWithProfiles = filteredData || []
  if (filteredData && filteredData.length > 0) {
    const sellerIds = [...new Set(filteredData.map(h => h.seller_id).filter(Boolean))]

    if (sellerIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email, is_verified_seller, location')
        .in('id', sellerIds)

      if (profiles) {
        horsesWithProfiles = filteredData.map(horse => {
          const profile = profiles.find(p => p.id === horse.seller_id)
          return {
            ...horse,
            profiles: profile
          }
        })
      }
    }
  }

  return { horses: horsesWithProfiles }
}

export async function getHorseBySlug(slug: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('horses')
    .select(`
      *,
      horse_images (
        url,
        is_primary,
        display_order
      ),
      horse_videos (
        id,
        url,
        title,
        duration,
        display_order
      ),
      horse_documents (
        id,
        url,
        name,
        type,
        file_size
      )
    `)
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching horse:', error)
    return { error: 'Horse not found' }
  }

  // Fetch seller info separately to avoid join issues
  let sellerInfo = null
  if (data?.seller_id) {
    const { data: seller } = await supabase
      .from('profiles')
      .select('id, name, email, phone, bio, is_verified_seller, location')
      .eq('id', data.seller_id)
      .single()

    sellerInfo = seller
  }

  return { horse: { ...data, profiles: sellerInfo } }
}

export async function getSimilarHorses(currentHorseId: string, breed: string, maxResults: number = 4) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('horses')
    .select(`
      id,
      slug,
      name,
      breed,
      age,
      price,
      horse_images (
        url,
        is_primary
      )
    `)
    .eq('status', 'ACTIVE')
    .eq('breed', breed)
    .neq('id', currentHorseId)
    .order('created_at', { ascending: false })
    .limit(maxResults)

  if (error) {
    console.error('Error fetching similar horses:', error)
    return { horses: [] }
  }

  return { horses: data || [] }
}