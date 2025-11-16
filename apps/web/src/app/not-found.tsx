'use client'

import Link from 'next/link'
import { FileQuestion, Home, Search, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gray-100 mb-6">
            <FileQuestion className="h-10 w-10 text-gray-400" />
          </div>

          <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>

          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Page not found
          </h2>

          <p className="text-lg text-gray-600 mb-8">
            Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or never existed.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Here are some helpful links:
          </h3>

          <div className="space-y-3">
            <Link
              href="/"
              className="w-full flex items-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors group"
            >
              <Home className="h-5 w-5 mr-3" />
              <span className="font-medium">Go to Homepage</span>
            </Link>

            <Link
              href="/horses/map"
              className="w-full flex items-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors group"
            >
              <Search className="h-5 w-5 mr-3" />
              <span className="font-medium">Browse Horses</span>
            </Link>

            <button
              onClick={() => window.history.back()}
              className="w-full flex items-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors group"
            >
              <ArrowLeft className="h-5 w-5 mr-3" />
              <span className="font-medium">Go Back</span>
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Lost? Try searching for what you need:
          </p>
          <form className="mt-4 flex gap-2" action="/horses">
            <input
              type="text"
              name="search"
              placeholder="Search for horses..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Error Code: 404 | Request ID: {Date.now().toString(36)}
          </p>
        </div>
      </div>
    </div>
  )
}