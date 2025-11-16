import { Shield, CheckCircle, MapPin, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

async function getMarketplaceStats() {
  const supabase = await createClient()

  const [{ count: totalListings }, { data: states }] = await Promise.all([
    supabase.from('horses').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
    supabase.from('horses').select('location').eq('status', 'ACTIVE').limit(1000)
  ])

  const uniqueStates = new Set(
    states?.map(h => {
      const loc = h.location
      return typeof loc === 'string' ? null : loc?.state
    }).filter(Boolean)
  )

  return {
    totalListings: totalListings || 0,
    statesCount: uniqueStates.size || 0
  }
}

export async function TrustIndicators() {
  const stats = await getMarketplaceStats()

  const indicators = [
    {
      icon: TrendingUp,
      value: stats.totalListings.toLocaleString(),
      label: 'Active Listings',
      description: 'Horses available nationwide',
    },
    {
      icon: MapPin,
      value: `${stats.statesCount}+`,
      label: 'States',
      description: 'Coast to coast coverage',
    },
    {
      icon: Shield,
      value: '100%',
      label: 'Verified Sellers',
      description: 'Identity confirmed',
    },
    {
      icon: CheckCircle,
      value: '24/7',
      label: 'Support',
      description: 'Expert assistance',
    },
  ]

  return (
    <section className="py-24 px-4 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Choose GiddyApp
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            The most trusted platform for buying and selling quality horses
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {indicators.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="group">
                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:border-green-100 transition-all duration-300 h-full">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl mb-5 group-hover:scale-110 transition-transform">
                    <Icon className="h-7 w-7 text-green-600" />
                  </div>
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm md:text-base font-bold text-gray-800 mb-2">
                    {stat.label}
                  </div>
                  <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                    {stat.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}