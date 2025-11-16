'use client'

import { useState } from 'react'
import { Search, MapPin, DollarSign } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SearchBarProps {
  variant?: 'hero' | 'header'
}

export function SearchBar({ variant = 'header' }: SearchBarProps) {
  const [breed, setBreed] = useState('')
  const [state, setState] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const router = useRouter()

  const isHero = variant === 'hero'

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    const params = new URLSearchParams()
    if (breed) params.set('breed', breed)
    if (state) params.set('location', state)
    if (maxPrice) params.set('maxPrice', maxPrice)

    const queryString = params.toString()
    router.push(`/horses/map${queryString ? `?${queryString}` : ''}`)
  }

  const handleQuickFilter = (discipline: string) => {
    router.push(`/horses/map?disciplines=${discipline}`)
  }

  return (
    <div className={`${isHero ? '-mt-16 relative z-30' : ''} w-full px-4`}>
      <div className={`${isHero ? 'max-w-6xl' : 'max-w-4xl'} mx-auto`}>
        <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Breed or keywords"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="State (e.g. CA, TX)"
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="number"
                placeholder="Max price"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              className="bg-slate-800 text-white px-6 py-3 rounded-lg hover:bg-slate-900 transition-all flex items-center justify-center gap-2 font-semibold shadow-sm"
            >
              <Search className="h-5 w-5" />
              Search
            </button>
          </div>

          {isHero && (
            <div className="mt-5 pt-5 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">Popular disciplines:</p>
              <div className="flex flex-wrap gap-2">
                {['Dressage', 'Jumping', 'Western', 'Trail', 'Eventing', 'Hunter'].map((discipline) => (
                  <button
                    key={discipline}
                    type="button"
                    onClick={() => handleQuickFilter(discipline)}
                    className="px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-slate-800 hover:text-white transition-all font-medium"
                  >
                    {discipline}
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}