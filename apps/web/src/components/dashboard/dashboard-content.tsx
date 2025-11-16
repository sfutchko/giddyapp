'use client'

import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Search,
  PlusCircle,
  MessageSquare,
  Heart,
  User as UserIcon,
  Settings,
  LogOut,
  Activity,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  DollarSign,
  Pause,
  Play,
  CheckCircle,
  ChevronRight,
  Clock,
  TrendingUp,
  Briefcase,
  Bell
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface Horse {
  id: string
  slug: string
  name: string
  breed: string
  age: number
  gender: string
  height: number
  price: number
  status: string
  location: any
  view_count: number
  created_at: string
  horse_images?: Array<{
    url: string
    is_primary: boolean
  }>
}

interface DashboardStats {
  activeListings: number
  totalViews: number
  watching: number
  unreadMessages: number
  pendingOffers?: number
  pendingViewingRequests?: number
  totalRevenue?: number
  totalTransactions?: number
  activeTransactions?: number
  pendingRefundRequests?: number
}

interface WatchedHorse {
  id: string
  slug: string
  name: string
  breed: string
  price: number
  status: string
  watched_at: string
  horse_images?: Array<{
    url: string
    is_primary: boolean
  }>
}

interface DashboardContentProps {
  user: User
  horses: Horse[]
  stats: DashboardStats
  watchedHorses: WatchedHorse[]
  pendingPayments: any[]
}

