'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { HorseMap } from '@/components/map/horse-map'
import { HorseDetailPanel } from '@/components/map/horse-detail-panel'
import { createClient } from '@/lib/supabase/client'
import { Search, MapIcon, List, SlidersHorizontal, Loader2, Heart } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { geocodeAddress, calculateDistance } from '@/lib/utils/geocoding'

interface Horse {
  id: string
  name: string
  slug: string
  price: number
  location: string
  latitude?: number
  longitude?: number
  breed?: string
  age?: number
  gender?: string
  height?: number
  description?: string
  horse_images?: Array<{ url: string; is_primary: boolean }>
  horse_documents?: Array<{
    id: string
    url: string
    name: string
    type: string
    file_size?: number
  }>
  view_count?: number
  created_at?: string
  farm_name?: string
  farm_logo_url?: string
}

export function MapSearchContent() {
  const searchParams = useSearchParams()
  const [horses, setHorses] = useState<Horse[]>([])
  const [filteredHorses, setFilteredHorses] = useState<Horse[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedHorse, setSelectedHorse] = useState<Horse | null>(null)

  // Filter states
  const [searchLocation, setSearchLocation] = useState('')
  const [maxDistance, setMaxDistance] = useState<number>(100)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [minPrice, setMinPrice] = useState<number | ''>('')
  const [maxPrice, setMaxPrice] = useState<number | ''>('')
  const [selectedBreed, setSelectedBreed] = useState('')
  const [sortBy, setSortBy] = useState<'recommended' | 'price-low' | 'price-high' | 'newest' | 'distance'>('recommended')
  const [hoveredHorseId, setHoveredHorseId] = useState<string | null>(null)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null)
  const [mapBounds, setMapBounds] = useState<[number, number, number, number] | null>(null) // [west, south, east, north]
  const [clickedHorseId, setClickedHorseId] = useState<string | null>(null)
  const [currentMapBounds, setCurrentMapBounds] = useState<{ north: number; south: number; east: number; west: number } | null>(null)
  const [showSearchThisArea, setShowSearchThisArea] = useState(false)
  const [searchAsMove, setSearchAsMove] = useState(true) // Zillow-style auto-search

  const supabase = createClient()

  // Handle URL query parameters and request geolocation on mount
  useEffect(() => {
    const locationParam = searchParams.get('location')
    const breedParam = searchParams.get('breed')
    const maxPriceParam = searchParams.get('maxPrice')

    if (locationParam) {
      setSearchLocation(locationParam)
      // Auto-search for the location
      geocodeAddress(locationParam).then(result => {
        if (result) {
          const newLocation = {
            lat: result.latitude,
            lng: result.longitude
          }
          setUserLocation(newLocation)

          if (result.bbox) {
            setMapBounds(result.bbox)
            setMapCenter(null)
          } else {
            setMapCenter(newLocation)
            setMapBounds(null)
          }
        }
      })
    } else {
      // No search query - request user's location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
            setUserLocation(newLocation)
            setMapCenter(newLocation)
          },
          (error) => {
            console.log('Geolocation denied or unavailable:', error)
          }
        )
      }
    }

    if (breedParam) {
      setSelectedBreed(breedParam)
    }

    if (maxPriceParam) {
      setMaxPrice(Number(maxPriceParam))
    }
  }, [searchParams])

  useEffect(() => {
    fetchHorses()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [horses, userLocation, maxDistance, minPrice, maxPrice, selectedBreed, sortBy, currentMapBounds])

  // Handle map bounds change
  const handleMapBoundsChange = (bounds: { north: number; south: number; east: number; west: number }) => {
    setCurrentMapBounds(bounds)

    if (searchAsMove) {
      // Auto-search when map moves (Zillow behavior)
      applyFilters()
    } else {
      // Show "Search this area" button
      setShowSearchThisArea(true)
    }
  }

  const handleSearchThisArea = () => {
    setShowSearchThisArea(false)
    applyFilters()
  }

  const fetchHorses = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('horses')
      .select('*')
      .order('created_at', { ascending: false })

    // Debug: log first horse to see all fields
    if (data && data.length > 0) {
      console.log('📋 First horse fields:', Object.keys(data[0]))
      console.log('📋 First horse metadata:', data[0].metadata)
      console.log('📋 First horse seller_id:', data[0].seller_id)
    }

    // Fetch images separately for each horse
    if (data && data.length > 0) {
      const horsesWithImages = await Promise.all(
        data.map(async (horse) => {
          const { data: images } = await supabase
            .from('horse_images')
            .select('url, is_primary')
            .eq('horse_id', horse.id)

          const { data: videos } = await supabase
            .from('horse_videos')
            .select('id, url, title')
            .eq('horse_id', horse.id)

          const { data: documents } = await supabase
            .from('horse_documents')
            .select('id, url, name, type, file_size')
            .eq('horse_id', horse.id)

          // Fetch seller profile separately
          const sellerId = horse.seller_id || horse.owner_id
          const { data: profile, error: profileError } = sellerId ? await supabase
            .from('profiles')
            .select('id, name, email, phone, bio, is_verified_seller, location')
            .eq('id', sellerId)
            .single() : { data: null, error: null }

          if (profileError) {
            console.log('❌ Profile fetch error for seller_id:', sellerId, profileError)
          }

          return {
            ...horse,
            horse_images: images || [],
            horse_videos: videos || [],
            horse_documents: documents || [],
            profiles: profile || null
          }
        })
      )

      if (!error) {
        setHorses(horsesWithImages as Horse[])
      }
      setLoading(false)
      return
    }

    if (!error && data) {
      setHorses(data as Horse[])
    } else if (error) {
      console.error('❌ Error fetching horses:', error)
    }

    setLoading(false)
  }

  const handleLocationSearch = async () => {
    if (!searchLocation) return

    const result = await geocodeAddress(searchLocation)

    if (result) {
      const newLocation = {
        lat: result.latitude,
        lng: result.longitude
      }
      setUserLocation(newLocation)

      // If we have a bounding box (e.g., for states/regions), use it to fit the bounds
      if (result.bbox) {
        setMapBounds(result.bbox)
        setMapCenter(null) // Clear center so bounds take precedence
      } else {
        // Otherwise just center on the location (for cities/addresses)
        setMapCenter(newLocation)
        setMapBounds(null)
      }
    }
  }

  const applyFilters = () => {
    let filtered = [...horses]

    // Filter by map bounds (Zillow-style)
    if (currentMapBounds) {
      filtered = filtered.filter(horse => {
        if (horse.latitude && horse.longitude) {
          return (
            horse.latitude >= currentMapBounds.south &&
            horse.latitude <= currentMapBounds.north &&
            horse.longitude >= currentMapBounds.west &&
            horse.longitude <= currentMapBounds.east
          )
        }
        return false
      })
    }

    // Calculate distances if we have a user location (for sorting)
    if (userLocation) {
      filtered = filtered.map(horse => {
        if (horse.latitude && horse.longitude) {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            horse.latitude,
            horse.longitude
          )
          return { ...horse, distance }
        }
        return { ...horse, distance: 9999 }
      })
    }

    // Price filters
    if (minPrice !== '') {
      filtered = filtered.filter(horse => horse.price >= minPrice)
    }

    if (maxPrice !== '') {
      filtered = filtered.filter(horse => horse.price <= maxPrice)
    }

    // Breed filter
    if (selectedBreed) {
      filtered = filtered.filter(horse => horse.breed === selectedBreed)
    }

    // Apply sorting
    filtered = applySorting(filtered)

    setFilteredHorses(filtered)
  }

  const applySorting = (horses: Horse[]) => {
    const sorted = [...horses]

    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => a.price - b.price)
      case 'price-high':
        return sorted.sort((a, b) => b.price - a.price)
      case 'newest':
        return sorted.sort((a, b) =>
          new Date((b as any).created_at || 0).getTime() - new Date((a as any).created_at || 0).getTime()
        )
      case 'distance':
        return sorted.sort((a, b) => ((a as any).distance || 9999) - ((b as any).distance || 9999))
      case 'recommended':
      default:
        return sorted
    }
  }

  const clearFilters = () => {
    setSearchLocation('')
    setUserLocation(null)
    setMaxDistance(100)
    setMinPrice('')
    setMaxPrice('')
    setSelectedBreed('')
  }

  const breeds = Array.from(new Set(horses.map(h => h.breed).filter(Boolean)))

  return (
    <div className="h-screen flex flex-col">
      {/* Compact Header with Search & Filters */}
      <div className="bg-white border-b px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Location Search */}
          <div className="flex-1 max-w-md">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
                placeholder="City, State or ZIP code"
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
              <button
                onClick={handleLocationSearch}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
              >
                <Search className="h-4 w-4" />
                Search
              </button>
            </div>
          </div>

          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </button>

          {/* Results Count */}
          <div className="text-sm text-gray-600 whitespace-nowrap">
            <span className="font-semibold">{filteredHorses.length}</span> horses
          </div>
        </div>

        {/* Expandable Filters Panel */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {/* Distance */}
              {userLocation && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Max Distance: {maxDistance} miles
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="10"
                    value={maxDistance}
                    onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}

              {/* Min Price */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Min Price</label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value ? parseInt(e.target.value) : '')}
                  placeholder="$0"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>

              {/* Max Price */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Max Price</label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value ? parseInt(e.target.value) : '')}
                  placeholder="No max"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>

              {/* Breed */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Breed</label>
                <select
                  value={selectedBreed}
                  onChange={(e) => setSelectedBreed(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                >
                  <option value="">All Breeds</option>
                  {breeds.map(breed => (
                    <option key={breed} value={breed}>{breed}</option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-3 py-2 text-sm text-green-600 hover:text-green-700 font-medium border border-green-600 rounded-lg hover:bg-green-50 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Split View: Map + List */}
      <div className="flex-1 overflow-hidden flex">
        {loading ? (
          <div className="h-full w-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          </div>
        ) : (
          <>
            {/* Map Section - Left 60% */}
            <div className="w-3/5 h-full relative">
              <HorseMap
                horses={filteredHorses}
                onHorseClick={(horse) => setSelectedHorse(horse)}
                onBoundsChange={handleMapBoundsChange}
                hoveredHorseId={hoveredHorseId}
                clickedHorseId={clickedHorseId}
                centerLocation={mapCenter}
                bounds={mapBounds}
              />

              {/* Search this area button */}
              {showSearchThisArea && !searchAsMove && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <button
                    onClick={handleSearchThisArea}
                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-full shadow-lg transition-all hover:scale-105"
                  >
                    Search this area
                  </button>
                </div>
              )}

              {/* Search as I move toggle */}
              <div className="absolute bottom-4 left-4 z-10">
                <label className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-md cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={searchAsMove}
                    onChange={(e) => setSearchAsMove(e.target.checked)}
                    className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Search as I move the map</span>
                </label>
              </div>
            </div>

            {/* List Section - Right 40% */}
            <div className="w-2/5 h-full overflow-y-auto bg-gray-50 border-l">
              {/* List Header with Sort */}
              <div className="sticky top-0 bg-white border-b px-4 py-3 z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Horses for You</h3>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="recommended">Horses for You</option>
                    <option value="price-low">Price (Low to High)</option>
                    <option value="price-high">Price (High to Low)</option>
                    <option value="newest">Newest</option>
                    {userLocation && <option value="distance">Distance</option>}
                  </select>
                </div>
              </div>

              {/* Horse Cards - 2 Column Grid like Zillow */}
              <div className="p-3 grid grid-cols-2 gap-3">
                {filteredHorses.length === 0 ? (
                  <div className="col-span-2 text-center py-12 text-gray-500">
                    <MapIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No horses found in this area</p>
                    <p className="text-sm mt-1">Try adjusting your filters</p>
                  </div>
                ) : (
                  filteredHorses.map(horse => {
                    const primaryImage = horse.horse_images?.find(img => img.is_primary)
                    const firstImage = horse.horse_images?.[0]
                    const imageUrl = primaryImage?.url || firstImage?.url

                    return (
                      <div
                        key={horse.id}
                        className={`bg-white rounded-lg shadow hover:shadow-lg transition-all overflow-hidden cursor-pointer group ${
                          selectedHorse?.id === horse.id ? 'ring-2 ring-green-600' : ''
                        }`}
                        onClick={() => {
                          setSelectedHorse(horse)
                          setClickedHorseId(horse.id)
                          // Pan map to this horse
                          if (horse.latitude && horse.longitude) {
                            setMapCenter({ lat: horse.latitude, lng: horse.longitude })
                          }
                        }}
                        onMouseEnter={() => setHoveredHorseId(horse.id)}
                        onMouseLeave={() => setHoveredHorseId(null)}
                      >
                        {/* Image */}
                        <div className="relative aspect-[4/3] bg-gray-200">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={horse.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 50vw, 20vw"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-gray-400 text-sm">No image</span>
                            </div>
                          )}
                          {/* Heart/Save Button */}
                          <button className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100">
                            <Heart className="h-4 w-4 text-gray-700" />
                          </button>
                        </div>

                        {/* Details */}
                        <div className="p-3">
                          <p className="text-lg font-bold text-green-600 mb-1">
                            ${horse.price.toLocaleString()}
                          </p>
                          <div className="text-xs text-gray-600 mb-1.5">
                            {horse.breed && horse.breed}
                            {horse.age && ` • ${horse.age} yrs`}
                            {horse.gender && ` • ${horse.gender}`}
                          </div>
                          <h4 className="font-medium text-gray-900 text-sm truncate mb-1">
                            {horse.name}
                          </h4>
                          <p className="text-xs text-gray-500 truncate">
                            {typeof horse.location === 'string'
                              ? horse.location
                              : `${(horse.location as any)?.city || ''}, ${(horse.location as any)?.state || ''}`}
                          </p>
                          {/* Farm Info */}
                          {(horse as any).farm_name && (
                            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t">
                              {(horse as any).farm_logo_url && (
                                <div className="relative w-4 h-4 flex-shrink-0">
                                  <Image
                                    src={(horse as any).farm_logo_url}
                                    alt={(horse as any).farm_name || 'Farm logo'}
                                    fill
                                    className="object-contain"
                                    sizes="16px"
                                  />
                                </div>
                              )}
                              <span className="text-xs text-gray-500 truncate">
                                {(horse as any).farm_name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Detail Panel Overlay - Shows over everything when a horse is selected */}
            <HorseDetailPanel
              horse={selectedHorse}
              onClose={() => setSelectedHorse(null)}
              onHorseChange={(newHorse) => setSelectedHorse(newHorse as Horse)}
            />
          </>
        )}
      </div>
    </div>
  )
}
