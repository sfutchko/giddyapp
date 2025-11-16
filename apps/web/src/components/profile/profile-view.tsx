'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Edit,
  Settings,
  Heart,
  List,
  ChevronRight,
  Camera,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { ProfileEditModal } from './profile-edit-modal'
import { useDialog } from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils/format'

interface Profile {
  id: string
  name: string
  email: string
  phone?: string
  city?: string
  state?: string
  country?: string
  bio?: string
  avatar_url?: string
  is_seller?: boolean
  is_verified_seller?: boolean
  seller_verified_at?: string
  created_at: string
}

interface Horse {
  id: string
  name: string
  breed: string
  price: number
  status: string
  created_at: string
  horse_images?: { url: string; is_primary: boolean }[]
}

interface WatchedHorse {
  horse: {
    id: string
    name: string
    breed: string
    price: number
    city: string
    state: string
    horse_images?: { url: string; is_primary: boolean }[]
  }
}

interface Verification {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
  reviewed_at?: string
  notes?: string
}

interface ProfileViewProps {
  user: User
  profile: Profile | null
  horses: Horse[]
  watchedHorses: WatchedHorse[]
  verification: Verification | null
}

export function ProfileView({ user, profile, horses, watchedHorses, verification }: ProfileViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'watching' | 'settings'>('overview')
  const editDialog = useDialog()

  const stats = {
    totalListings: horses.length,
    activeListings: horses.filter(h => h.status === 'active').length,
    totalWatching: watchedHorses.length,
    memberSince: new Date(profile?.created_at || user.created_at).getFullYear()
  }

  const getVerificationBadge = () => {
    if (!profile?.is_seller) return null

    if (profile.is_verified_seller) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
          <CheckCircle className="h-4 w-4" />
          Verified Seller
        </span>
      )
    }

    if (verification?.status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
          <Clock className="h-4 w-4" />
          Verification Pending
        </span>
      )
    }

    if (verification?.status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
          <XCircle className="h-4 w-4" />
          Verification Rejected
        </span>
      )
    }

    return (
      <Link
        href="/profile/verification"
        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-full text-sm font-medium transition-colors"
      >
        <Shield className="h-4 w-4" />
        Get Verified
      </Link>
    )
  }

  const getPrimaryImage = (images?: { url: string; is_primary: boolean }[]) => {
    const primary = images?.find(img => img.is_primary)
    return primary?.url || images?.[0]?.url
  }

  return (
    <>
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-green-700 h-32"></div>
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 sm:-mt-12 gap-4">
            <div className="relative">
              <div className="h-32 w-32 bg-white rounded-full border-4 border-white shadow-lg overflow-hidden">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                    <UserIcon className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>
              {profile?.is_verified_seller && (
                <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2 border-4 border-white">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              )}
              <button className="absolute bottom-0 left-0 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors">
                <Camera className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {profile?.name || 'User'}
                </h1>
                {getVerificationBadge()}
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                {profile?.city && profile?.state && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {profile.city}, {profile.state}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </span>
                {profile?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {profile.phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Member since {stats.memberSince}
                </span>
              </div>

              {profile?.bio && (
                <p className="text-gray-600 mb-4 max-w-2xl">{profile.bio}</p>
              )}
            </div>

            <button
              onClick={() => editDialog.open(profile)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit Profile
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.totalListings}</div>
              <div className="text-sm text-gray-600">Total Listings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.activeListings}</div>
              <div className="text-sm text-gray-600">Active Listings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.totalWatching}</div>
              <div className="text-sm text-gray-600">Watching</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.memberSince}</div>
              <div className="text-sm text-gray-600">Member Since</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('listings')}
              className={`flex-1 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'listings'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <List className="h-4 w-4" />
                My Listings ({horses.length})
              </span>
            </button>
            <button
              onClick={() => setActiveTab('watching')}
              className={`flex-1 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'watching'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Heart className="h-4 w-4" />
                Watching ({watchedHorses.length})
              </span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'settings'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-2">
                  <Link
                    href="/horses/new"
                    className="w-full flex items-center justify-between px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <span>List a New Horse</span>
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/profile/verification"
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <span>Verification Center</span>
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/messages"
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <span>Messages</span>
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Listings</h2>
                {horses.length > 0 ? (
                  <div className="space-y-4">
                    {horses.slice(0, 3).map(horse => (
                      <Link
                        key={horse.id}
                        href={`/horses/${horse.id}`}
                        className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="h-16 w-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          {getPrimaryImage(horse.horse_images) ? (
                            <img
                              src={getPrimaryImage(horse.horse_images)}
                              alt={horse.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <UserIcon className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{horse.name}</h3>
                          <p className="text-sm text-gray-600">{horse.breed}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            {formatCurrency(horse.price)}
                          </div>
                          <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                            horse.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {horse.status}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No listings yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'listings' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">My Listings</h2>
              <Link
                href="/horses/new"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Add New Listing
              </Link>
            </div>
            {horses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {horses.map(horse => (
                  <div key={horse.id} className="bg-gray-50 rounded-lg overflow-hidden">
                    <div className="h-48 bg-gray-200 relative">
                      {getPrimaryImage(horse.horse_images) ? (
                        <img
                          src={getPrimaryImage(horse.horse_images)}
                          alt={horse.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <UserIcon className="h-16 w-16 text-gray-400" />
                        </div>
                      )}
                      <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${
                        horse.status === 'active'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-600 text-white'
                      }`}>
                        {horse.status}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1">{horse.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{horse.breed}</p>
                      <div className="text-lg font-bold text-green-600 mb-3">
                        {formatCurrency(horse.price)}
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/horses/${horse.id}`}
                          className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors text-center"
                        >
                          View
                        </Link>
                        <Link
                          href={`/horses/${horse.id}/edit`}
                          className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors text-center"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">You haven't listed any horses yet</p>
                <Link
                  href="/horses/new"
                  className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  List Your First Horse
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'watching' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Watching</h2>
            {watchedHorses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {watchedHorses.map(({ horse }) => (
                  <Link
                    key={horse.id}
                    href={`/horses/${horse.id}`}
                    className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="h-48 bg-gray-200">
                      {getPrimaryImage(horse.horse_images) ? (
                        <img
                          src={getPrimaryImage(horse.horse_images)}
                          alt={horse.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <UserIcon className="h-16 w-16 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1">{horse.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{horse.breed}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {horse.city}, {horse.state}
                        </span>
                        <span className="text-lg font-bold text-green-600">
                          {formatCurrency(horse.price)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">You haven't watched any horses yet</p>
                <Link
                  href="/horses/map"
                  className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Browse Horses
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Account Settings</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3">Security</h3>
                <div className="space-y-2">
                  <Link
                    href="/profile/password"
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-gray-700">Change Password</span>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </Link>
                  <Link
                    href="/profile/two-factor"
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-gray-700">Two-Factor Authentication</span>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </Link>
                </div>
              </div>

              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3">Notifications</h3>
                <div className="space-y-2">
                  <Link
                    href="/profile/notifications"
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-gray-700">Email Preferences</span>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </Link>
                </div>
              </div>

              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3">Privacy</h3>
                <div className="space-y-2">
                  <Link
                    href="/profile/privacy"
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-gray-700">Privacy Settings</span>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </Link>
                  <button className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors w-full text-left">
                    <span className="text-red-600">Delete Account</span>
                    <ChevronRight className="h-5 w-5 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <ProfileEditModal
        isOpen={editDialog.isOpen}
        onClose={editDialog.close}
        profile={editDialog.data}
        onSave={(updatedProfile) => {
          toast.success('Profile updated successfully')
          editDialog.close()
          // In a real app, we'd update the profile state or revalidate
        }}
      />
    </>
  )
}