'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Bell, Mail, Smartphone, Clock } from 'lucide-react'
import type { NotificationPreferences } from '@/lib/actions/notifications'
import { updateNotificationPreferences } from '@/lib/actions/notifications'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface NotificationPreferencesContentProps {
  initialPreferences: NotificationPreferences
}

export function NotificationPreferencesContent({ initialPreferences }: NotificationPreferencesContentProps) {
  const [preferences, setPreferences] = useState(initialPreferences)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const handleToggle = (field: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const handleSelectChange = (field: keyof NotificationPreferences, value: string) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    const result = await updateNotificationPreferences(preferences)
    setSaving(false)

    if ('success' in result) {
      toast.success('Preferences saved successfully')
      router.refresh()
    } else {
      toast.error('Failed to save preferences')
    }
  }

  const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 ${
        enabled ? 'bg-green-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/notifications"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Notifications
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Notification Preferences</h1>
          <p className="text-gray-600 mt-1">
            Choose how and when you want to be notified about activity
          </p>
        </div>

        <div className="space-y-6">
          {/* In-App Notifications */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="h-6 w-6 text-gray-700" />
              <h2 className="text-xl font-semibold text-gray-900">In-App Notifications</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Receive notifications in the notification bell while browsing the platform
            </p>

            <div className="space-y-4">
              {[
                { key: 'in_app_messages' as const, label: 'Messages', description: 'New messages from buyers and sellers' },
                { key: 'in_app_offers' as const, label: 'Offers', description: 'New offers, counter-offers, and offer updates' },
                { key: 'in_app_viewing_requests' as const, label: 'Viewing Requests', description: 'New viewing requests and updates' },
                { key: 'in_app_price_changes' as const, label: 'Price Changes', description: 'Price changes on horses you\'re watching' },
                { key: 'in_app_reviews' as const, label: 'Reviews', description: 'New reviews on your profile or listings' },
                { key: 'in_app_system' as const, label: 'System', description: 'Important system updates and announcements' },
              ].map(({ key, label, description }) => (
                <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{label}</p>
                    <p className="text-sm text-gray-600">{description}</p>
                  </div>
                  <ToggleSwitch
                    enabled={preferences[key]}
                    onChange={() => handleToggle(key)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Email Notifications */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="h-6 w-6 text-gray-700" />
              <h2 className="text-xl font-semibold text-gray-900">Email Notifications</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Get updates sent to your email address
            </p>

            <div className="space-y-4">
              {[
                { key: 'email_messages' as const, label: 'Messages', description: 'Email me when I receive new messages' },
                { key: 'email_offers' as const, label: 'Offers', description: 'Email me about offer activity' },
                { key: 'email_viewing_requests' as const, label: 'Viewing Requests', description: 'Email me about viewing request updates' },
                { key: 'email_price_changes' as const, label: 'Price Changes', description: 'Email me when watched horses change price' },
                { key: 'email_reviews' as const, label: 'Reviews', description: 'Email me when I receive new reviews' },
                { key: 'email_system' as const, label: 'System', description: 'Important account and system updates' },
                { key: 'email_marketing' as const, label: 'Marketing', description: 'Tips, promotions, and product updates' },
              ].map(({ key, label, description }) => (
                <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{label}</p>
                    <p className="text-sm text-gray-600">{description}</p>
                  </div>
                  <ToggleSwitch
                    enabled={preferences[key]}
                    onChange={() => handleToggle(key)}
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Email Digest Frequency
              </label>
              <select
                value={preferences.email_digest_frequency}
                onChange={(e) => handleSelectChange('email_digest_frequency', e.target.value)}
                className="block w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
              >
                <option value="instant">Instant (as they happen)</option>
                <option value="daily">Daily digest</option>
                <option value="weekly">Weekly digest</option>
                <option value="never">Never</option>
              </select>
              <p className="text-sm text-gray-600 mt-2">
                Choose how often you want to receive email notifications
              </p>
            </div>
          </div>

          {/* Push Notifications */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <Smartphone className="h-6 w-6 text-gray-700" />
              <h2 className="text-xl font-semibold text-gray-900">Push Notifications</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Receive push notifications on your mobile device (requires mobile app)
            </p>

            <div className="space-y-4">
              {[
                { key: 'push_messages' as const, label: 'Messages', description: 'Push notifications for new messages' },
                { key: 'push_offers' as const, label: 'Offers', description: 'Push notifications for offer activity' },
                { key: 'push_viewing_requests' as const, label: 'Viewing Requests', description: 'Push notifications for viewing requests' },
                { key: 'push_price_changes' as const, label: 'Price Changes', description: 'Push notifications for price changes' },
                { key: 'push_reviews' as const, label: 'Reviews', description: 'Push notifications for new reviews' },
              ].map(({ key, label, description }) => (
                <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{label}</p>
                    <p className="text-sm text-gray-600">{description}</p>
                  </div>
                  <ToggleSwitch
                    enabled={preferences[key]}
                    onChange={() => handleToggle(key)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="h-6 w-6 text-gray-700" />
              <h2 className="text-xl font-semibold text-gray-900">Quiet Hours</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Pause non-urgent notifications during specific hours
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Enable Quiet Hours</p>
                  <p className="text-sm text-gray-600">Mute notifications during set hours</p>
                </div>
                <ToggleSwitch
                  enabled={preferences.quiet_hours_enabled}
                  onChange={() => handleToggle('quiet_hours_enabled')}
                />
              </div>

              {preferences.quiet_hours_enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={preferences.quiet_hours_start || '22:00'}
                      onChange={(e) => handleSelectChange('quiet_hours_start', e.target.value)}
                      className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={preferences.quiet_hours_end || '08:00'}
                      onChange={(e) => handleSelectChange('quiet_hours_end', e.target.value)}
                      className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600">
              Changes are saved automatically as you adjust settings
            </p>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <Save className="h-5 w-5" />
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
