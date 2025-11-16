import { MapPin, Calendar, Ruler } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

interface Horse {
  id: string
  name: string
  slug: string
  breed: string
  age: number
  height: number
  price: number
  location: any
  horse_images: Array<{ url: string; is_primary: boolean }>
  profiles?: {
    is_verified_seller?: boolean
  }
}

async function getFeaturedHorses(): Promise<Horse[]> {
  const supabase = await createClient()

  // Fetch 8 most recent active horses
  const { data } = await supabase
    .from('horses')
    .select(`
      id,
      name,
      slug,
      breed,
      age,
      gender,
      color,
      height,
      price,
      location,
      seller_id,
      created_at,
      horse_images (
        url,
        is_primary
      ),
      profiles!horses_seller_id_fkey (
        is_verified_seller
      )
    `)
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false })
    .limit(8)

  return (data as any) || []
}

export async function FeaturedListings() {
  const horses = await getFeaturedHorses()

  if (!horses || horses.length === 0) {
    return null
  }

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Recently Listed Horses
          </h2>
          <p className="text-base text-gray-600">
            Based on your recent activity
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {horses.map((horse) => {
            const primaryImage = horse.horse_images?.find(img => img.is_primary) || horse.horse_images?.[0]
            const locationString = typeof horse.location === 'string'
              ? horse.location
              : `${horse.location?.city || ''}, ${horse.location?.state || ''}`.trim()
            const isVerified = horse.profiles?.is_verified_seller
            const isNew = new Date((horse as any).created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

            return (
              <Link
                key={horse.id}
                href={`/horses/${horse.slug}`}
                className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-lg transition-all"
              >
                <div className="relative h-56 bg-gray-100">
                  {primaryImage ? (
                    <Image
                      src={primaryImage.url}
                      alt={horse.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No image
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {isNew && (
                      <div className="px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-md shadow">
                        NEW
                      </div>
                    )}
                    {isVerified && (
                      <div className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-md shadow">
                        Verified
                      </div>
                    )}
                  </div>
                  <div className="absolute top-3 right-3 px-3 py-1 bg-white rounded-md shadow">
                    <span className="text-slate-900 font-bold text-sm">
                      ${horse.price.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  {/* Location first */}
                  <div className="flex items-center gap-1 text-gray-500 text-sm mb-2">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate">{locationString}</span>
                  </div>

                  {/* Breed and Color/Gender */}
                  <div className="mb-3">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-slate-800 transition-colors">
                      {horse.breed}
                    </h3>
                    {(horse as any).color && (
                      <p className="text-gray-600 text-sm">{(horse as any).color} • {(horse as any).gender}</p>
                    )}
                    {!(horse as any).color && (horse as any).gender && (
                      <p className="text-gray-600 text-sm capitalize">{((horse as any).gender as string).toLowerCase()}</p>
                    )}
                  </div>

                  {/* Age and Height */}
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{horse.age} years</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Ruler className="h-3.5 w-3.5" />
                      <span>{horse.height} hh</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}