import { Suspense } from 'react'
import { MapSearchContent } from './map-search-content'

export const metadata = {
  title: 'Map Search - Find Horses Near You | GiddyApp',
  description: 'Search for horses on an interactive map. Find horses for sale near your location.'
}

export default function MapSearchPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<MapSearchSkeleton />}>
        <MapSearchContent />
      </Suspense>
    </div>
  )
}

function MapSearchSkeleton() {
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="animate-pulse text-gray-400">Loading map...</div>
    </div>
  )
}
