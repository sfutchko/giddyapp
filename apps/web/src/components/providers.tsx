'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { CompareProvider } from '@/contexts/compare-context'
import { CompareBar } from '@/components/horses/compare-bar'
import { Toaster as SonnerToaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <CompareProvider>
        {children}
        <CompareBar />
        <SonnerToaster position="top-right" richColors />
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
      </CompareProvider>
    </QueryClientProvider>
  )
}