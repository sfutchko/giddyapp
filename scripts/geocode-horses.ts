/**
 * Bulk geocode all horses that don't have coordinates
 * Run with: npx tsx scripts/geocode-horses.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load env vars from apps/web/.env.local
config({ path: resolve(__dirname, '../apps/web/.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

if (!supabaseUrl || !supabaseKey || !mapboxToken) {
  console.error('Missing required environment variables!')
  console.error('Need: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_MAPBOX_TOKEN')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function geocodeAddress(address: string) {
  const encodedAddress = encodeURIComponent(address)
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${mapboxToken}&country=US&limit=1`

  try {
    const response = await fetch(url)
    const data = await response.json()

    if (data.features && data.features.length > 0) {
      const [longitude, latitude] = data.features[0].center
      return { latitude, longitude }
    }
  } catch (error) {
    console.error('Geocoding error:', error)
  }

  return null
}

async function main() {
  console.log('🗺️  Starting bulk geocoding of horses...\n')

  // Get all horses without coordinates
  const { data: horses, error } = await supabase
    .from('horses')
    .select('id, name, location')
    .or('latitude.is.null,longitude.is.null')

  if (error) {
    console.error('Error fetching horses:', error)
    return
  }

  if (!horses || horses.length === 0) {
    console.log('✅ All horses already have coordinates!')
    return
  }

  console.log(`Found ${horses.length} horses without coordinates\n`)

  let successCount = 0
  let failCount = 0

  for (const horse of horses) {
    if (!horse.location?.city || !horse.location?.state || !horse.location?.zipCode) {
      console.log(`⚠️  ${horse.name}: Missing location data`)
      failCount++
      continue
    }

    const address = `${horse.location.city}, ${horse.location.state} ${horse.location.zipCode}`
    console.log(`📍 Geocoding: ${horse.name} - ${address}`)

    const coords = await geocodeAddress(address)

    if (coords) {
      const { error: updateError } = await supabase
        .from('horses')
        .update({
          latitude: coords.latitude,
          longitude: coords.longitude
        })
        .eq('id', horse.id)

      if (updateError) {
        console.log(`   ❌ Failed to update: ${updateError.message}`)
        failCount++
      } else {
        console.log(`   ✅ Updated: ${coords.latitude}, ${coords.longitude}`)
        successCount++
      }
    } else {
      console.log(`   ❌ Could not geocode address`)
      failCount++
    }

    // Rate limit: wait 100ms between requests
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log(`\n📊 Results:`)
  console.log(`   ✅ Success: ${successCount}`)
  console.log(`   ❌ Failed: ${failCount}`)
  console.log(`   📍 Total: ${horses.length}`)
}

main()
