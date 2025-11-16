'use client'

import { LoadingSpinner, LoadingDots } from './loading-spinner'
import { Skeleton, SkeletonCard, SkeletonText } from './skeleton'
import { cn } from '@/lib/utils'

interface PageLoadingProps {
  message?: string
}

export function PageLoading({ message = 'Loading...' }: PageLoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="xl" className="mb-4" />
        <p className="text-lg text-gray-600">{message}</p>
      </div>
    </div>
  )
}

interface SectionLoadingProps {
  className?: string
  message?: string
}

export function SectionLoading({ className, message }: SectionLoadingProps) {
  return (
    <div className={cn('py-12 flex flex-col items-center justify-center', className)}>
      <LoadingSpinner size="lg" className="mb-3" />
      {message && <p className="text-gray-600">{message}</p>}
    </div>
  )
}

interface InlineLoadingProps {
  className?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

export function InlineLoading({ className, size = 'sm' }: InlineLoadingProps) {
  return <LoadingSpinner size={size} className={cn('inline-flex ml-2', className)} />
}

interface ButtonLoadingProps {
  children: React.ReactNode
  isLoading?: boolean
  loadingText?: string
  className?: string
}

export function ButtonLoading({
  children,
  isLoading = false,
  loadingText = 'Loading...',
  className
}: ButtonLoadingProps) {
  return (
    <div className={cn('relative', className)}>
      {isLoading ? (
        <span className="flex items-center justify-center">
          <LoadingSpinner size="sm" variant="white" className="mr-2" />
          {loadingText}
        </span>
      ) : (
        children
      )}
    </div>
  )
}

// Specific skeleton loaders for common patterns
export function HorseListingSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <Skeleton variant="rectangular" height={256} className="w-full" />
      <div className="p-4">
        <Skeleton variant="text" className="mb-2 text-lg font-semibold" />
        <Skeleton variant="text" width="60%" className="mb-4" />
        <div className="flex items-center justify-between">
          <Skeleton variant="text" width={80} />
          <Skeleton variant="text" width={100} />
        </div>
      </div>
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="flex items-start space-x-4 p-6 bg-white rounded-lg">
      <Skeleton variant="circular" width={80} height={80} />
      <div className="flex-1">
        <Skeleton variant="text" width="40%" className="mb-2 text-xl" />
        <Skeleton variant="text" width="60%" className="mb-4" />
        <div className="flex space-x-4">
          <Skeleton variant="rounded" width={100} height={36} />
          <Skeleton variant="rounded" width={100} height={36} />
        </div>
      </div>
    </div>
  )
}

export function MessageSkeleton() {
  return (
    <div className="flex space-x-3 p-4">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-2">
          <Skeleton variant="text" width={120} />
          <Skeleton variant="text" width={60} />
        </div>
        <SkeletonText lines={2} />
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} variant="text" width={100} />
          ))}
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="flex space-x-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton
                  key={colIndex}
                  variant="text"
                  width={colIndex === 0 ? 150 : 100}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Loading overlay for async operations
interface LoadingOverlayProps {
  isVisible: boolean
  message?: string
  className?: string
}

export function LoadingOverlay({ isVisible, message, className }: LoadingOverlayProps) {
  if (!isVisible) return null

  return (
    <div
      className={cn(
        'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
        className
      )}
    >
      <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        {message && <p className="text-center text-gray-700">{message}</p>}
      </div>
    </div>
  )
}

// Lazy loading wrapper
interface LazyLoadWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
}

export function LazyLoadWrapper({
  children,
  fallback = <SectionLoading />,
  className
}: LazyLoadWrapperProps) {
  return (
    <div className={className}>
      <React.Suspense fallback={fallback}>
        {children}
      </React.Suspense>
    </div>
  )
}