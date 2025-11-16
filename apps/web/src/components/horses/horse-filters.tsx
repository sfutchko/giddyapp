'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback } from 'react'
import { ChevronDown, ChevronUp, Filter } from 'lucide-react'

const BREEDS = [
  'Quarter Horse',
  'Thoroughbred',
  'Arabian',
  'Paint Horse',
  'Appaloosa',
  'Warmblood',
  'Morgan',
  'Tennessee Walker',
  'Mustang',
  'Standardbred',
  'Other'
]

const DISCIPLINES = [
  'Trail Riding',
  'Western Pleasure',
  'English Pleasure',
  'Dressage',
  'Jumping',
  'Eventing',
  'Barrel Racing',
  'Reining',
  'Cutting',
  'Endurance',
  'Driving',
  'Ranch Work',
  'Therapeutic',
  'Breeding',
  'Other',
]

const COLORS = [
  'Bay',
  'Black',
  'Chestnut',
  'Gray',
  'Palomino',
  'Buckskin',
  'Dun',
  'Roan',
  'Pinto',
  'Appaloosa',
  'Cremello',
  'White',
  'Other'
]

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
]

export function HorseFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['price', 'breed', 'age'])
  )
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>(
    searchParams.get('disciplines')?.split(',').filter(Boolean) || []
  )

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const updateFilter = useCallback((key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString())

    if (value && value !== '') {
      params.set(key, value)
    } else {
      params.delete(key)
    }

    router.push(`/horses?${params.toString()}`)
  }, [router, searchParams])

  const toggleDiscipline = useCallback((discipline: string) => {
    const newSelected = selectedDisciplines.includes(discipline)
      ? selectedDisciplines.filter(d => d !== discipline)
      : [...selectedDisciplines, discipline]

    setSelectedDisciplines(newSelected)

    const params = new URLSearchParams(searchParams.toString())
    if (newSelected.length > 0) {
      params.set('disciplines', newSelected.join(','))
    } else {
      params.delete('disciplines')
    }

    router.push(`/horses?${params.toString()}`)
  }, [selectedDisciplines, router, searchParams])

  const clearFilters = () => {
    router.push('/horses')
  }

  const hasActiveFilters = Array.from(searchParams.keys()).length > 0

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters
        </h2>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-green-600 hover:text-green-700"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Sort */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
        <select
          value={searchParams.get('sortBy') || 'recent'}
          onChange={(e) => updateFilter('sortBy', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="recent">Most Recent</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="age_asc">Age: Young to Old</option>
          <option value="age_desc">Age: Old to Young</option>
        </select>
      </div>

      {/* Price Range */}
      <div className="border-b pb-4 mb-4">
        <button
          onClick={() => toggleSection('price')}
          className="w-full flex items-center justify-between text-left"
        >
          <span className="font-medium text-gray-900">Price Range</span>
          {expandedSections.has('price') ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>

        {expandedSections.has('price') && (
          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={searchParams.get('minPrice') || ''}
                onChange={(e) => updateFilter('minPrice', e.target.value)}
                className="w-1/2 px-3 py-1 border border-gray-300 rounded text-sm"
              />
              <input
                type="number"
                placeholder="Max"
                value={searchParams.get('maxPrice') || ''}
                onChange={(e) => updateFilter('maxPrice', e.target.value)}
                className="w-1/2 px-3 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Breed */}
      <div className="border-b pb-4 mb-4">
        <button
          onClick={() => toggleSection('breed')}
          className="w-full flex items-center justify-between text-left"
        >
          <span className="font-medium text-gray-900">Breed</span>
          {expandedSections.has('breed') ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>

        {expandedSections.has('breed') && (
          <div className="mt-3">
            <select
              value={searchParams.get('breed') || ''}
              onChange={(e) => updateFilter('breed', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Breeds</option>
              {BREEDS.map(breed => (
                <option key={breed} value={breed}>{breed}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Age */}
      <div className="border-b pb-4 mb-4">
        <button
          onClick={() => toggleSection('age')}
          className="w-full flex items-center justify-between text-left"
        >
          <span className="font-medium text-gray-900">Age</span>
          {expandedSections.has('age') ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>

        {expandedSections.has('age') && (
          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                min="0"
                value={searchParams.get('minAge') || ''}
                onChange={(e) => updateFilter('minAge', e.target.value)}
                className="w-1/2 px-3 py-1 border border-gray-300 rounded text-sm"
              />
              <input
                type="number"
                placeholder="Max"
                min="0"
                value={searchParams.get('maxAge') || ''}
                onChange={(e) => updateFilter('maxAge', e.target.value)}
                className="w-1/2 px-3 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Gender */}
      <div className="border-b pb-4 mb-4">
        <button
          onClick={() => toggleSection('gender')}
          className="w-full flex items-center justify-between text-left"
        >
          <span className="font-medium text-gray-900">Gender</span>
          {expandedSections.has('gender') ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>

        {expandedSections.has('gender') && (
          <div className="mt-3 space-y-2">
            {['MARE', 'GELDING', 'STALLION'].map(gender => (
              <label key={gender} className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value={gender}
                  checked={searchParams.get('gender') === gender}
                  onChange={(e) => updateFilter('gender', e.target.value)}
                  className="mr-2 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm capitalize">{gender.toLowerCase()}</span>
              </label>
            ))}
            <label className="flex items-center">
              <input
                type="radio"
                name="gender"
                value=""
                checked={!searchParams.get('gender')}
                onChange={() => updateFilter('gender', undefined)}
                className="mr-2 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm">All</span>
            </label>
          </div>
        )}
      </div>

      {/* Location */}
      <div className="border-b pb-4 mb-4">
        <button
          onClick={() => toggleSection('location')}
          className="w-full flex items-center justify-between text-left"
        >
          <span className="font-medium text-gray-900">Location</span>
          {expandedSections.has('location') ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>

        {expandedSections.has('location') && (
          <div className="mt-3">
            <select
              value={searchParams.get('state') || ''}
              onChange={(e) => updateFilter('state', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All States</option>
              {US_STATES.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Height Range */}
      <div className="border-b pb-4 mb-4">
        <button
          onClick={() => toggleSection('height')}
          className="w-full flex items-center justify-between text-left"
        >
          <span className="font-medium text-gray-900">Height (hands)</span>
          {expandedSections.has('height') ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>

        {expandedSections.has('height') && (
          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                step="0.1"
                min="0"
                value={searchParams.get('minHeight') || ''}
                onChange={(e) => updateFilter('minHeight', e.target.value)}
                className="w-1/2 px-3 py-1 border border-gray-300 rounded text-sm"
              />
              <input
                type="number"
                placeholder="Max"
                step="0.1"
                min="0"
                value={searchParams.get('maxHeight') || ''}
                onChange={(e) => updateFilter('maxHeight', e.target.value)}
                className="w-1/2 px-3 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <p className="text-xs text-gray-500">Common range: 14.0 - 17.0 hands</p>
          </div>
        )}
      </div>

      {/* Disciplines */}
      <div className="border-b pb-4 mb-4">
        <button
          onClick={() => toggleSection('disciplines')}
          className="w-full flex items-center justify-between text-left"
        >
          <span className="font-medium text-gray-900">Disciplines</span>
          {expandedSections.has('disciplines') ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>

        {expandedSections.has('disciplines') && (
          <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
            {DISCIPLINES.map(discipline => (
              <label key={discipline} className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
                <input
                  type="checkbox"
                  checked={selectedDisciplines.includes(discipline)}
                  onChange={() => toggleDiscipline(discipline)}
                  className="mr-2 text-green-600 focus:ring-green-500 rounded"
                />
                <span className="text-sm">{discipline}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Color */}
      <div className="pb-4">
        <button
          onClick={() => toggleSection('color')}
          className="w-full flex items-center justify-between text-left"
        >
          <span className="font-medium text-gray-900">Color</span>
          {expandedSections.has('color') ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>

        {expandedSections.has('color') && (
          <div className="mt-3">
            <select
              value={searchParams.get('color') || ''}
              onChange={(e) => updateFilter('color', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Colors</option>
              {COLORS.map(color => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  )
}