import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface DisciplineCount {
  discipline: string
  count: number
}

async function getDisciplineCounts(): Promise<DisciplineCount[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('horses')
    .select('metadata')
    .eq('status', 'ACTIVE')

  if (!data) return []

  const disciplineMap: Record<string, number> = {}

  data.forEach((horse) => {
    const disciplines = horse.metadata?.disciplines as string[] | undefined
    if (Array.isArray(disciplines)) {
      disciplines.forEach((discipline) => {
        if (discipline && typeof discipline === 'string') {
          disciplineMap[discipline] = (disciplineMap[discipline] || 0) + 1
        }
      })
    }
  })

  return Object.entries(disciplineMap)
    .map(([discipline, count]) => ({ discipline, count }))
    .sort((a, b) => b.count - a.count)
}

const DISCIPLINE_CATEGORIES = {
  'Western': ['Western Pleasure', 'Reining', 'Cutting', 'Barrel Racing', 'Ranch Work', 'Team Penning', 'Roping'],
  'English': ['Dressage', 'Show Jumping', 'Eventing', 'Hunter/Jumper', 'Combined Driving'],
  'Racing': ['Flat Racing', 'Harness Racing', 'Steeplechase', 'Endurance'],
  'Recreation': ['Trail Riding', 'Pleasure', 'Family Horse', 'Companion'],
  'Other': ['Driving', 'Vaulting', 'Polo', 'Working Equitation'],
}

export default async function DisciplinesPage() {
  const disciplines = await getDisciplineCounts()
  const totalHorses = disciplines.reduce((sum, d) => sum + d.count, 0)

  const categorizedDisciplines: Record<string, DisciplineCount[]> = {}
  const uncategorized: DisciplineCount[] = []

  disciplines.forEach((disc) => {
    let found = false
    for (const [category, categoryDisciplines] of Object.entries(DISCIPLINE_CATEGORIES)) {
      if (categoryDisciplines.includes(disc.discipline)) {
        if (!categorizedDisciplines[category]) {
          categorizedDisciplines[category] = []
        }
        categorizedDisciplines[category].push(disc)
        found = true
        break
      }
    }
    if (!found) {
      uncategorized.push(disc)
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Browse Horses by Discipline
          </h1>
          <p className="text-lg text-gray-600">
            Find horses suited for your riding style and competition goals
          </p>
        </div>

        {/* Categories */}
        <div className="space-y-8">
          {Object.entries(categorizedDisciplines).map(([category, categoryDisciplines]) => (
            <div key={category}>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryDisciplines.map((disc) => (
                  <Link
                    key={disc.discipline}
                    href={`/horses?discipline=${encodeURIComponent(disc.discipline)}`}
                    className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-5 group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                          {disc.discipline}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {disc.count} {disc.count === 1 ? 'horse' : 'horses'}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {/* Uncategorized disciplines */}
          {uncategorized.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Other Disciplines
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {uncategorized.map((disc) => (
                  <Link
                    key={disc.discipline}
                    href={`/horses?discipline=${encodeURIComponent(disc.discipline)}`}
                    className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-5 group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                          {disc.discipline}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {disc.count} {disc.count === 1 ? 'horse' : 'horses'}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {disciplines.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500">No disciplines found</p>
          </div>
        )}
      </div>
    </div>
  )
}
