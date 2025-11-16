'use client'

import { useState } from 'react'
import { Calendar, X, Clock } from 'lucide-react'
import { createViewingRequest } from '@/lib/actions/viewing-requests'
import { toast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface RequestViewingButtonProps {
  horseId: string
  horseName: string
  sellerId: string
  className?: string
  existingRequest?: {
    id: string
    status: string
    requested_date: string
    requested_time: string
    created_at: string
  } | null
}

export function RequestViewingButton({
  horseId,
  horseName,
  sellerId,
  className = '',
  existingRequest
}: RequestViewingButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    message: '',
    phone: '',
    email: ''
  })
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.date || !formData.time) {
      toast({
        title: 'Missing Information',
        description: 'Please select a date and time',
        type: 'error'
      })
      return
    }

    setIsSubmitting(true)

    const result = await createViewingRequest(
      horseId,
      sellerId,
      formData.date,
      formData.time,
      formData.message || undefined,
      formData.phone || undefined,
      formData.email || undefined
    )

    if ('error' in result) {
      toast({
        title: 'Request Failed',
        description: result.error,
        type: 'error'
      })
    } else {
      toast({
        title: 'Request Sent',
        description: 'Viewing request sent successfully!',
        type: 'success'
      })
      setIsOpen(false)
      setFormData({ date: '', time: '', message: '', phone: '', email: '' })
      router.refresh()
    }

    setIsSubmitting(false)
  }

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  // If there's an existing request, show status button instead
  if (existingRequest) {
    return (
      <button
        onClick={() => router.push('/dashboard/viewing-requests')}
        className={`flex items-center justify-center gap-2 px-6 py-3 bg-amber-50 border-2 border-amber-400 text-amber-900 rounded-lg hover:bg-amber-100 font-semibold transition-all ${className}`}
      >
        <Clock className="h-5 w-5" />
        {existingRequest.status === 'pending' && 'Viewing Pending'}
        {existingRequest.status === 'approved' && 'Viewing Approved'}
        {' - '}{new Date(existingRequest.requested_date).toLocaleDateString()}
      </button>
    )
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-semibold transition-all shadow-sm ${className}`}
      >
        <Calendar className="h-5 w-5" />
        Request Viewing
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Request Viewing</h3>
                <p className="text-gray-600 mt-1">Schedule a time to see {horseName}</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    min={getMinDate()}
                    required
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Time *
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave blank to use your account email
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Any specific questions or requirements for the viewing..."
                  rows={4}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 resize-none"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• The seller will review your viewing request</li>
                  <li>• You'll be notified when they approve or suggest a different time</li>
                  <li>• You can manage your requests from your dashboard</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4" />
                      Send Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
