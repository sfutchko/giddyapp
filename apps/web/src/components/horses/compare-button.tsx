'use client'

import { GitCompare, Check } from 'lucide-react'
import { useCompare } from '@/contexts/compare-context'
import { toast } from 'sonner'

interface CompareButtonProps {
  horse: {
    id: string
    name: string
    slug: string
    breed: string
    age: number
    gender: string
    height: number
    price: number
    color: string
    image?: string
  }
  variant?: 'icon' | 'button'
  className?: string
}

export function CompareButton({ horse, variant = 'icon', className = '' }: CompareButtonProps) {
  const { addToCompare, removeFromCompare, isInCompare, canAddMore } = useCompare()
  const inCompare = isInCompare(horse.id)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (inCompare) {
      removeFromCompare(horse.id)
      toast.success('Removed from compare')
    } else {
      if (!canAddMore) {
        toast.error('You can only compare up to 4 horses')
        return
      }
      addToCompare(horse)
      toast.success('Added to compare')
    }
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        className={`p-2 rounded-lg transition-colors ${
          inCompare
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-white/90 text-gray-700 hover:bg-white'
        } ${className}`}
        title={inCompare ? 'Remove from compare' : 'Add to compare'}
      >
        {inCompare ? (
          <Check className="h-4 w-4" />
        ) : (
          <GitCompare className="h-4 w-4" />
        )}
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
        inCompare
          ? 'bg-green-600 text-white hover:bg-green-700'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      } ${className}`}
    >
      {inCompare ? (
        <>
          <Check className="h-4 w-4" />
          In Comparison
        </>
      ) : (
        <>
          <GitCompare className="h-4 w-4" />
          Compare
        </>
      )}
    </button>
  )
}
