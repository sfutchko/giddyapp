'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface SimilarHorse {
  id: string
  slug: string
  name: string
  breed: string
  age: number
  price: number
  horse_images: Array<{ url: string; is_primary: boolean }>
}

interface SimilarHorsesProps {
  horses: SimilarHorse[]
}

export function SimilarHorses({ horses }: SimilarHorsesProps) {
  if (!horses || horses.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Similar Horses</h2>
      <div className="space-y-4">
        {horses.map((horse) => {
          const primaryImage = horse.horse_images?.find(img => img.is_primary)?.url ||
                               horse.horse_images?.[0]?.url

          return (
            <Link
              key={horse.id}
              href={`/horses/${horse.slug}`}
              className="flex gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              {primaryImage && (
                <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={primaryImage}
                    alt={horse.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors truncate">
                  {horse.name}
                </h3>
                <p className="text-sm text-gray-600 mb-1">
                  {horse.breed} • {horse.age} years
                </p>
                <p className="text-lg font-bold text-green-600">
                  ${horse.price.toLocaleString()}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 self-center" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
