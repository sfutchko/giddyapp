'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react'

interface HorseImage {
  url: string
  is_primary: boolean
  display_order?: number
}

interface ImageGalleryProps {
  images: HorseImage[]
  name: string
}

export function ImageGallery({ images, name }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Sort images by display order and primary status
  const sortedImages = [...images].sort((a, b) => {
    if (a.is_primary) return -1
    if (b.is_primary) return 1
    return (a.display_order || 0) - (b.display_order || 0)
  })

  const hasImages = sortedImages.length > 0

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? sortedImages.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === sortedImages.length - 1 ? 0 : prev + 1))
  }

  if (!hasImages) {
    return (
      <div className="bg-gray-200 rounded-lg h-96 flex items-center justify-center">
        <p className="text-gray-500">No images available</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Main Image */}
      <div className="relative h-96 lg:h-[500px] bg-gray-900">
        <Image
          src={sortedImages[currentIndex].url}
          alt={`${name} - Image ${currentIndex + 1}`}
          fill
          className="object-contain"
          priority
          sizes="(max-width: 1024px) 100vw, 66vw"
        />

        {/* Navigation Arrows */}
        {sortedImages.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Image Counter */}
        <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {sortedImages.length}
        </div>

        {/* Fullscreen Button */}
        <button
          className="absolute top-4 right-4 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-colors"
          aria-label="View fullscreen"
        >
          <Expand className="h-5 w-5" />
        </button>
      </div>

      {/* Thumbnail Strip */}
      {sortedImages.length > 1 && (
        <div className="bg-gray-100 p-4">
          <div className="flex gap-2 overflow-x-auto">
            {sortedImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`relative flex-shrink-0 w-20 h-20 rounded overflow-hidden border-2 transition-colors ${
                  currentIndex === index
                    ? 'border-green-600'
                    : 'border-transparent hover:border-gray-400'
                }`}
              >
                <Image
                  src={image.url}
                  alt={`${name} thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}