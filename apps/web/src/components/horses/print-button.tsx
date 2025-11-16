'use client'

import { Printer } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PrintButtonProps {
  slug: string
  className?: string
}

export function PrintButton({ slug, className = '' }: PrintButtonProps) {
  const router = useRouter()

  const handlePrint = () => {
    const printWindow = window.open(`/horses/${slug}/print`, '_blank')
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.print()
      })
    }
  }

  return (
    <button
      onClick={handlePrint}
      className={`p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors ${className}`}
      aria-label="Print listing"
    >
      <Printer className="h-5 w-5 text-gray-600" />
    </button>
  )
}
