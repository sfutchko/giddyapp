'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { BasicInfoStep } from './steps/basic-info-step'
import { DetailsStep } from './steps/details-step'
import { MediaStep } from './steps/media-step'
import { PricingStep } from './steps/pricing-step'
import { ReviewStep } from './steps/review-step'
import { createHorseListing } from '@/lib/actions/horses'
import { uploadImageToSupabase, uploadVideoToSupabase, uploadDocumentToSupabase } from '@/lib/supabase/upload'
import { createClient } from '@/lib/supabase/client'

export interface ListingData {
  // Basic Info
  name: string
  breed: string
  age: number
  gender: 'MARE' | 'GELDING' | 'STALLION'
  height: number
  weight?: number
  color: string

  // Details
  description: string
  disciplines: string[]
  temperament: string
  healthStatus: string
  registrations?: string
  competitionHistory?: string

  // Location
  street: string
  city: string
  state: string
  zipCode: string

  // Pricing
  price: number
  negotiable: boolean

  // Farm Details
  farmName?: string
  farmLogo?: File

  // Media
  images: File[]
  videos?: File[]
  documents?: File[]

  // Status
  status: 'DRAFT' | 'ACTIVE'
}

const STEPS = [
  { id: 1, name: 'Basic Info', description: 'Horse details and breed' },
  { id: 2, name: 'Details', description: 'Description and characteristics' },
  { id: 3, name: 'Media', description: 'Photos and videos' },
  { id: 4, name: 'Pricing', description: 'Price and location' },
  { id: 5, name: 'Review', description: 'Review and publish' },
]

interface ListingWizardProps {
  userId: string
}

export function ListingWizard({ userId }: ListingWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [listingData, setListingData] = useState<Partial<ListingData>>({
    status: 'DRAFT',
  })

  const updateData = (data: Partial<ListingData>) => {
    setListingData(prev => ({ ...prev, ...data }))
  }

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (status: 'DRAFT' | 'ACTIVE') => {
    setIsSubmitting(true)

    try {
      // Upload images first (client-side)
      const imageUrls = []
      if (listingData.images && listingData.images.length > 0) {
        for (let i = 0; i < listingData.images.length; i++) {
          const file = listingData.images[i]
          const result = await uploadImageToSupabase(file)

          if ('url' in result) {
            imageUrls.push({
              url: result.url,
              isPrimary: i === 0,
              order: i
            })
          } else {
            console.error('Failed to upload image:', result.error)
          }
        }
      }

      // Upload farm logo if provided
      let farmLogoUrl: string | undefined = undefined
      if (listingData.farmLogo) {
        const logoResult = await uploadImageToSupabase(listingData.farmLogo)
        if ('url' in logoResult) {
          farmLogoUrl = logoResult.url
        } else {
          console.error('Failed to upload farm logo:', logoResult.error)
        }
      }

      // Create the horse listing with image URLs
      const result = await createHorseListing({
        name: listingData.name!,
        breed: listingData.breed!,
        age: listingData.age!,
        gender: listingData.gender!,
        height: listingData.height!,
        weight: listingData.weight,
        color: listingData.color!,
        description: listingData.description!,
        disciplines: listingData.disciplines || [],
        temperament: listingData.temperament!,
        healthStatus: listingData.healthStatus!,
        registrations: listingData.registrations,
        street: listingData.street!,
        city: listingData.city!,
        state: listingData.state!,
        zipCode: listingData.zipCode!,
        price: listingData.price!,
        negotiable: listingData.negotiable || false,
        farmName: listingData.farmName,
        farmLogoUrl,
        status,
        images: imageUrls,
      })

      if ('error' in result) {
        console.error('Error creating listing:', result)
        alert(`Error: ${result.error}`)
        setIsSubmitting(false)
        return
      }

      const horseId = result.horse.id
      const supabase = createClient()

      // Upload videos if any
      if (listingData.videos && listingData.videos.length > 0) {
        console.log('📹 Uploading videos, count:', listingData.videos.length, 'horseId:', horseId)
        for (const video of listingData.videos) {
          console.log('📹 Uploading video:', video.name, 'size:', video.size)
          const uploadResult = await uploadVideoToSupabase(video, userId)
          console.log('📹 Upload result:', uploadResult)

          if ('url' in uploadResult) {
            const { data, error } = await supabase.from('horse_videos').insert({
              horse_id: horseId,
              url: uploadResult.url,
              title: video.name,
              file_size: video.size,
              display_order: 0
            })
            console.log('📹 DB insert result:', { data, error })
          } else {
            console.error('📹 Video upload failed:', uploadResult)
          }
        }
      } else {
        console.log('📹 No videos to upload')
      }

      // Upload documents if any
      if (listingData.documents && listingData.documents.length > 0) {
        for (const doc of listingData.documents) {
          const uploadResult = await uploadDocumentToSupabase(doc, userId)

          if ('url' in uploadResult) {
            await supabase.from('horse_documents').insert({
              horse_id: horseId,
              url: uploadResult.url,
              name: uploadResult.name,
              type: doc.type,
              file_size: doc.size
            })
          }
        }
      }

      // Success! Redirect to horses page instead of dashboard
      alert('Horse listing created successfully!')
      router.push('/horses')
    } catch (error) {
      console.error('Error submitting listing:', error)
      alert('An error occurred while creating your listing. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg">
      {/* Progress Bar */}
      <div className="px-8 py-6 border-b">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="relative">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    currentStep > step.id
                      ? 'bg-green-600 text-white'
                      : currentStep === step.id
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    step.id
                  )}
                </div>
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  <p className="text-xs font-medium text-gray-900">{step.name}</p>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`w-24 h-0.5 mx-2 transition-colors ${
                    currentStep > step.id ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-8">
          <p className="text-sm text-gray-600">
            Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].description}
          </p>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-8">
        {currentStep === 1 && (
          <BasicInfoStep
            data={listingData}
            updateData={updateData}
            onNext={handleNext}
          />
        )}
        {currentStep === 2 && (
          <DetailsStep
            data={listingData}
            updateData={updateData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {currentStep === 3 && (
          <MediaStep
            data={listingData}
            updateData={updateData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {currentStep === 4 && (
          <PricingStep
            data={listingData}
            updateData={updateData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {currentStep === 5 && (
          <ReviewStep
            data={listingData as ListingData}
            onBack={handleBack}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  )
}