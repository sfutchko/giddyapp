'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ListingData } from '../listing-wizard'
import { ChevronRight } from 'lucide-react'

const basicInfoSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  breed: z.string().min(2, 'Please specify the breed'),
  age: z.number().min(0).max(40, 'Please enter a valid age'),
  gender: z.enum(['MARE', 'GELDING', 'STALLION']),
  height: z.number().min(10).max(20, 'Height must be between 10-20 hands'),
  weight: z.number().optional(),
  color: z.string().min(2, 'Please specify the color'),
  farmName: z.string().optional(),
})

type BasicInfoFormData = z.infer<typeof basicInfoSchema>

interface BasicInfoStepProps {
  data: Partial<ListingData>
  updateData: (data: Partial<ListingData>) => void
  onNext: () => void
}

// Common horse breeds for autocomplete
const HORSE_BREEDS = [
  'Thoroughbred',
  'Quarter Horse',
  'Arabian',
  'Warmblood',
  'Paint Horse',
  'Appaloosa',
  'Tennessee Walker',
  'Morgan',
  'Standardbred',
  'Mustang',
  'Friesian',
  'Draft Cross',
  'Pony',
  'Other',
]

// Common horse colors
const HORSE_COLORS = [
  'Bay',
  'Chestnut',
  'Black',
  'Gray',
  'Palomino',
  'Buckskin',
  'Pinto',
  'Roan',
  'Dun',
  'White',
  'Brown',
  'Other',
]

export function BasicInfoStep({ data, updateData, onNext }: BasicInfoStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BasicInfoFormData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      name: data.name || '',
      breed: data.breed || '',
      age: data.age || undefined,
      gender: data.gender || 'MARE',
      height: data.height || undefined,
      weight: data.weight || undefined,
      color: data.color || '',
      farmName: data.farmName || '',
    },
  })

  const onSubmit = (formData: BasicInfoFormData) => {
    updateData(formData)
    onNext()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Horse Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Horse Name *
          </label>
          <input
            {...register('name')}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="e.g., Midnight Star"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Breed */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Breed *
          </label>
          <select
            {...register('breed')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select breed</option>
            {HORSE_BREEDS.map(breed => (
              <option key={breed} value={breed}>{breed}</option>
            ))}
          </select>
          {errors.breed && (
            <p className="mt-1 text-sm text-red-600">{errors.breed.message}</p>
          )}
        </div>

        {/* Age */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Age (years) *
          </label>
          <input
            {...register('age', { valueAsNumber: true })}
            type="number"
            min="0"
            max="40"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="e.g., 7"
          />
          {errors.age && (
            <p className="mt-1 text-sm text-red-600">{errors.age.message}</p>
          )}
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gender *
          </label>
          <select
            {...register('gender')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="MARE">Mare</option>
            <option value="GELDING">Gelding</option>
            <option value="STALLION">Stallion</option>
          </select>
          {errors.gender && (
            <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
          )}
        </div>

        {/* Height */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Height (hands) *
          </label>
          <input
            {...register('height', { valueAsNumber: true })}
            type="number"
            min="10"
            max="20"
            step="0.1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="e.g., 15.2"
          />
          {errors.height && (
            <p className="mt-1 text-sm text-red-600">{errors.height.message}</p>
          )}
        </div>

        {/* Weight */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Weight (lbs) - Optional
          </label>
          <input
            {...register('weight', { valueAsNumber: true })}
            type="number"
            min="500"
            max="2500"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="e.g., 1200"
          />
          {errors.weight && (
            <p className="mt-1 text-sm text-red-600">{errors.weight.message}</p>
          )}
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Color *
          </label>
          <select
            {...register('color')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select color</option>
            {HORSE_COLORS.map(color => (
              <option key={color} value={color}>{color}</option>
            ))}
          </select>
          {errors.color && (
            <p className="mt-1 text-sm text-red-600">{errors.color.message}</p>
          )}
        </div>
      </div>

      {/* Farm Details Section */}
      <div className="pt-6 border-t">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Farm Details (Optional)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Farm Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Farm or Stable Name
            </label>
            <input
              {...register('farmName')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., Sacari Farms"
            />
            <p className="mt-1 text-xs text-gray-500">
              Add your farm name to build brand recognition
            </p>
            {errors.farmName && (
              <p className="mt-1 text-sm text-red-600">{errors.farmName.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-6 border-t">
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