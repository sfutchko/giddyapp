'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { UserManagement } from './user-management'
import {
  Shield,
  Users,
  FileText,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
  Settings,
  Search,
  Filter,
  Eye,
  ChevronRight,
  Activity,
  TrendingUp,
  UserCheck,
  FileCheck
} from 'lucide-react'
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils/format'

interface AdminStats {
  totalUsers: number
  totalHorses: number
  pendingVerifications: number
  totalRevenue: number
}

interface Verification {
  id: string
  user_id: string
  status: string
  business_name?: string
  submitted_at: string
  profiles?: {
    name: string
    email: string
  }
}

interface Listing {
  id: string
  name: string
  price: number
  status: string
  created_at: string
  profiles?: {
    name: string
    email: string
  }
}

interface User {
  id: string
  name: string
  email: string
  created_at: string
  is_seller?: boolean
  seller_verified?: boolean
}

interface AdminDashboardProps {
  stats: AdminStats
  recentVerifications: Verification[]
  recentListings: Listing[]
  recentUsers: User[]
}

export function AdminDashboard({
  stats,
  recentVerifications,
  recentListings,
  recentUsers
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'verifications' | 'users' | 'listings' | 'analytics'>('overview')

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: <Users className="h-6 w-6 text-blue-600" />,
      change: '+12%',
      changeType: 'positive' as const,
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Active Listings',
      value: stats.totalHorses.toLocaleString(),
      icon: <FileText className="h-6 w-6 text-green-600" />,
      change: '+23%',
      changeType: 'positive' as const,
      bgColor: 'bg-green-50'
    },
    {
      title: 'Pending Verifications',
      value: stats.pendingVerifications.toLocaleString(),
      icon: <Clock className="h-6 w-6 text-yellow-600" />,
      change: stats.pendingVerifications > 0 ? 'Action Required' : 'All Clear',
      changeType: stats.pendingVerifications > 0 ? 'warning' as const : 'neutral' as const,
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: <DollarSign className="h-6 w-6 text-purple-600" />,
      change: '+18%',
      changeType: 'positive' as const,
      bgColor: 'bg-purple-50'
    }
  ]

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: <Clock className="h-3 w-3" />
      },
      approved: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: <CheckCircle className="h-3 w-3" />
      },
      rejected: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: <AlertCircle className="h-3 w-3" />
      },
      active: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: <CheckCircle className="h-3 w-3" />
      },
      draft: {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        icon: <FileText className="h-3 w-3" />
      }
    }

    const badge = badges[status] || badges.pending

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.text}`}>
        {badge.icon}
        {status}
      </span>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <Shield className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-xs text-gray-600">GiddyApp Management</p>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'overview'
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="h-5 w-5" />
              <span className="font-medium">Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('verifications')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'verifications'
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <UserCheck className="h-5 w-5" />
              <span className="font-medium">Verifications</span>
              {stats.pendingVerifications > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {stats.pendingVerifications}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'users'
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Users className="h-5 w-5" />
              <span className="font-medium">Users</span>
            </button>

            <button
              onClick={() => setActiveTab('listings')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'listings'
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FileText className="h-5 w-5" />
              <span className="font-medium">Listings</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Activity className="h-5 w-5" />
              <span className="font-medium">Analytics</span>
            </button>
          </nav>
        </div>

        <div className="mt-auto p-6 border-t">
          <Link
            href="/admin/settings"
            className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings className="h-5 w-5" />
            <span className="font-medium">Settings</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'verifications' && 'Verification Requests'}
              {activeTab === 'users' && 'User Management'}
              {activeTab === 'listings' && 'Listing Management'}
              {activeTab === 'analytics' && 'Analytics & Reports'}
            </h2>
            <p className="text-gray-600">
              {activeTab === 'overview' && 'Monitor platform activity and key metrics'}
              {activeTab === 'verifications' && 'Review and manage seller verification requests'}
              {activeTab === 'users' && 'Manage user accounts and permissions'}
              {activeTab === 'listings' && 'Monitor and moderate horse listings'}
              {activeTab === 'analytics' && 'View detailed platform analytics and reports'}
            </p>
          </div>

          {activeTab === 'overview' && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat, index) => (
                  <div key={index} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                        {stat.icon}
                      </div>
                      <span className={`text-sm font-medium ${
                        stat.changeType === 'positive' ? 'text-green-600' :
                        stat.changeType === 'warning' ? 'text-yellow-600' :
                        'text-gray-600'
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                  </div>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pending Verifications */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Pending Verifications</h3>
                  </div>
                  <div className="p-6">
                    {recentVerifications.filter(v => v.status === 'pending').length > 0 ? (
                      <div className="space-y-4">
                        {recentVerifications
                          .filter(v => v.status === 'pending')
                          .slice(0, 3)
                          .map(verification => (
                            <div key={verification.id} className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {verification.profiles?.name || 'Unknown'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {verification.business_name || 'Individual'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatRelativeTime(verification.submitted_at)}
                                </p>
                              </div>
                              <Link
                                href={`/admin/verifications/${verification.id}`}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                            </div>
                          ))}
                        <Link
                          href="/admin/verifications"
                          className="block text-center text-sm text-green-600 hover:text-green-700 font-medium"
                        >
                          View All →
                        </Link>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center">No pending verifications</p>
                    )}
                  </div>
                </div>

                {/* Recent Listings */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Listings</h3>
                  </div>
                  <div className="p-6">
                    {recentListings.length > 0 ? (
                      <div className="space-y-4">
                        {recentListings.slice(0, 3).map(listing => (
                          <div key={listing.id} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{listing.name}</p>
                              <p className="text-sm text-gray-600">
                                {listing.profiles?.name || 'Unknown Seller'}
                              </p>
                              <p className="text-sm font-bold text-green-600">
                                {formatCurrency(listing.price)}
                              </p>
                            </div>
                            {getStatusBadge(listing.status)}
                          </div>
                        ))}
                        <Link
                          href="/admin/listings"
                          className="block text-center text-sm text-green-600 hover:text-green-700 font-medium"
                        >
                          View All →
                        </Link>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center">No recent listings</p>
                    )}
                  </div>
                </div>

                {/* New Users */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">New Users</h3>
                  </div>
                  <div className="p-6">
                    {recentUsers.length > 0 ? (
                      <div className="space-y-4">
                        {recentUsers.slice(0, 4).map(user => (
                          <div key={user.id} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{user.name}</p>
                              <p className="text-sm text-gray-600">{user.email}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {user.seller_verified && (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                              <span className="text-xs text-gray-500">
                                {formatRelativeTime(user.created_at)}
                              </span>
                            </div>
                          </div>
                        ))}
                        <Link
                          href="/admin/users"
                          className="block text-center text-sm text-green-600 hover:text-green-700 font-medium"
                        >
                          View All →
                        </Link>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center">No recent users</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'verifications' && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">All Verification Requests</h3>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                      <Filter className="h-4 w-4 inline mr-1" />
                      Filter
                    </button>
                    <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                      <Search className="h-4 w-4 inline mr-1" />
                      Search
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentVerifications.map(verification => (
                    <div key={verification.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {verification.profiles?.name || 'Unknown'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {verification.profiles?.email}
                            </p>
                          </div>
                          <div className="text-sm">
                            <p className="text-gray-600">
                              Business: {verification.business_name || 'Individual'}
                            </p>
                            <p className="text-gray-500">
                              Submitted: {formatDate(verification.submitted_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(verification.status)}
                        <Link
                          href={`/admin/verifications/${verification.id}`}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                        >
                          Review
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <UserManagement
              initialUsers={recentUsers as any}
              totalUsers={stats.totalUsers}
            />
          )}

          {activeTab === 'listings' && (
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600">Listing management interface coming soon...</p>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600">Analytics dashboard coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}