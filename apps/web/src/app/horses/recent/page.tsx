import { createClient } from '@/lib/supabase/server'
import { HorseGrid } from '@/components/horses/horse-grid'

async function getRecentHorses(days: number = 30) {
  const supabase = await createClient()

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  const { data } = await supabase
    .from('horses')
    .select(`
      id,
      slug,
      name,
      breed,
      age,
      gender,
      height,
      color,
      price,
      status,
      location,
      created_at,
      farm_name,
      farm_logo_url,
      horse_images (
        url,
        is_primary
      ),
      profiles!horses_seller_id_fkey (
        id,
        name,
        full_name,
        is_verified_seller
      )
    `)
    .eq('status', 'ACTIVE')
    .gte('created_at', cutoffDate.toISOString())
    .order('created_at', { ascending: false })

  return (data as any) || []
}

interface RecentPageProps {
  searchParams: { days?: string }
}

export default async function RecentPage({ searchParams }: RecentPageProps) {
  const days = searchParams.days ? parseInt(searchParams.days) : 30
  const horses = await getRecentHorses(days)

  const timeframes = [
    { label: 'Last 7 days', value: 7 },
    { label: 'Last 30 days', value: 30 },
    { label: 'Last 90 days', value: 90 },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Recently Listed Horses
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            {horses.length} {horses.length === 1 ? 'horse' : 'horses'} listed in the last {days} days
          </p>

          {/* Timeframe filters */}
          <div className="flex gap-2 flex-wrap">
            {timeframes.map((timeframe) => (
              <a
                key={timeframe.value}
                href={`/horses/recent?days=${timeframe.value}`}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  days === timeframe.value
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {timeframe.label}
              </a>
            ))}
          </div>
        </div>

        {/* Horse Grid */}
        {horses.length > 0 ? (
          <HorseGrid horses={horses} />
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500">No horses listed in the last {days} days</p>
          </div>
        )}
      </div>
    </div>
  )
}
