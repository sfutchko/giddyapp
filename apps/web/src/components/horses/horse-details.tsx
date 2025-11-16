'use client'

import { Calendar, Ruler, MapPin, Flag } from 'lucide-react'
import { ShareButton } from './share-button'
import { PrintButton } from './print-button'

interface HorseDetailsProps {
  horse: any
}

export function HorseDetails({ horse }: HorseDetailsProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{horse.name}</h1>
          <p className="text-lg text-gray-600 mt-1">
            {horse.breed} • {horse.gender.toLowerCase()}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <ShareButton
            url={`/horses/${horse.slug}`}
            title={`${horse.name} - ${horse.breed}`}
            description={horse.description?.substring(0, 150)}
          />
          <PrintButton slug={horse.slug} />
          <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            <Flag className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-6 border-b">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{horse.age}</p>
          <p className="text-sm text-gray-600">Years old</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Ruler className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{horse.height} hh</p>
          <p className="text-sm text-gray-600">Hands</p>
        </div>
        {horse.weight && (
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Weight</p>
            <p className="text-2xl font-bold text-gray-900">{horse.weight}</p>
            <p className="text-sm text-gray-600">Pounds</p>
          </div>
        )}
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Color</p>
          <p className="text-lg font-bold text-gray-900">{horse.color}</p>
        </div>
      </div>

      {/* Description */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Description</h2>
        <p className="text-gray-700 whitespace-pre-line leading-relaxed">
          {horse.description}
        </p>
      </div>

      {/* Additional Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {horse.metadata?.disciplines && horse.metadata.disciplines.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Disciplines</h3>
            <div className="flex flex-wrap gap-2">
              {horse.metadata.disciplines.map((discipline: string) => (
                <span
                  key={discipline}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                >
                  {discipline}
                </span>
              ))}
            </div>
          </div>
        )}

        {horse.metadata?.temperament && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Temperament</h3>
            <p className="text-gray-700">{horse.metadata.temperament}</p>
          </div>
        )}

        {horse.metadata?.healthStatus && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Health Status</h3>
            <p className="text-gray-700">{horse.metadata.healthStatus}</p>
          </div>
        )}

        {horse.metadata?.registrations && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Registrations</h3>
            <p className="text-gray-700">{horse.metadata.registrations}</p>
          </div>
        )}

        {horse.metadata?.competitionHistory && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Competition History</h3>
            <p className="text-gray-700 whitespace-pre-line">{horse.metadata.competitionHistory}</p>
          </div>
        )}
      </div>

      {/* Location */}
      <div className="mt-6 pt-6 border-t">
        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-gray-400" />
          Location
        </h3>
        <p className="text-gray-700">
          {horse.location?.city}, {horse.location?.state} {horse.location?.zipCode}
        </p>
        {horse.location?.country && (
          <p className="text-gray-500 text-sm mt-1">{horse.location.country}</p>
        )}
      </div>
    </div>
  )
}