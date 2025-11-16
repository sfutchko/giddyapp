import { getHorses } from '@/lib/actions/horses'
import { HorseGrid } from '@/components/horses/horse-grid'
import { HorseFilters } from '@/components/horses/horse-filters'
import { SaveSearchButton } from '@/components/search/save-search-button'
import { Search, MapIcon } from 'lucide-react'
import Link from 'next/link'

export default async function HorsesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const filters = {
    minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
    breed: searchParams.breed as string | undefined,
    minAge: searchParams.minAge ? Number(searchParams.minAge) : undefined,
    maxAge: searchParams.maxAge ? Number(searchParams.maxAge) : undefined,
    minHeight: searchParams.minHeight ? Number(searchParams.minHeight) : undefined,
    maxHeight: searchParams.maxHeight ? Number(searchParams.maxHeight) : undefined,
    gender: searchParams.gender as string | undefined,
    color: searchParams.color as string | undefined,
    disciplines: searchParams.disciplines ? (searchParams.disciplines as string).split(',').filter(Boolean) : undefined,
    state: searchParams.state as string | undefined,
    sortBy: searchParams.sortBy as any,
  }

  const result = await getHorses(filters)

  if ('error' in result) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-red-600">Error loading horses. Please try again later.</p>
          </div>
        </div>
      </div>
    )
  }

  const horses = result.horses || []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Browse Horses</h1>
              <p className="mt-2 text-gray-600">
                {horses.length} {horses.length === 1 ? 'horse' : 'horses'} available
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/horses/map"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <MapIcon className="h-5 w-5" />
                Map View
              </Link>
              <SaveSearchButton />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className="w-64 flex-shrink-0">
            <HorseFilters />
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {horses.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="max-w-md mx-auto">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No horses found
                  </h3>
                  <p className="text-gray-600">
                    Try adjusting your filters or check back later for new listings.
                  </p>
                </div>
              </div>
            ) : (
              <HorseGrid horses={horses} />
            )}
          </main>
        </div>
      </div>
    </div>
  )
}