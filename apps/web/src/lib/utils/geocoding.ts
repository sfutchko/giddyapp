/**
 * Geocoding utilities for converting addresses to coordinates
 * Uses Mapbox Geocoding API
 */

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

export interface GeocodingResult {
  longitude: number
  latitude: number
  placeName: string
  center: [number, number]
  placeType?: string[]
  bbox?: [number, number, number, number] // [west, south, east, north]
}

/**
 * Geocode an address string to coordinates using Mapbox
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  if (!MAPBOX_TOKEN) {
    console.error('Mapbox token not configured')
    return null
  }

  if (!address || address.trim().length === 0) {
    return null
  }

  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      address
    )}.json?access_token=${MAPBOX_TOKEN}&limit=1&country=US`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Geocoding failed')
    }

    const data = await response.json()

    if (data.features && data.features.length > 0) {
      const feature = data.features[0]
      return {
        longitude: feature.center[0],
        latitude: feature.center[1],
        placeName: feature.place_name,
        center: feature.center,
        placeType: feature.place_type,
        bbox: feature.bbox
      }
    }

    return null
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

/**
 * Reverse geocode coordinates to an address
 */
export async function reverseGeocode(
  longitude: number,
  latitude: number
): Promise<string | null> {
  if (!MAPBOX_TOKEN) {
    console.error('Mapbox token not configured')
    return null
  }

  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&limit=1`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Reverse geocoding failed')
    }

    const data = await response.json()

    if (data.features && data.features.length > 0) {
      return data.features[0].place_name
    }

    return null
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return null
  }
}

/**
 * Calculate distance between two coordinates in miles
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8 // Radius of Earth in miles
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return Math.round(distance * 10) / 10 // Round to 1 decimal place
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Extract city and state from a full address
 */
export function extractCityState(address: string): { city: string; state: string } | null {
  // Try to parse common formats like "City, ST" or "City, State"
  const match = address.match(/([^,]+),\s*([A-Z]{2}|[A-Za-z\s]+)/)

  if (match) {
    return {
      city: match[1].trim(),
      state: match[2].trim()
    }
  }

  return null
}
