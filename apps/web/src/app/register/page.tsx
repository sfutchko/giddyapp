import { AuthForm } from '@/components/auth/auth-form'
import Link from 'next/link'
import { ChevronLeft, Shield, CheckCircle, Lock } from 'lucide-react'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <div className="p-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-green-700 hover:text-green-800 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-700 mb-2">GiddyApp</h1>
          <p className="text-gray-600">Join the trusted marketplace for horses</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div className="order-2 lg:order-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Why Choose GiddyApp?
            </h2>

            <div className="space-y-4">
              <div className="flex gap-3">
                <Shield className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">Verified Sellers</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    All sellers go through identity verification to ensure safe transactions
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Lock className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">Secure Payments</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Protected transactions with escrow service and fraud protection
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">Complete Health Records</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Access Coggins, vaccination records, and PPE reports all in one place
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-white rounded-xl shadow-lg">
              <h3 className="font-semibold text-gray-900 mb-3">
                What our users say
              </h3>
              <blockquote className="text-gray-600 italic">
                "GiddyApp made buying my first horse so much easier. The verified
                sellers and health records gave me confidence in my purchase."
              </blockquote>
              <p className="text-sm text-gray-500 mt-2">- Sarah M., Happy Buyer</p>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <AuthForm mode="register" />

            <div className="mt-6 text-center text-sm text-gray-600">
              <p>
                By creating an account, you agree to our{' '}
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
    </div>
  )
}