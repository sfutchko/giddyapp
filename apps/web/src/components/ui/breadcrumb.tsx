'use client'

import React from 'react'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ReactNode
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
  separator?: React.ReactNode
  showHome?: boolean
  homeHref?: string
}

export function Breadcrumb({
  items,
  className,
  separator = <ChevronRight className="h-4 w-4 text-gray-400" />,
  showHome = true,
  homeHref = '/'
}: BreadcrumbProps) {
  const allItems = showHome
    ? [{ label: 'Home', href: homeHref, icon: <Home className="h-4 w-4" /> }, ...items]
    : items

  return (
    <nav aria-label="Breadcrumb" className={cn('flex', className)}>
      <ol className="flex items-center space-x-2">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1

          return (
            <li key={index} className="flex items-center">
              {index > 0 && <span className="mx-2">{separator}</span>}

              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {item.icon && <span className="mr-1.5">{item.icon}</span>}
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    'flex items-center text-sm font-medium',
                    isLast ? 'text-gray-900' : 'text-gray-500'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.icon && <span className="mr-1.5">{item.icon}</span>}
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// Simplified breadcrumb for common patterns
interface SimpleBreadcrumbProps {
  path: string[]
  className?: string
}

export function SimpleBreadcrumb({ path, className }: SimpleBreadcrumbProps) {
  const items: BreadcrumbItem[] = path.map((segment, index) => ({
    label: segment,
    href: index < path.length - 1 ? `/${path.slice(0, index + 1).join('/').toLowerCase().replace(/\s+/g, '-')}` : undefined
  }))

  return <Breadcrumb items={items} className={className} />
}

// Hook to generate breadcrumbs from pathname
export function useBreadcrumbs(pathname: string): BreadcrumbItem[] {
  return React.useMemo(() => {
    const segments = pathname.split('/').filter(Boolean)

    const breadcrumbs: BreadcrumbItem[] = segments.map((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join('/')}`
      const label = segment
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

      return {
        label,
        href: index < segments.length - 1 ? href : undefined
      }
    })

    return breadcrumbs
  }, [pathname])
}

// Auto-breadcrumb component that uses the current pathname
interface AutoBreadcrumbProps {
  className?: string
  overrides?: Record<string, string> // Map of path segments to custom labels
}

export function AutoBreadcrumb({ className, overrides = {} }: AutoBreadcrumbProps) {
  const [pathname, setPathname] = React.useState('')

  React.useEffect(() => {
    setPathname(window.location.pathname)
  }, [])

  const items = React.useMemo(() => {
    if (!pathname) return []

    const segments = pathname.split('/').filter(Boolean)

    return segments.map((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join('/')}`
      const label = overrides[segment] ||
        segment
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')

      return {
        label,
        href: index < segments.length - 1 ? href : undefined
      }
    })
  }, [pathname, overrides])

  if (items.length === 0) return null

  return <Breadcrumb items={items} className={className} />
}

// Breadcrumb container with consistent styling
interface BreadcrumbContainerProps {
  children: React.ReactNode
  className?: string
}

export function BreadcrumbContainer({ children, className }: BreadcrumbContainerProps) {
  return (
    <div className={cn('bg-white border-b border-gray-200 py-3 px-4 sm:px-6 lg:px-8', className)}>
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  )
}