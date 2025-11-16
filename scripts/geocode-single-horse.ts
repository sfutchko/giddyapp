import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from apps/web/.env.local
config({ path: resolve(__dirname, '../apps/web/.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

if (!supabaseUrl || !supabaseServiceKey || !mapboxToken) {
  console.error('❌ Missing environment variables')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  console.log('NEXT_PUBLIC_MAPBOX_TOKEN:', !!mapboxToken)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function geocodeAddress(address: string) {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxToken}&limit=1`

  try {
    const response = await fetch(url)
    const data = await response.json()

    if (data.features && data.features.length > 0) {
      const [longitude, latitude] = data.features[0].center
      return { latitude, longitude, placeName: data.features[0].place_name }
    }
    return null
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

async function geocodeSingleHorse() {
  console.log('🔍 Finding horses without coordinates...\n')

  // Get horses without lat/lng
  const { data: horses, error } = await supabase
    .from('horses')
    .select('id, name, location')
    .is('latitude', null)
    .limit(20)

  if (error) {
    console.error('❌ Error fetching horses:', error)
    return
  }

  if (!horses || horses.length === 0) {
    console.log('✅ All horses already have coordinates!')
    return
  }

  console.log(`📍 Found ${horses.length} horses without coordinates:\n`)

  for (const horse of horses) {
    const location = horse.location as any
    const addressString = location.street
      ? `${location.street}, ${location.city}, ${location.state} ${location.zipCode}`
      : `${location.city}, ${location.state} ${location.zipCode}`

    console.log(`\n🐴 ${horse.name}`)
    console.log(`   Address: ${addressString}`)

    const result = await geocodeAddress(addressString)

    if (result) {
      console.log(`   ✅ Geocoded to: ${result.placeName}`)
      console.log(`   📍 Lat/Lng: ${result.latitude}, ${result.longitude}`)

      // Update the horse
      const { error: updateError } = await supabase
        .from('horses')
        .update({
          latitude: result.latitude,
          longitude: result.longitude
        })
        .eq('id', horse.id)

      if (updateError) {
        console.error(`   ❌ Error updating: ${updateError.message}`)
      } else {
        console.log(`   ✅ Updated in database`)
      }
    } else {
      console.log(`   ❌ Could not geocode`)
    }

    // Wait a bit between requests to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  console.log('\n✨ Done!')
}

geocodeSingleHorse()
