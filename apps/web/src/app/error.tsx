'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw, Home, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with Sentry
      // Sentry.captureException(error)
    }
  }, [error])

  const isNetworkError = error.message?.includes('fetch') || error.message?.includes('network')
  const isDatabaseError = error.message?.includes('database') || error.message?.includes('supabase')

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Oops! Something went wrong
          </h1>

          <p className="text-lg text-gray-600 mb-4">
            {isNetworkError
              ? "We're having trouble connecting to our servers."
              : isDatabaseError
              ? "We're experiencing database issues."
              : "An unexpected error occurred while processing your request."}
          </p>

          {/* Error details for development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
              <h3 className="text-sm font-semibold text-red-800 mb-2">Error Details:</h3>
              <p className="text-sm font-mono text-red-700 break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-red-600 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            What can you do?
          </h2>

          <div className="space-y-3">
            <button
              onClick={reset}
              className="w-full flex items-center justify-between px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors group"
            >
              <div className="flex items-center">
                <RefreshCw className="h-5 w-5 mr-3" />
                <span className="font-medium">Try again</span>
              </div>
              <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <Link
              href="/"
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors group"
            >
              <div className="flex items-center">
                <Home className="h-5 w-5 mr-3" />
                <span className="font-medium">Go to homepage</span>
              </div>
              <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/horses/map"
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors group"
            >
              <div className="flex items-center">
                <span className="font-medium ml-8">Browse horses</span>
              </div>
              <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            If this problem persists, please{' '}
            <a href="mailto:support@giddyapp.com" className="text-green-600 hover:text-green-700 underline">
              contact support
            </a>
          </p>
          {error.digest && (
            <p className="text-xs text-gray-400 mt-2">
              Reference ID: {error.digest}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}