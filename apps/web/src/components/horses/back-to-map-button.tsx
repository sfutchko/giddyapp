'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function BackToMapButton() {
  const router = useRouter()

  const handleBack = () => {
    // Check if we came from the map
    if (document.referrer.includes('/horses/map')) {
      router.back()
    } else {
      // Otherwise go to map
      router.push('/horses/map')
    }
  }

  return (
    <button
      onClick={handleBack}
      className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium transition-colors"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to Map
    </button>
  )
}
