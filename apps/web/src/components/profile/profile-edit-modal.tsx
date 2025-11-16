'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter
} from '@/components/ui/modal'
import {
  Input,
  Textarea,
  Select,
  FormGroup,
  FormSection
} from '@/components/ui/form-field'
import { SubmitButton } from '@/components/ui/form-utils'
import { createClient } from '@/lib/supabase/client'
import { US_STATES } from '@/lib/constants'

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  bio: z.string().max(500, 'Bio must be 500 characters or less').optional()
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileEditModalProps {
  isOpen: boolean
  onClose: () => void
  profile: any
  onSave: (profile: any) => void
}

export function ProfileEditModal({ isOpen, onClose, profile, onSave }: ProfileEditModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name || '',
      phone: profile?.phone || '',
      city: profile?.city || '',
      state: profile?.state || '',
      country: profile?.country || 'United States',
      bio: profile?.bio || ''
    }
  })

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: data.name,
          phone: data.phone,
          city: data.city,
          state: data.state,
          country: data.country,
          bio: data.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (updateError) {
        throw updateError
      }

      onSave({ ...profile, ...data })
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalHeader>
          <ModalTitle>Edit Profile</ModalTitle>
        </ModalHeader>

        <ModalBody>
          <FormGroup>
            <FormSection
              title="Personal Information"
              description="Update your personal details"
            >
              <Input
                label="Full Name"
                required
                error={errors.name}
                register={register('name')}
                placeholder="Enter your full name"
              />

              <Input
                label="Phone Number"
                type="tel"
                error={errors.phone}
                register={register('phone')}
                placeholder="+1 (555) 123-4567"
              />
            </FormSection>

            <FormSection
              title="Location"
              description="Help buyers know where you're located"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="City"
                  error={errors.city}
                  register={register('city')}
                  placeholder="Enter city"
                />

                <Select
                  label="State"
                  error={errors.state}
                  register={register('state')}
                  options={US_STATES.map(state => ({
                    value: state.value,
                    label: state.label
                  }))}
                  placeholder="Select state"
                />
              </div>

              <Input
                label="Country"
                error={errors.country}
                register={register('country')}
                placeholder="United States"
                disabled
              />
            </FormSection>

            <FormSection
              title="About You"
              description="Tell others about yourself"
            >
              <Textarea
                label="Bio"
                error={errors.bio}
                register={register('bio')}
                placeholder="Share a bit about yourself, your experience with horses, etc."
                rows={4}
                helperText={`${profile?.bio?.length || 0}/500 characters`}
              />
            </FormSection>
          </FormGroup>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <SubmitButton
            isLoading={isLoading}
            loadingText="Saving..."
          >
            Save Changes
          </SubmitButton>
        </ModalFooter>
      </form>
    </Modal>
  )
}