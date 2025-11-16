'use client'

import { AlertTriangle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // This is the root error boundary for the entire application
  // It catches errors that occur outside of the normal page boundaries

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-lg shadow-xl p-8 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Critical Application Error
              </h1>

              <p className="text-gray-600 mb-6">
                A critical error has occurred. Please refresh the page to continue.
              </p>

              <button
                onClick={reset}
                className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                Refresh Page
              </button>

              {process.env.NODE_ENV === 'development' && (
                <div className="mt-6 p-4 bg-gray-100 rounded text-left">
                  <p className="text-xs font-mono text-red-600">
                    {error.message}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}