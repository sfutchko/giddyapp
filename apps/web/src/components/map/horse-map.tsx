'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl/mapbox'
import { MapPin } from 'lucide-react'
import 'mapbox-gl/dist/mapbox-gl.css'

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
  images?: Array<{ url: string; is_primary: boolean }>
}

interface HorseMapProps {
  horses: Horse[]
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number }) => void
  onHorseClick?: (horse: Horse) => void
  hoveredHorseId?: string | null
  clickedHorseId?: string | null
  centerLocation?: { lat: number; lng: number } | null
  bounds?: [number, number, number, number] | null // [west, south, east, north]
}

// Helper function to format price for map markers
function formatMapPrice(price: number): string {
  if (price >= 1000000) {
    // For millions: show as "X.XM"
    return `${(price / 1000000).toFixed(1)}M`
  } else {
    // For thousands: show as "XXk"
    return `${(price / 1000).toFixed(0)}k`
  }
}

export function HorseMap({ horses, onBoundsChange, onHorseClick, hoveredHorseId, clickedHorseId, centerLocation, bounds }: HorseMapProps) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  const [viewState, setViewState] = useState({
    longitude: -95.7129,
    latitude: 37.0902,
    zoom: 4
  })

  const mapRef = useRef<any>(null)
  const [clickedLocation, setClickedLocation] = useState<string | null>(null)
  const [locationClickIndex, setLocationClickIndex] = useState<{ [key: string]: number }>({})

  // Update map center when centerLocation changes (from search)
  useEffect(() => {
    if (centerLocation) {
      setViewState(prev => ({
        ...prev,
        latitude: centerLocation.lat,
        longitude: centerLocation.lng,
        zoom: 11
      }))
    }
  }, [centerLocation])

  // Fit map to bounds when bounds change (for state/region searches)
  useEffect(() => {
    if (bounds && mapRef.current) {
      const [west, south, east, north] = bounds
      mapRef.current.fitBounds(
        [[west, south], [east, north]],
        {
          padding: 40,
          duration: 1000
        }
      )
    }
  }, [bounds])

  // Calculate center from horses with coordinates (initial load only)
  useEffect(() => {
    if (!centerLocation) {
      const horsesWithCoords = horses.filter(h => h.latitude && h.longitude)
      if (horsesWithCoords.length > 0) {
        const avgLat = horsesWithCoords.reduce((sum, h) => sum + (h.latitude || 0), 0) / horsesWithCoords.length
        const avgLng = horsesWithCoords.reduce((sum, h) => sum + (h.longitude || 0), 0) / horsesWithCoords.length

        setViewState(prev => ({
          ...prev,
          latitude: avgLat,
          longitude: avgLng,
          zoom: 6
        }))
      }
    }
  }, [horses, centerLocation])

  const handleMoveEnd = useCallback(() => {
    if (mapRef.current && onBoundsChange) {
      const bounds = mapRef.current.getBounds()
      if (bounds) {
        onBoundsChange({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest()
        })
      }
    }
  }, [onBoundsChange])

  if (!mapboxToken) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <p className="text-gray-600">Map not configured. Please add NEXT_PUBLIC_MAPBOX_TOKEN to your environment variables.</p>
        <p className="text-sm text-gray-500 mt-2">Get your token at <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">mapbox.com</a></p>
      </div>
    )
  }

  const horsesWithCoords = horses.filter(h => h.latitude && h.longitude)

  // Group horses by location (lat/lng rounded to 5 decimals to handle near-duplicates)
  const horsesByLocation = horsesWithCoords.reduce((acc, horse) => {
    const key = `${horse.latitude?.toFixed(5)},${horse.longitude?.toFixed(5)}`
    if (!acc[key]) acc[key] = []
    acc[key].push(horse)
    return acc
  }, {} as { [key: string]: Horse[] })

  // Handle marker click - cycle through horses at same location
  const handleMarkerClick = (locationKey: string, horsesAtLocation: Horse[]) => {
    if (horsesAtLocation.length === 1) {
      onHorseClick?.(horsesAtLocation[0])
      setClickedLocation(locationKey)
    } else {
      // Multiple horses at this location - cycle through them
      const currentIndex = locationClickIndex[locationKey] || 0
      const nextIndex = (currentIndex + 1) % horsesAtLocation.length

      setLocationClickIndex(prev => ({
        ...prev,
        [locationKey]: nextIndex
      }))
      setClickedLocation(locationKey)
      onHorseClick?.(horsesAtLocation[nextIndex])
    }
  }

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-lg overflow-hidden">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onMoveEnd={handleMoveEnd}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={mapboxToken}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Navigation Controls */}
        <NavigationControl position="top-right" />
        <GeolocateControl position="top-right" />

        {/* Horse Markers */}
        {Object.entries(horsesByLocation).map(([locationKey, horsesAtLocation]) => {
          const currentIndex = locationClickIndex[locationKey] || 0
          const displayHorse = horsesAtLocation[currentIndex]
          const hasMultiple = horsesAtLocation.length > 1
          const isActive = clickedLocation === locationKey
          const isHovered = hoveredHorseId && horsesAtLocation.some(h => h.id === hoveredHorseId)
          const isClicked = clickedHorseId && horsesAtLocation.some(h => h.id === clickedHorseId)

          return (
            <Marker
              key={locationKey}
              longitude={displayHorse.longitude!}
              latitude={displayHorse.latitude!}
              anchor="bottom"
              onClick={e => {
                e.originalEvent.stopPropagation()
                handleMarkerClick(locationKey, horsesAtLocation)
              }}
            >
              <button className="relative group cursor-pointer">
                <div className={`${
                  isActive || isClicked ? 'bg-green-700 scale-110' : isHovered ? 'bg-green-700 scale-105' : 'bg-green-600'
                } text-white px-3 py-1.5 rounded-full shadow-lg hover:bg-green-700 transition-all flex items-center gap-1 text-sm font-medium`}>
                  <MapPin className="h-4 w-4" />
                  ${formatMapPrice(displayHorse.price)}
                  {hasMultiple && (
                    <span className="ml-1 bg-white text-green-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                      {horsesAtLocation.length}
                    </span>
                  )}
                </div>
                <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent ${
                  isActive ? 'border-t-green-700' : 'border-t-green-600'
                } group-hover:border-t-green-700`}></div>
              </button>
            </Marker>
          )
        })}
      </Map>

      {/* Stats Overlay */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg px-4 py-2">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{horsesWithCoords.length}</span> horses on map
        </p>
      </div>
    </div>
  )
}
