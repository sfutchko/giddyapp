import { HorseListingSkeleton } from '@/components/ui/loading-states'
import { Skeleton } from '@/components/ui/skeleton'

export default function HorsesLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header skeleton */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton variant="text" width={200} height={32} className="mb-2" />
              <Skeleton variant="text" width={150} height={20} />
            </div>
            <Skeleton variant="rounded" width={120} height={40} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters skeleton */}
          <div className="w-full lg:w-64">
            <div className="bg-white rounded-lg shadow p-6">
              <Skeleton variant="text" width={100} height={24} className="mb-4" />
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="mb-6">
                  <Skeleton variant="text" width={80} className="mb-2" />
                  <Skeleton variant="rectangular" height={40} />
                </div>
              ))}
            </div>
          </div>

          {/* Grid skeleton */}
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <HorseListingSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}