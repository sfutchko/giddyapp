import { AuthForm } from '@/components/auth/auth-form'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex flex-col">
      <div className="p-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-green-700 hover:text-green-800 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-green-700 mb-2">GiddyApp</h1>
            <p className="text-gray-600">The trusted marketplace for horses</p>
          </div>

          <AuthForm mode="login" />

          <div className="mt-8 text-center text-sm text-gray-600">
            <p>
              By signing in, you agree to our{' '}
              <a href="/terms" className="text-green-600 hover:text-green-700">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-green-600 hover:text-green-700">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}