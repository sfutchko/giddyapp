'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ListingData } from '../listing-wizard'
import { ChevronRight, ChevronLeft, DollarSign, MapPin } from 'lucide-react'

const pricingSchema = z.object({
  price: z.number().min(1, 'Please enter a price'),
  negotiable: z.boolean(),
  street: z.string().min(2, 'Please enter a street address'),
  city: z.string().min(2, 'Please enter a city'),
  state: z.string().min(2, 'Please select a state'),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Please enter a valid zip code'),
})

type PricingFormData = z.infer<typeof pricingSchema>

interface PricingStepProps {
  data: Partial<ListingData>
  updateData: (data: Partial<ListingData>) => void
  onNext: () => void
  onBack: () => void
}

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
]

export function PricingStep({ data, updateData, onNext, onBack }: PricingStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PricingFormData>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      price: data.price || undefined,
      negotiable: data.negotiable || false,
      street: data.street || '',
      city: data.city || '',
      state: data.state || '',
      zipCode: data.zipCode || '',
    },
  })

  const onSubmit = (formData: PricingFormData) => {
    updateData(formData)
    onNext()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Pricing Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          Pricing
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asking Price *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                {...register('price', { valueAsNumber: true })}
                type="number"
                min="1"
                step="1"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="15000"
              />
            </div>
            {errors.price && (
              <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
            )}
          </div>

          {/* Negotiable */}
          <div className="flex items-center">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                {...register('negotiable')}
                type="checkbox"
                className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Price is negotiable</span>
                <p className="text-xs text-gray-500">Check if you're open to offers</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Location Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-green-600" />
          Location
        </h3>

        {/* Street Address */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Street Address *
          </label>
          <input
            {...register('street')}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="123 Main Street"
          />
          {errors.street && (
            <p className="mt-1 text-sm text-red-600">{errors.street.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Street address is required for accurate map placement
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City *
            </label>
            <input
              {...register('city')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Lexington"
            />
            {errors.city && (
              <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
            )}
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State *
            </label>
            <select
              {...register('state')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select state</option>
              {US_STATES.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            {errors.state && (
              <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
            )}
          </div>

          {/* Zip Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zip Code *
            </label>
            <input
              {...register('zipCode')}
              type="text"
              pattern="[0-9]{5}(-[0-9]{4})?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="40507"
            />
            {errors.zipCode && (
              <p className="mt-1 text-sm text-red-600">{errors.zipCode.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Pricing Tips */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-semibold text-green-900 mb-2">Pricing Your Horse</h4>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• Research similar horses in your area</li>
          <li>• Consider age, training, and experience</li>
          <li>• Factor in registration and show records</li>
          <li>• Be realistic to attract serious buyers</li>
        </ul>
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