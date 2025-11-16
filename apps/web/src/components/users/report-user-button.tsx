'use client'

import { useState } from 'react'
import { Flag, X } from 'lucide-react'
import { reportUser, type ReportCategory } from '@/lib/actions/reporting'
import { REPORT_CATEGORIES } from '@/lib/constants/reports'
import { toast } from 'sonner'

interface ReportUserButtonProps {
  userId: string
  userName?: string
  variant?: 'button' | 'menu-item'
  className?: string
}

export function ReportUserButton({
  userId,
  userName,
  variant = 'button',
  className = ''
}: ReportUserButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [category, setCategory] = useState<ReportCategory>('spam')
  const [description, setDescription] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!description.trim() || description.trim().length < 10) {
      toast.error('Please provide a detailed description (at least 10 characters)')
      return
    }

    setIsLoading(true)

    const result = await reportUser(userId, category, description)

    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success('Report submitted successfully. We will review it shortly.')
      setIsOpen(false)
      setDescription('')
      setCategory('spam')
    }

    setIsLoading(false)
  }

  const openModal = () => {
    setIsOpen(true)
  }

  const closeModal = () => {
    if (!isLoading) {
      setIsOpen(false)
      setDescription('')
      setCategory('spam')
    }
  }

  if (variant === 'menu-item') {
    return (
      <>
        <button
          onClick={openModal}
          className={`w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 transition-colors ${className}`}
        >
          <Flag className="h-4 w-4" />
          Report User
        </button>

        {isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 rounded-full">
                    <Flag className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Report User</h3>
                    <p className="text-sm text-gray-600">
                      {userName ? `Report ${userName}` : 'Report this user'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  disabled={isLoading}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for report
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ReportCategory)}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                  >
                    {REPORT_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isLoading}
                    placeholder="Please provide details about why you're reporting this user..."
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 resize-none"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum 10 characters. Current: {description.length}
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> False reports may result in account penalties. Please
                    only submit reports for genuine violations of our community guidelines.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || description.trim().length < 10}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <button
        onClick={openModal}
        className={`flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium transition-colors ${className}`}
      >
        <Flag className="h-4 w-4" />
        Report
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-full">
                  <Flag className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Report User</h3>
                  <p className="text-sm text-gray-600">
                    {userName ? `Report ${userName}` : 'Report this user'}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                disabled={isLoading}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for report
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ReportCategory)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                >
                  {REPORT_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isLoading}
                  placeholder="Please provide details about why you're reporting this user..."
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 resize-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 10 characters. Current: {description.length}
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> False reports may result in account penalties. Please only
                  submit reports for genuine violations of our community guidelines.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || description.trim().length < 10}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