export function DashboardContent({ user, horses, stats, watchedHorses, pendingPayments }: DashboardContentProps) {
  const router = useRouter()
  const supabase = createClient()
  const [listings, setListings] = useState(horses)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleDeleteListing = async (horseId: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) {
      return
    }

    setDeletingId(horseId)
    try {
      const { error } = await supabase
        .from('horses')
        .delete()
        .eq('id', horseId)
        .eq('seller_id', user.id)

      if (error) throw error

      setListings(listings.filter(h => h.id !== horseId))
      toast.success('Listing deleted successfully')
    } catch (error: any) {
      console.error('Error deleting listing:', error)
      toast.error('Failed to delete listing')
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleStatus = async (horseId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'

    try {
      const { error } = await supabase
        .from('horses')
        .update({ status: newStatus })
        .eq('id', horseId)
        .eq('seller_id', user.id)

      if (error) throw error

      setListings(listings.map(h =>
        h.id === horseId ? { ...h, status: newStatus } : h
      ))
      toast.success(`Listing ${newStatus === 'ACTIVE' ? 'activated' : 'paused'}`)
    } catch (error: any) {
      console.error('Error updating status:', error)
      toast.error('Failed to update listing status')
    }
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}k`
    }
    return `$${amount.toLocaleString()}`
  }

  const statsCards = [
    {
      label: 'Horses Available',
      value: stats.activeListings.toString(),
      icon: Activity,
      color: 'from-emerald-500 to-emerald-600',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      href: '#my-stable'
    },
    {
      label: 'Scheduled Viewings',
      value: (stats.pendingViewingRequests || 0).toString(),
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      href: '/dashboard/viewing-requests',
      badge: (stats.pendingViewingRequests || 0) > 0
    },
    {
      label: 'New Interest',
      value: stats.totalViews.toString(),
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      href: '#my-stable'
    },
    {
      label: 'Active Deals',
      value: ((stats.pendingOffers || 0) + (stats.activeTransactions || 0)).toString(),
      icon: Briefcase,
      color: 'from-amber-500 to-amber-600',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      href: '/offers',
      badge: ((stats.pendingOffers || 0) + (stats.activeTransactions || 0)) > 0
    },
  ]

  const getPrimaryImage = (images?: { url: string; is_primary: boolean }[]) => {
    const primary = images?.find(img => img.is_primary)
    return primary?.url || images?.[0]?.url
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-stone-200 sticky top-0 z-40 backdrop-blur-sm bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
                GiddyApp
              </Link>
              <div className="hidden md:flex items-center gap-1">
                <Link
                  href="/horses/map"
                  className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                >
                  Browse Horses
                </Link>
                <Link
                  href="/messages"
                  className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all relative"
                >
                  Messages
                  {stats.unreadMessages > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                  )}
                </Link>
                <Link
                  href="/watchlist"
                  className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                >
                  Watchlist
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/profile')}
                className="p-2 text-stone-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
              >
                <UserIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => router.push('/settings')}
                className="p-2 text-stone-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
              >
                <Settings className="h-5 w-5" />
              </button>
              <button
                onClick={handleSignOut}
                className="p-2 text-stone-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-stone-900">
              Welcome back, {user.user_metadata?.name || 'there'}
            </h1>
            <p className="text-stone-600 mt-2 text-lg">
              Here's what's happening with your stable today
            </p>
          </div>
          <Link
            href="/horses/new"
            className="hidden md:flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300"
          >
            <PlusCircle className="h-5 w-5" />
            List a Horse
          </Link>
        </div>

        {/* Pending Payments Alert */}
        {pendingPayments && pendingPayments.length > 0 && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-400 rounded-2xl p-6 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-xl shadow-md">
                <Bell className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-amber-900 mb-2">
                  Action Required: Complete Your Purchase{pendingPayments.length > 1 ? 's' : ''}
                </h3>
                <p className="text-amber-800 mb-4">
                  {pendingPayments.length === 1
                    ? 'Your offer has been accepted! Complete payment to finalize your purchase with escrow protection.'
                    : `You have ${pendingPayments.length} accepted offers awaiting payment. Complete payment to finalize your purchases with escrow protection.`
                  }
                </p>
                <div className="space-y-3">
                  {pendingPayments.map((payment) => {
                    const horse = payment.horses
                    const primaryImage = horse?.horse_images?.find((img: any) => img.is_primary)?.url || horse?.horse_images?.[0]?.url

                    return (
                      <div key={payment.id} className="bg-white border border-amber-200 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                        {primaryImage && (
                          <div className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden">
                            <Image
                              src={primaryImage}
                              alt={horse.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-bold text-stone-900">{horse.name}</h4>
                          <p className="text-sm text-stone-600 mt-1">
                            Offer Amount: <span className="font-semibold text-emerald-600">${payment.offer_amount.toLocaleString()}</span>
                          </p>
                        </div>
                        <Link
                          href={`/checkout/${payment.horse_id}?offerId=${payment.id}`}
                          className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all flex items-center gap-2 whitespace-nowrap shadow-md hover:shadow-lg"
                        >
                          <DollarSign className="h-5 w-5" />
                          Complete Payment
                        </Link>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat) => {
            const Icon = stat.icon
            const content = (
              <div className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer border border-stone-100 hover:border-stone-200">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`h-6 w-6 ${stat.textColor}`} />
                    </div>
                    {stat.badge && (
                      <span className="px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                        {parseInt(stat.value) > 9 ? '9+' : stat.value}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-stone-600 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-stone-900">{stat.value}</p>
                </div>
                <div className={`h-1 bg-gradient-to-r ${stat.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}></div>
              </div>
            )

            if (stat.href.startsWith('#')) {
              return <a key={stat.label} href={stat.href}>{content}</a>
            }
            return <Link key={stat.label} href={stat.href}>{content}</Link>
          })}
        </div>

        {/* Action Items - Messages, Offers, Viewings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/messages"
            className="group p-6 bg-white rounded-2xl shadow-md hover:shadow-xl border border-stone-200 hover:border-emerald-200 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-50 rounded-xl group-hover:scale-110 transition-transform">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
              {stats.unreadMessages > 0 && (
                <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                  {stats.unreadMessages}
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-stone-900 mb-1">Messages</h3>
            <p className="text-sm text-stone-600">Stay connected with buyers</p>
          </Link>

          <Link
            href="/offers"
            className="group p-6 bg-white rounded-2xl shadow-md hover:shadow-xl border border-stone-200 hover:border-emerald-200 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-50 rounded-xl group-hover:scale-110 transition-transform">
                <Briefcase className="h-6 w-6 text-amber-600" />
              </div>
              {stats.pendingOffers && stats.pendingOffers > 0 && (
                <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                  {stats.pendingOffers}
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-stone-900 mb-1">Offers</h3>
            <p className="text-sm text-stone-600">Review and negotiate deals</p>
          </Link>

          <Link
            href="/dashboard/viewing-requests"
            className="group p-6 bg-white rounded-2xl shadow-md hover:shadow-xl border border-stone-200 hover:border-emerald-200 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-xl group-hover:scale-110 transition-transform">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              {stats.pendingViewingRequests && stats.pendingViewingRequests > 0 && (
                <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                  {stats.pendingViewingRequests}
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-stone-900 mb-1">Viewings</h3>
            <p className="text-sm text-stone-600">Schedule and manage visits</p>
          </Link>
        </div>

        {/* My Stable Section */}
        <div id="my-stable" className="bg-white rounded-2xl shadow-lg border border-stone-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-stone-900">My Stable</h2>
              <p className="text-stone-600 mt-1">Manage your horse listings and track performance</p>
            </div>
            <Link
              href="/horses/new"
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg"
            >
              <PlusCircle className="h-5 w-5" />
              <span className="hidden sm:inline">Add Horse</span>
            </Link>
          </div>

          {listings.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="inline-flex p-6 bg-stone-100 rounded-full mb-4">
                <Activity className="h-12 w-12 text-stone-400" />
              </div>
              <h3 className="text-xl font-semibold text-stone-900 mb-2">No horses in your stable yet</h3>
              <p className="text-stone-600 mb-6 max-w-md mx-auto">
                Start building your stable by listing your first horse. It only takes a few minutes!
              </p>
              <Link
                href="/horses/new"
                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg hover:shadow-xl"
              >
                <PlusCircle className="h-5 w-5" />
                List Your First Horse
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((horse) => {
                const primaryImage = getPrimaryImage(horse.horse_images)

                return (
                  <div key={horse.id} className="group bg-white rounded-xl overflow-hidden border-2 border-stone-100 hover:border-emerald-200 hover:shadow-xl transition-all duration-300">
                    {/* Image */}
                    <Link href={`/horses/${horse.slug}`} className="block relative h-56 bg-gradient-to-br from-stone-100 to-stone-200 overflow-hidden">
                      {primaryImage ? (
                        <Image
                          src={primaryImage}
                          alt={horse.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center">
                            <Activity className="h-10 w-10 mx-auto text-stone-300 mb-2" />
                            <span className="text-sm text-stone-400">No image</span>
                          </div>
                        </div>
                      )}

                      {/* Status Badge */}
                      <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-sm shadow-lg ${
                        horse.status === 'ACTIVE'
                          ? 'bg-emerald-500/90 text-white'
                          : horse.status === 'PAUSED'
                          ? 'bg-amber-500/90 text-white'
                          : horse.status === 'SOLD'
                          ? 'bg-stone-800/90 text-white'
                          : 'bg-stone-500/90 text-white'
                      }`}>
                        {horse.status}
                      </div>

                      {/* Quick Stats Overlay */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/95 backdrop-blur-sm rounded-lg text-xs font-medium text-stone-700 shadow-md">
                          <Eye className="h-3.5 w-3.5" />
                          {horse.view_count || 0}
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/95 backdrop-blur-sm rounded-lg text-xs font-medium text-stone-700 shadow-md">
                          <Heart className="h-3.5 w-3.5" />
                          {stats.watching || 0}
                        </div>
                      </div>
                    </Link>

                    {/* Content */}
                    <div className="p-5">
                      <Link href={`/horses/${horse.slug}`} className="group/title">
                        <h4 className="font-bold text-lg text-stone-900 group-hover/title:text-emerald-600 transition-colors">{horse.name}</h4>
                      </Link>
                      <p className="text-sm text-stone-600 mt-1 font-medium">
                        {horse.breed} <span className="text-stone-400">•</span> {horse.age} years <span className="text-stone-400">•</span> {horse.gender}
                      </p>
                      <div className="flex items-center gap-1.5 text-sm text-stone-500 mt-2">
                        <MapPin className="h-4 w-4" />
                        {horse.location?.city}, {horse.location?.state}
                      </div>
                      <div className="mt-4 pt-4 border-t border-stone-100">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
                            ${horse.price.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-4">
                        {horse.status === 'SOLD' ? (
                          <div className="flex-1 text-center py-3 bg-stone-100 rounded-lg">
                            <div className="flex items-center justify-center gap-2 text-stone-600">
                              <CheckCircle className="h-5 w-5" />
                              <span className="text-sm font-medium">Sold</span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <Link
                              href={`/horses/${horse.slug}/edit`}
                              className="flex-1 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </Link>
                            <button
                              onClick={() => handleToggleStatus(horse.id, horse.status)}
                              className="flex-1 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                            >
                              {horse.status === 'ACTIVE' ? (
                                <>
                                  <Pause className="h-4 w-4" />
                                  Pause
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4" />
                                  Activate
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteListing(horse.id)}
                              disabled={deletingId === horse.id}
                              className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Watchlist */}
        <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-3">
                <Heart className="h-7 w-7 text-red-500 fill-current" />
                Watchlist
              </h2>
              <p className="text-stone-600 mt-1">Horses you're interested in</p>
            </div>
            <Link
              href="/watchlist"
              className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold transition-colors group"
            >
              View All
              <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {watchedHorses.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex p-5 bg-red-50 rounded-full mb-4">
                <Heart className="h-10 w-10 text-red-300" />
              </div>
              <h3 className="text-lg font-semibold text-stone-900 mb-2">No horses in your watchlist</h3>
              <p className="text-stone-600 mb-6">Start watching horses to keep track of your favorites</p>
              <Link
                href="/horses/map"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg"
              >
                <Search className="h-5 w-5" />
                Browse Horses
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {watchedHorses.map((horse) => {
                const primaryImage = getPrimaryImage(horse.horse_images)

                return (
                  <Link
                    key={horse.id}
                    href={`/horses/${horse.slug}`}
                    className="group bg-white rounded-xl overflow-hidden border-2 border-stone-100 hover:border-emerald-200 hover:shadow-lg transition-all duration-300"
                  >
                    {/* Image */}
                    <div className="relative h-40 bg-gradient-to-br from-stone-100 to-stone-200 overflow-hidden">
                      {primaryImage ? (
                        <Image
                          src={primaryImage}
                          alt={horse.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Activity className="h-8 w-8 text-stone-300" />
                        </div>
                      )}

                      {/* Status Badge */}
                      {horse.status === 'SOLD' && (
                        <div className="absolute top-2 right-2 px-2.5 py-1 rounded-lg text-xs font-bold bg-stone-800/90 text-white backdrop-blur-sm">
                          SOLD
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-3">
                      <h4 className="font-bold text-sm text-stone-900 truncate group-hover:text-emerald-600 transition-colors">{horse.name}</h4>
                      <p className="text-xs text-stone-600 mt-1 truncate">{horse.breed}</p>
                      <div className="mt-2 pt-2 border-t border-stone-100">
                        <span className="font-bold text-emerald-600 text-sm">
                          ${horse.price.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}