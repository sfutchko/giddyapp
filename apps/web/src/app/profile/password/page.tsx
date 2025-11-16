'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ArrowLeft, Lock } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Input, FormGroup, FormSection } from '@/components/ui/form-field'
import { SubmitButton } from '@/components/ui/form-utils'
import { toast } from '@/hooks/use-toast'

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number'
    ),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
})

type PasswordFormData = z.infer<typeof passwordSchema>

export default function PasswordPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema)
  })

  const onSubmit = async (data: PasswordFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword
      })

      if (updateError) {
        throw updateError
      }

      toast.success('Password updated successfully')
      reset()
      router.push('/profile')
    } catch (err: any) {
      setError(err.message || 'Failed to update password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/profile"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Lock className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Change Password</h1>
                <p className="text-sm text-gray-600">Update your account password</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <FormGroup>
              <FormSection>
                <Input
                  label="Current Password"
                  type="password"
                  required
                  error={errors.currentPassword}
                  register={register('currentPassword')}
                  placeholder="Enter your current password"
                />

                <Input
                  label="New Password"
                  type="password"
                  required
                  error={errors.newPassword}
                  register={register('newPassword')}
                  placeholder="Enter new password"
                  helperText="At least 8 characters with uppercase, lowercase, and numbers"
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  required
                  error={errors.confirmPassword}
                  register={register('confirmPassword')}
                  placeholder="Confirm new password"
                />
              </FormSection>
            </FormGroup>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <Link
                href="/profile"
                className="flex-1 px-4 py-2 text-center text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </Link>
              <div className="flex-1">
                <SubmitButton
                  isLoading={isLoading}
                  loadingText="Updating..."
                  className="w-full"
                >
                  Update Password
                </SubmitButton>
              </div>
            </div>
          </form>
        </div>

        {/* Security Tips */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">Password Security Tips</h2>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="block w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></span>
              Use a unique password that you don't use on other websites
            </li>
            <li className="flex items-start gap-2">
              <span className="block w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></span>
              Consider using a password manager to generate and store strong passwords
            </li>
            <li className="flex items-start gap-2">
              <span className="block w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></span>
              Enable two-factor authentication for additional security
            </li>
            <li className="flex items-start gap-2">
              <span className="block w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></span>
              Never share your password with anyone, including GiddyApp staff
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}