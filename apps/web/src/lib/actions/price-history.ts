'use server'

import { createClient } from '@/lib/supabase/server'

export interface PriceHistoryEntry {
  id: string
  horse_id: string
  old_price: number
  new_price: number
  price_change: number
  price_change_percent: number
  changed_at: string
  created_at: string
}

/**
 * Get price history for a specific horse
 */
export async function getHorsePriceHistory(
  horseId: string,
  limit: number = 10
): Promise<{ history: PriceHistoryEntry[] } | { error: string }> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('price_history')
      .select('*')
      .eq('horse_id', horseId)
      .order('changed_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return { history: data as PriceHistoryEntry[] }
  } catch (error: any) {
    console.error('Error fetching price history:', error)
    return { error: error.message || 'Failed to fetch price history' }
  }
}

/**
 * Get the lowest price a horse has been listed at
 */
export async function getHorseLowestPrice(
  horseId: string
): Promise<{ price: number } | { error: string }> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_horse_lowest_price', {
      p_horse_id: horseId
    })

    if (error) throw error

    return { price: data as number }
  } catch (error: any) {
    console.error('Error fetching lowest price:', error)
    return { error: error.message || 'Failed to fetch lowest price' }
  }
}

/**
 * Get the highest price a horse has been listed at
 */
export async function getHorseHighestPrice(
  horseId: string
): Promise<{ price: number } | { error: string }> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_horse_highest_price', {
      p_horse_id: horseId
    })

    if (error) throw error

    return { price: data as number }
  } catch (error: any) {
    console.error('Error fetching highest price:', error)
    return { error: error.message || 'Failed to fetch highest price' }
  }
}

/**
 * Check if horse has had a recent price drop
 */
export async function hasRecentPriceDrop(
  horseId: string,
  days: number = 7
): Promise<{ hasDrop: boolean } | { error: string }> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('has_recent_price_drop', {
      p_horse_id: horseId,
      p_days: days
    })

    if (error) throw error

    return { hasDrop: data as boolean }
  } catch (error: any) {
    console.error('Error checking recent price drop:', error)
    return { error: error.message || 'Failed to check price drop' }
  }
}

/**
 * Get price statistics for a horse
 */
export async function getHorsePriceStats(
  horseId: string
): Promise<{
  stats: {
    current: number
    lowest: number
    highest: number
    hasRecentDrop: boolean
    priceHistory: PriceHistoryEntry[]
  }
} | { error: string }> {
  try {
    const supabase = await createClient()

    // Get current price
    const { data: horse, error: horseError } = await supabase
      .from('horses')
      .select('price')
      .eq('id', horseId)
      .single()

    if (horseError) throw horseError

    // Get price history
    const historyResult = await getHorsePriceHistory(horseId, 10)
    if ('error' in historyResult) throw new Error(historyResult.error)

    // Get lowest price
    const lowestResult = await getHorseLowestPrice(horseId)
    if ('error' in lowestResult) throw new Error(lowestResult.error)

    // Get highest price
    const highestResult = await getHorseHighestPrice(horseId)
    if ('error' in highestResult) throw new Error(highestResult.error)

    // Check recent drop
    const dropResult = await hasRecentPriceDrop(horseId, 7)
    if ('error' in dropResult) throw new Error(dropResult.error)

    return {
      stats: {
        current: horse.price,
        lowest: lowestResult.price,
        highest: highestResult.price,
        hasRecentDrop: dropResult.hasDrop,
        priceHistory: historyResult.history
      }
    }
  } catch (error: any) {
    console.error('Error fetching price stats:', error)
    return { error: error.message || 'Failed to fetch price statistics' }
  }
}

/**
 * Get all horses with recent price drops (for alerts/homepage)
 */
export async function getHorsesWithRecentPriceDrops(
  days: number = 7,
  limit: number = 20
): Promise<{
  horses: Array<{
    horse_id: string
    horse_name: string
    horse_slug: string
    old_price: number
    new_price: number
    price_change: number
    price_change_percent: number
    changed_at: string
    image_url: string | null
  }>
} | { error: string }> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('price_history')
      .select(`
        id,
        horse_id,
        old_price,
        new_price,
        price_change,
        price_change_percent,
        changed_at,
        horses (
          id,
          name,
          slug,
          horse_images (
            url,
            is_primary
          )
        )
      `)
      .lt('price_change', 0) // Only price drops
      .gte('changed_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('changed_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    // Format the response
    const horses = data.map((item: any) => {
      const primaryImage = item.horses.horse_images?.find((img: any) => img.is_primary)
      const firstImage = item.horses.horse_images?.[0]

      return {
        horse_id: item.horses.id,
        horse_name: item.horses.name,
        horse_slug: item.horses.slug,
        old_price: item.old_price,
        new_price: item.new_price,
        price_change: item.price_change,
        price_change_percent: item.price_change_percent,
        changed_at: item.changed_at,
        image_url: primaryImage?.url || firstImage?.url || null
      }
    })

    return { horses }
  } catch (error: any) {
    console.error('Error fetching horses with price drops:', error)
    return { error: error.message || 'Failed to fetch horses with price drops' }
  }
}
