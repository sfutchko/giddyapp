'use client'

import { useCompare } from '@/contexts/compare-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { X, GitCompare, ArrowLeft } from 'lucide-react'

export default function ComparePage() {
  const { compareList, removeFromCompare, clearCompare } = useCompare()
  const router = useRouter()

  if (compareList.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <GitCompare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">No Horses to Compare</h1>
          <p className="text-gray-600 mb-8">
            Add horses to your comparison list to see them side-by-side
          </p>
          <Link
            href="/horses/map"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            <ArrowLeft className="h-5 w-5" />
            Browse Horses
          </Link>
        </div>
      </div>
    )
  }

  const attributes = [
    { key: 'price', label: 'Price', format: (v: number) => `$${v.toLocaleString()}` },
    { key: 'breed', label: 'Breed' },
    { key: 'age', label: 'Age', format: (v: number) => `${v} years` },
    { key: 'gender', label: 'Gender', format: (v: string) => v.toLowerCase() },
    { key: 'height', label: 'Height', format: (v: number) => `${v} hands` },
    { key: 'color', label: 'Color' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Compare Horses</h1>
            <p className="mt-2 text-gray-600">
              Comparing {compareList.length} {compareList.length === 1 ? 'horse' : 'horses'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={clearCompare}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            >
              Clear All
            </button>
            <Link
              href="/horses/map"
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Browse
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 bg-gray-50 sticky left-0 z-10">
                  Attribute
                </th>
                {compareList.map((horse) => (
                  <th
                    key={horse.id}
                    className="px-6 py-4 text-center min-w-[250px] bg-gray-50"
                  >
                    <div className="relative">
                      <button
                        onClick={() => removeFromCompare(horse.id)}
                        className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      {horse.image && (
                        <img
                          src={horse.image}
                          alt={horse.name}
                          className="w-full h-40 object-cover rounded-lg mb-3"
                        />
                      )}
                      <Link
                        href={`/horses/${horse.slug}`}
                        className="font-bold text-gray-900 hover:text-green-600 transition-colors block"
                      >
                        {horse.name}
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attributes.map((attr, idx) => (
                <tr key={attr.key} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 sticky left-0 z-10 bg-inherit">
                    {attr.label}
                  </td>
                  {compareList.map((horse) => {
                    const value = (horse as any)[attr.key]
                    // @ts-ignore - attr.format types are overly strict
                    const displayValue = attr.format ? attr.format(value) : (value || '-')

                    return (
                      <td
                        key={horse.id}
                        className="px-6 py-4 text-center text-gray-700"
                      >
                        {displayValue}
                      </td>
                    )
                  })}
                </tr>
              ))}

              <tr className="border-t-2">
                <td className="px-6 py-4 text-sm font-medium text-gray-900 sticky left-0 z-10 bg-white">
                  Actions
                </td>
                {compareList.map((horse) => (
                  <td key={horse.id} className="px-6 py-4 text-center">
                    <Link
                      href={`/horses/${horse.slug}`}
                      className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                    >
                      View Details
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {compareList.length < 4 && (
          <div className="mt-6 text-center">
            <p className="text-gray-600 mb-3">
              You can compare up to 4 horses. Add {4 - compareList.length} more to get a better comparison.
            </p>
            <Link
              href="/horses/map"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Add More Horses
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
