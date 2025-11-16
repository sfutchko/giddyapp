'use client'

import React, { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  Shield,
  AlertCircle,
  User,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Activity,
  Ban,
  Edit,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface UserProfile {
  id: string
  name: string
  email: string
  phone?: string
  bio?: string
  location?: string
  created_at: string
  updated_at: string
  is_seller: boolean
  is_verified_seller: boolean
  seller_verified_at?: string
  is_admin: boolean
  is_banned?: boolean
  banned_at?: string
  banned_reason?: string
  _count?: {
    horses: number
    favorites: number
  }
}

interface UserManagementProps {
  initialUsers: UserProfile[]
  totalUsers: number
}

export function UserManagement({ initialUsers, totalUsers }: UserManagementProps) {
  const [users, setUsers] = useState<UserProfile[]>(initialUsers)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'verified' | 'sellers' | 'banned' | 'admin'>('all')
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showBanModal, setShowBanModal] = useState(false)
  const [banReason, setBanReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const usersPerPage = 10

  const handleSearch = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      // Apply search filter
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      }

      // Apply type filter
      switch (filterType) {
        case 'verified':
          query = query.eq('is_verified_seller', true)
          break
        case 'sellers':
          query = query.eq('is_seller', true)
          break
        case 'banned':
          query = query.eq('is_banned', true)
          break
        case 'admin':
          query = query.eq('is_admin', true)
          break
      }

      const { data, error } = await query

      if (error) throw error

      setUsers(data || [])
    } catch (error: any) {
      console.error('Error searching users:', error)
      toast.error('Failed to search users')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleAdmin = async (user: UserProfile) => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !user.is_admin })
        .eq('id', user.id)

      if (error) throw error

      // Update local state
      setUsers(users.map(u =>
        u.id === user.id ? { ...u, is_admin: !u.is_admin } : u
      ))

      toast.success(`Admin privileges ${user.is_admin ? 'removed' : 'granted'}`)
    } catch (error: any) {
      console.error('Error toggling admin:', error)
      toast.error('Failed to update admin status')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBanUser = async () => {
    if (!selectedUser || !banReason.trim()) {
      toast.error('Please provide a ban reason')
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('profiles')
        .update({
          is_banned: true,
          banned_at: new Date().toISOString(),
          banned_reason: banReason
        })
        .eq('id', selectedUser.id)

      if (error) throw error

      // Update local state
      setUsers(users.map(u =>
        u.id === selectedUser.id
          ? { ...u, is_banned: true, banned_at: new Date().toISOString(), banned_reason: banReason }
          : u
      ))

      toast.success('User has been banned')
      setShowBanModal(false)
      setBanReason('')
      setSelectedUser(null)
    } catch (error: any) {
      console.error('Error banning user:', error)
      toast.error('Failed to ban user')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnbanUser = async (user: UserProfile) => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('profiles')
        .update({
          is_banned: false,
          banned_at: null,
          banned_reason: null
        })
        .eq('id', user.id)

      if (error) throw error

      // Update local state
      setUsers(users.map(u =>
        u.id === user.id
          ? { ...u, is_banned: false, banned_at: undefined, banned_reason: undefined }
          : u
      ))

      toast.success('User has been unbanned')
    } catch (error: any) {
      console.error('Error unbanning user:', error)
      toast.error('Failed to unban user')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifySeller = async (user: UserProfile) => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('profiles')
        .update({
          is_verified_seller: true,
          seller_verified_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      // Update local state
      setUsers(users.map(u =>
        u.id === user.id
          ? { ...u, is_verified_seller: true, seller_verified_at: new Date().toISOString() }
          : u
      ))

      toast.success('Seller has been verified')
    } catch (error: any) {
      console.error('Error verifying seller:', error)
      toast.error('Failed to verify seller')
    } finally {
      setIsLoading(false)
    }
  }

  const getUserBadges = (user: UserProfile) => {
    const badges = []

    if (user.is_admin) {
      badges.push(
        <span key="admin" className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
          <Shield className="h-3 w-3" />
          Admin
        </span>
      )
    }

    if (user.is_verified_seller) {
      badges.push(
        <span key="verified" className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
          <CheckCircle className="h-3 w-3" />
          Verified
        </span>
      )
    } else if (user.is_seller) {
      badges.push(
        <span key="seller" className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
          Seller
        </span>
      )
    }

    if (user.is_banned) {
      badges.push(
        <span key="banned" className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
          <Ban className="h-3 w-3" />
          Banned
        </span>
      )
    }

    return badges
  }

  // Pagination
  const totalPages = Math.ceil(users.length / usersPerPage)
  const startIndex = (currentPage - 1) * usersPerPage
  const endIndex = startIndex + usersPerPage
  const currentUsers = users.slice(startIndex, endIndex)

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
          >
            <option value="all">All Users</option>
            <option value="verified">Verified Sellers</option>
            <option value="sellers">All Sellers</option>
            <option value="admin">Admins</option>
            <option value="banned">Banned</option>
          </select>
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getUserBadges(user)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user._count?.horses || 0} listings
                    </div>
                    <div className="text-sm text-gray-500">
                      {user._count?.favorites || 0} favorites
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="relative inline-block text-left">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MoreVertical className="h-4 w-4 text-gray-600" />
                      </button>
                      {selectedUser?.id === user.id && (
                        <div className="absolute right-0 z-10 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                          <div className="py-1" role="menu">
                            <button
                              onClick={() => {
                                setShowUserModal(true)
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View Details
                            </button>
                            <Link
                              href={`/profile/${user.id}`}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <User className="h-4 w-4" />
                              View Profile
                            </Link>
                            {!user.is_admin && (
                              <button
                                onClick={() => handleToggleAdmin(user)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <Shield className="h-4 w-4" />
                                Make Admin
                              </button>
                            )}
                            {user.is_admin && !user.is_banned && (
                              <button
                                onClick={() => handleToggleAdmin(user)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <Shield className="h-4 w-4" />
                                Remove Admin
                              </button>
                            )}
                            {user.is_seller && !user.is_verified_seller && (
                              <button
                                onClick={() => handleVerifySeller(user)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <CheckCircle className="h-4 w-4" />
                                Verify Seller
                              </button>
                            )}
                            {!user.is_banned ? (
                              <button
                                onClick={() => {
                                  setShowBanModal(true)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Ban className="h-4 w-4" />
                                Ban User
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUnbanUser(user)}
                                className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                              >
                                <CheckCircle className="h-4 w-4" />
                                Unban User
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(endIndex, users.length)}</span> of{' '}
                  <span className="font-medium">{users.length}</span> users
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-green-50 border-green-500 text-green-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">User Details</h2>
                <button
                  onClick={() => {
                    setShowUserModal(false)
                    setSelectedUser(null)
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Name</label>
                    <p className="font-medium">{selectedUser.name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Email</label>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Phone</label>
                    <p className="font-medium">{selectedUser.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Location</label>
                    <p className="font-medium">{selectedUser.location || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Account Status</h3>
                <div className="flex flex-wrap gap-2">
                  {getUserBadges(selectedUser)}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Joined</label>
                    <p className="font-medium">
                      {new Date(selectedUser.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Last Updated</label>
                    <p className="font-medium">
                      {new Date(selectedUser.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedUser.seller_verified_at && (
                    <div>
                      <label className="text-sm text-gray-500">Verified Since</label>
                      <p className="font-medium">
                        {new Date(selectedUser.seller_verified_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {selectedUser.banned_at && (
                    <div className="col-span-2">
                      <label className="text-sm text-gray-500">Banned</label>
                      <p className="font-medium text-red-600">
                        {new Date(selectedUser.banned_at).toLocaleDateString()}
                      </p>
                      {selectedUser.banned_reason && (
                        <p className="text-sm text-red-600 mt-1">
                          Reason: {selectedUser.banned_reason}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Bio */}
              {selectedUser.bio && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Bio</h3>
                  <p className="text-gray-700">{selectedUser.bio}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ban User Modal */}
      {showBanModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Ban User</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to ban {selectedUser.name}? This will prevent them from accessing their account.
            </p>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Please provide a reason for the ban..."
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none mb-4"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBanModal(false)
                  setBanReason('')
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBanUser}
                disabled={isLoading || !banReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Ban User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}