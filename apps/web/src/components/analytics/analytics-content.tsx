'use client'

import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import Image from 'next/image'
import {
  DollarSign,
  TrendingUp,
  Package,
  Activity,
  Calendar,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Home
} from 'lucide-react'

interface Horse {
  id: string
  slug: string
  name: string
  breed: string
  age: number
  gender: string
  height: number
  price: number
  sold_price?: number | null
  sold_date?: string | null
  status: string
  location: any
  created_at: string
  horse_images?: Array<{
    url: string
    is_primary: boolean
  }>
}

interface Stats {
  totalRevenue: number
  totalSold: number
  averagePrice: number
  activeListings: number
  monthlyData: Array<{
    month: string
    count: number
    revenue: number
  }>
}

interface AnalyticsContentProps {
  user: User
  soldHorses: Horse[]
  stats: Stats
}

export function AnalyticsContent({ user, soldHorses, stats }: AnalyticsContentProps) {
  const getPrimaryImage = (images?: { url: string; is_primary: boolean }[]) => {
    return images?.find(img => img.is_primary)?.url || images?.[0]?.url
  }

  const calculateDaysToSell = (horse: Horse) => {
    if (!horse.sold_date) return 0
    const listed = new Date(horse.created_at)
    const sold = new Date(horse.sold_date)
    const days = Math.ceil((sold.getTime() - listed.getTime()) / (1000 * 60 * 60 * 24))
    return days
  }

  const averageDaysToSell = soldHorses.length > 0
    ? Math.round(soldHorses.reduce((sum, horse) => sum + calculateDaysToSell(horse), 0) / soldHorses.length)
    : 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const statsCards = [
    {
      label: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: 'bg-green-100 text-green-600',
      trend: '+12%',
      trendUp: true
    },
    {
      label: 'Horses Sold',
      value: stats.totalSold.toString(),
      icon: Package,
      color: 'bg-blue-100 text-blue-600',
      subtext: `${stats.activeListings} active`
    },
    {
      label: 'Average Sale Price',
      value: formatCurrency(stats.averagePrice),
      icon: TrendingUp,
      color: 'bg-purple-100 text-purple-600',
      trend: '+5%',
      trendUp: true
    },
    {
      label: 'Avg Days to Sell',
      value: averageDaysToSell.toString(),
      icon: Calendar,
      color: 'bg-yellow-100 text-yellow-600',
      subtext: 'days'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-green-600">
                GiddyApp
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
              >
                <Home className="h-5 w-5" />
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-green-600" />
            Sales Analytics
          </h1>
          <p className="text-gray-600 mt-2">
            Track your sales performance and revenue
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stat.value}
                      {stat.subtext && (
                        <span className="text-sm font-normal text-gray-500 ml-1">
                          {stat.subtext}
                        </span>
                      )}
                    </p>
                    {stat.trend && (
                      <div className="flex items-center gap-1 mt-2">
                        {stat.trendUp ? (
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`text-sm ${
                          stat.trendUp ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {stat.trend}
                        </span>
                        <span className="text-xs text-gray-500">vs last month</span>
                      </div>
                    )}
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Revenue Chart */}
        {stats.monthlyData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Monthly Revenue</h2>
            <div className="h-64 flex items-end gap-2">
              {stats.monthlyData.map((month, index) => {
                const maxRevenue = Math.max(...stats.monthlyData.map(m => m.revenue))
                const height = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0
                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center gap-2"
                  >
                    <div className="w-full bg-gray-200 rounded-t relative" style={{ height: '200px' }}>
                      <div
                        className="absolute bottom-0 w-full bg-green-500 rounded-t transition-all duration-500 hover:bg-green-600"
                        style={{ height: `${height}%` }}
                        title={`${formatCurrency(month.revenue)} - ${month.count} sold`}
                      />
                    </div>
                    <div className="text-xs text-gray-600 text-center">
                      {month.month.split(' ')[0]}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Sold Horses Table */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Sales History</h2>

          {soldHorses.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No horses sold yet</p>
              <p className="text-sm mt-2">Your sold horses will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Horse
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Listed Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sold Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sold Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Days to Sell
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {soldHorses.map((horse) => {
                    const primaryImage = getPrimaryImage(horse.horse_images)
                    const daysToSell = calculateDaysToSell(horse)
                    const priceChange = (horse.sold_price || 0) - horse.price
                    const priceChangePercent = ((priceChange / horse.price) * 100).toFixed(1)

                    return (
                      <tr key={horse.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/horses/${horse.slug}`}
                            className="flex items-center gap-3 hover:text-green-600"
                          >
                            {primaryImage ? (
                              <div className="relative h-12 w-12 rounded overflow-hidden">
                                <Image
                                  src={primaryImage}
                                  alt={horse.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
                                <span className="text-xs text-gray-500">No img</span>
                              </div>
                            )}
                            <div>
                              <p className="font-semibold">{horse.name}</p>
                              <p className="text-sm text-gray-500">
                                {horse.breed} • {horse.age}yo
                              </p>
                            </div>
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-gray-900">{formatCurrency(horse.price)}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(horse.sold_price || 0)}
                          </p>
                          {priceChange !== 0 && (
                            <p className={`text-xs ${priceChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {priceChange > 0 ? '+' : ''}{priceChangePercent}%
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {horse.sold_date
                            ? new Date(horse.sold_date).toLocaleDateString()
                            : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            daysToSell <= 7
                              ? 'bg-green-100 text-green-800'
                              : daysToSell <= 30
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {daysToSell} days
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {horse.location?.city}, {horse.location?.state}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}