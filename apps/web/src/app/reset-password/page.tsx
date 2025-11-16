import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Set New Password</h1>
            <p className="text-gray-600 mt-2">
              Enter your new password below
            </p>
          </div>
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  )
}
