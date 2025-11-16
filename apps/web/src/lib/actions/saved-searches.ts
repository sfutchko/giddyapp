'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { HorseFilters } from './horses'

export interface SavedSearch {
  id: string
  user_id: string
  name: string
  filters: HorseFilters
  notify_on_match: boolean
  created_at: string
  updated_at: string
}

export async function getSavedSearches() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('saved_searches')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching saved searches:', error)
    return { error: 'Failed to fetch saved searches' }
  }

  return { searches: data as SavedSearch[] }
}

export async function createSavedSearch(name: string, filters: HorseFilters, notifyOnMatch: boolean = false) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('saved_searches')
    .insert({
      user_id: user.id,
      name,
      filters,
      notify_on_match: notifyOnMatch
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating saved search:', error)
    return { error: 'Failed to save search' }
  }

  revalidatePath('/saved-searches')
  return { success: true, search: data as SavedSearch }
}

export async function updateSavedSearch(id: string, name: string, filters: HorseFilters, notifyOnMatch: boolean) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('saved_searches')
    .update({
      name,
      filters,
      notify_on_match: notifyOnMatch
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating saved search:', error)
    return { error: 'Failed to update search' }
  }

  revalidatePath('/saved-searches')
  return { success: true, search: data as SavedSearch }
}

export async function deleteSavedSearch(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('saved_searches')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting saved search:', error)
    return { error: 'Failed to delete search' }
  }

  revalidatePath('/saved-searches')
  return { success: true }
}
