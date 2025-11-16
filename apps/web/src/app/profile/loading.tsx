import { Skeleton } from '@/components/ui/skeleton'

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header skeleton */}
          <Skeleton variant="rectangular" height={128} className="w-full" />

          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 sm:-mt-12 gap-4">
              {/* Avatar skeleton */}
              <Skeleton variant="circular" width={128} height={128} className="border-4 border-white" />

              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 mb-2">
                  <Skeleton variant="text" width={200} height={36} />
                  <Skeleton variant="rounded" width={120} height={28} />
                </div>

                <div className="flex flex-wrap gap-4 mb-4">
                  {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} variant="text" width={120} height={20} />
                  ))}
                </div>

                <Skeleton variant="text" width="80%" height={20} />
              </div>

              <Skeleton variant="rounded" width={120} height={40} />
            </div>
          </div>

          {/* Stats skeleton */}
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="text-center">
                  <Skeleton variant="text" width={60} height={32} className="mx-auto mb-1" />
                  <Skeleton variant="text" width={80} height={16} className="mx-auto" />
                </div>
              ))}
            </div>
          </div>

          {/* Tabs skeleton */}
          <div className="border-t border-gray-200">
            <div className="flex">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} variant="text" width={100} height={48} className="flex-1" />
              ))}
            </div>
          </div>
        </div>

        {/* Content skeleton */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Skeleton variant="rectangular" height={200} className="rounded-lg" />
          </div>
          <div className="lg:col-span-2">
            <Skeleton variant="rectangular" height={300} className="rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}