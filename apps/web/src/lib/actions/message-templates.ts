'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type TemplateCategory =
  | 'greeting'
  | 'availability'
  | 'scheduling'
  | 'pricing'
  | 'details'
  | 'closing'
  | 'other'

export interface MessageTemplate {
  id: string
  user_id: string
  title: string
  content: string
  category?: TemplateCategory | null
  is_default: boolean
  usage_count: number
  created_at: string
  updated_at: string
}

/**
 * Get all message templates for current user
 */
export async function getMessageTemplates(category?: TemplateCategory) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  let query = supabase
    .from('message_templates')
    .select('*')
    .eq('user_id', user.id)
    .order('usage_count', { ascending: false })
    .order('created_at', { ascending: false })

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching templates:', error)
    return { error: 'Failed to fetch templates' }
  }

  // If user has no templates, create default ones
  if (!data || data.length === 0) {
    await createDefaultTemplates(user.id)
    // Fetch again after creating defaults
    const { data: newData } = await supabase
      .from('message_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('usage_count', { ascending: false })
      .order('created_at', { ascending: false })

    return { templates: (newData || []) as MessageTemplate[] }
  }

  return { templates: data as MessageTemplate[] }
}

/**
 * Create default templates for a user
 */
async function createDefaultTemplates(userId: string) {
  const supabase = await createClient()

  const defaultTemplates = [
    {
      user_id: userId,
      title: 'Greeting - First Contact',
      content: 'Hi! Thanks for your interest in [horse name]. I\'d be happy to answer any questions you have. When would be a good time for you to visit?',
      category: 'greeting',
      is_default: true
    },
    {
      user_id: userId,
      title: 'Availability Confirmation',
      content: 'Yes, [horse name] is still available! Would you like to schedule a viewing?',
      category: 'availability',
      is_default: true
    },
    {
      user_id: userId,
      title: 'Schedule Viewing',
      content: 'Great! I have availability on [day] at [time]. Does that work for you? The address is [location].',
      category: 'scheduling',
      is_default: true
    },
    {
      user_id: userId,
      title: 'Price Discussion',
      content: 'The asking price is $[price]. I\'m open to discussing the details once you\'ve had a chance to meet [horse name] in person.',
      category: 'pricing',
      is_default: true
    },
    {
      user_id: userId,
      title: 'Send Details',
      content: 'I can send you more information including veterinary records, training history, and additional photos. What would be most helpful?',
      category: 'details',
      is_default: true
    },
    {
      user_id: userId,
      title: 'Thank You',
      content: 'Thank you for visiting! Please let me know if you have any other questions. I look forward to hearing from you.',
      category: 'closing',
      is_default: true
    }
  ]

  await supabase.from('message_templates').insert(defaultTemplates)
}

/**
 * Create a new message template
 */
export async function createMessageTemplate(
  title: string,
  content: string,
  category?: TemplateCategory
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  if (!title.trim() || !content.trim()) {
    return { error: 'Title and content are required' }
  }

  if (title.length > 100) {
    return { error: 'Title must be 100 characters or less' }
  }

  const { data, error } = await supabase
    .from('message_templates')
    .insert({
      user_id: user.id,
      title: title.trim(),
      content: content.trim(),
      category: category || null,
      is_default: false
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating template:', error)
    return { error: 'Failed to create template' }
  }

  revalidatePath('/settings/message-templates')

  return { success: true, template: data as MessageTemplate }
}

/**
 * Update a message template
 */
export async function updateMessageTemplate(
  id: string,
  title: string,
  content: string,
  category?: TemplateCategory
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  if (!title.trim() || !content.trim()) {
    return { error: 'Title and content are required' }
  }

  if (title.length > 100) {
    return { error: 'Title must be 100 characters or less' }
  }

  const { data, error } = await supabase
    .from('message_templates')
    .update({
      title: title.trim(),
      content: content.trim(),
      category: category || null
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating template:', error)
    return { error: 'Failed to update template' }
  }

  revalidatePath('/settings/message-templates')

  return { success: true, template: data as MessageTemplate }
}

/**
 * Delete a message template
 */
export async function deleteMessageTemplate(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('message_templates')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting template:', error)
    return { error: 'Failed to delete template' }
  }

  revalidatePath('/settings/message-templates')

  return { success: true }
}

/**
 * Increment usage count for a template
 */
export async function incrementTemplateUsage(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Get current usage count
  const { data: template } = await supabase
    .from('message_templates')
    .select('usage_count')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!template) {
    return { error: 'Template not found' }
  }

  // Increment usage count
  const { error } = await supabase
    .from('message_templates')
    .update({ usage_count: template.usage_count + 1 })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error incrementing usage count:', error)
    // Don't return error - this is not critical
  }

  return { success: true }
}

/**
 * Get template by ID
 */
export async function getTemplateById(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('message_templates')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('Error fetching template:', error)
    return { error: 'Template not found' }
  }

  return { template: data as MessageTemplate }
}
