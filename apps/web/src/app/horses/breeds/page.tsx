import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface BreedCount {
  breed: string
  count: number
}

async function getBreedCounts(): Promise<BreedCount[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('horses')
    .select('breed')
    .eq('status', 'ACTIVE')

  if (!data) return []

  const breedMap = data.reduce((acc, horse) => {
    if (horse.breed) {
      acc[horse.breed] = (acc[horse.breed] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  return Object.entries(breedMap)
    .map(([breed, count]) => ({ breed, count }))
    .sort((a, b) => b.count - a.count)
}

function createBreedSlug(breed: string): string {
  return breed.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

const POPULAR_BREEDS = [
  'Quarter Horse',
  'Thoroughbred',
  'Arabian',
  'Paint',
  'Warmblood',
  'Appaloosa',
  'Morgan',
  'Tennessee Walking Horse',
]

export default async function BreedsPage() {
  const breeds = await getBreedCounts()
  const totalHorses = breeds.reduce((sum, b) => sum + b.count, 0)

  const popularBreeds = breeds.filter(b => POPULAR_BREEDS.includes(b.breed))
  const otherBreeds = breeds.filter(b => !POPULAR_BREEDS.includes(b.breed))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Browse Horses by Breed
          </h1>
          <p className="text-lg text-gray-600">
            {totalHorses.toLocaleString()} horses across {breeds.length} breeds
          </p>
        </div>

        {/* Popular Breeds Section */}
        {popularBreeds.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Popular Breeds
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {popularBreeds.map((breed) => (
                <Link
                  key={breed.breed}
                  href={`/horses?breed=${encodeURIComponent(breed.breed)}`}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6 group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                        {breed.breed}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {breed.count} {breed.count === 1 ? 'horse' : 'horses'}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* All Breeds Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            All Breeds
          </h2>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="divide-y divide-gray-200">
              {otherBreeds.map((breed) => (
                <Link
                  key={breed.breed}
                  href={`/horses?breed=${encodeURIComponent(breed.breed)}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
                >
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                      {breed.breed}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                      {breed.count} {breed.count === 1 ? 'horse' : 'horses'}
                    </span>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Empty State */}
        {breeds.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500">No breeds found</p>
          </div>
        )}
      </div>
    </div>
  )
}
