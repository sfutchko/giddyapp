import { Skeleton } from '@/components/ui/skeleton'
import { ProfileSkeleton, TableSkeleton } from '@/components/ui/loading-states'

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section Skeleton */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <Skeleton variant="text" width={300} height={32} className="mb-2" />
          <Skeleton variant="text" width={400} />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <Skeleton variant="circular" width={40} height={40} />
                <Skeleton variant="text" width={60} />
              </div>
              <Skeleton variant="text" width={100} height={24} className="mb-1" />
              <Skeleton variant="text" width={80} />
            </div>
          ))}
        </div>

        {/* Recent Activity Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <Skeleton variant="text" width={150} height={24} className="mb-4" />
            <TableSkeleton rows={3} columns={3} />
          </div>
          <div>
            <Skeleton variant="text" width={150} height={24} className="mb-4" />
            <TableSkeleton rows={3} columns={3} />
          </div>
        </div>
      </div>
    </div>
  )
}