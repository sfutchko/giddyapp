'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface CompareHorse {
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

interface CompareContextType {
  compareList: CompareHorse[]
  addToCompare: (horse: CompareHorse) => void
  removeFromCompare: (horseId: string) => void
  isInCompare: (horseId: string) => boolean
  clearCompare: () => void
  canAddMore: boolean
}

const CompareContext = createContext<CompareContextType | undefined>(undefined)

const MAX_COMPARE = 4

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareList, setCompareList] = useState<CompareHorse[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('compare_horses')
    if (stored) {
      try {
        setCompareList(JSON.parse(stored))
      } catch (error) {
        console.error('Error loading compare list:', error)
      }
    }
    setIsHydrated(true)
  }, [])

  // Save to localStorage whenever compareList changes
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('compare_horses', JSON.stringify(compareList))
    }
  }, [compareList, isHydrated])

  const addToCompare = (horse: CompareHorse) => {
    if (compareList.length >= MAX_COMPARE) {
      return
    }
    if (!compareList.find(h => h.id === horse.id)) {
      setCompareList([...compareList, horse])
    }
  }

  const removeFromCompare = (horseId: string) => {
    setCompareList(compareList.filter(h => h.id !== horseId))
  }

  const isInCompare = (horseId: string) => {
    return compareList.some(h => h.id === horseId)
  }

  const clearCompare = () => {
    setCompareList([])
  }

  const canAddMore = compareList.length < MAX_COMPARE

  return (
    <CompareContext.Provider
      value={{
        compareList,
        addToCompare,
        removeFromCompare,
        isInCompare,
        clearCompare,
        canAddMore,
      }}
    >
      {children}
    </CompareContext.Provider>
  )
}

export function useCompare() {
  const context = useContext(CompareContext)
  if (context === undefined) {
    throw new Error('useCompare must be used within a CompareProvider')
  }
  return context
}
