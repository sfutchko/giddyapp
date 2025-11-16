'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ListingData } from '../listing-wizard'
import { ChevronRight, ChevronLeft } from 'lucide-react'

const detailsSchema = z.object({
  description: z.string().min(50, 'Description must be at least 50 characters'),
  disciplines: z.array(z.string()).min(1, 'Select at least one discipline'),
  temperament: z.string().min(10, 'Please describe the temperament'),
  healthStatus: z.string().min(10, 'Please describe health status'),
  registrations: z.string().optional(),
  competitionHistory: z.string().optional(),
})

type DetailsFormData = z.infer<typeof detailsSchema>

interface DetailsStepProps {
  data: Partial<ListingData>
  updateData: (data: Partial<ListingData>) => void
  onNext: () => void
  onBack: () => void
}

const DISCIPLINES = [
  'Trail Riding',
  'Western Pleasure',
  'English Pleasure',
  'Dressage',
  'Jumping',
  'Eventing',
  'Barrel Racing',
  'Reining',
  'Cutting',
  'Endurance',
  'Driving',
  'Ranch Work',
  'Therapeutic',
  'Breeding',
  'Other',
]

export function DetailsStep({ data, updateData, onNext, onBack }: DetailsStepProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DetailsFormData>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      description: data.description || '',
      disciplines: data.disciplines || [],
      temperament: data.temperament || '',
      healthStatus: data.healthStatus || '',
      registrations: data.registrations || '',
      competitionHistory: data.competitionHistory || '',
    },
  })

  const selectedDisciplines = watch('disciplines') || []

  const toggleDiscipline = (discipline: string) => {
    const current = selectedDisciplines || []
    if (current.includes(discipline)) {
      setValue('disciplines', current.filter(d => d !== discipline))
    } else {
      setValue('disciplines', [...current, discipline])
    }
  }

  const onSubmit = (formData: DetailsFormData) => {
    updateData(formData)
    onNext()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description *
        </label>
        <textarea
          {...register('description')}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Describe your horse's personality, training, experience, and any special qualities that make them unique..."
        />
        <p className="mt-1 text-sm text-gray-500">
          Minimum 50 characters. Be detailed to attract serious buyers.
        </p>
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {/* Disciplines */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Disciplines & Activities * (Select all that apply)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {DISCIPLINES.map(discipline => (
            <label
              key={discipline}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedDisciplines.includes(discipline)}
                onChange={() => toggleDiscipline(discipline)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">{discipline}</span>
            </label>
          ))}
        </div>
        {errors.disciplines && (
          <p className="mt-2 text-sm text-red-600">{errors.disciplines.message}</p>
        )}
      </div>

      {/* Temperament */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Temperament & Personality *
        </label>
        <textarea
          {...register('temperament')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Describe the horse's temperament, energy level, and suitability for different riders..."
        />
        {errors.temperament && (
          <p className="mt-1 text-sm text-red-600">{errors.temperament.message}</p>
        )}
      </div>

      {/* Health Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Health & Veterinary Status *
        </label>
        <textarea
          {...register('healthStatus')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Current health status, recent vet checks, vaccinations, any past injuries or conditions..."
        />
        {errors.healthStatus && (
          <p className="mt-1 text-sm text-red-600">{errors.healthStatus.message}</p>
        )}
      </div>

      {/* Registrations */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Registration & Papers (Optional)
        </label>
        <input
          {...register('registrations')}
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="e.g., AQHA #12345678, Coggins current through 2024"
        />
      </div>

      {/* Competition History */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Competition History (Optional)
        </label>
        <textarea
          {...register('competitionHistory')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="List show results, awards, competition experience, or performance records..."
        />
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
        >
          <ChevronLeft className="h-5 w-5" />
          Previous
        </button>
        <button
          type="submit"
          className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          Next Step
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </form>
  )
}