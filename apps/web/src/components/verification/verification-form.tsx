'use client'

import React, { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  Input,
  Textarea,
  Select,
  FormGroup,
  FormSection
} from '@/components/ui/form-field'
import { SubmitButton } from '@/components/ui/form-utils'
import { US_STATES } from '@/lib/constants'
import { toast } from '@/hooks/use-toast'

const verificationSchema = z.object({
  business_name: z.string().optional(),
  business_type: z.enum(['individual', 'sole_proprietor', 'llc', 'corporation', 'partnership']),
  tax_id: z.string().optional(),
  phone: z.string().min(10, 'Valid phone number required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip: z.string().min(5, 'Valid ZIP code required'),
  website: z.string().url().optional().or(z.literal('')),
  years_experience: z.string(),
  professional_references: z.string().optional()
})

type VerificationFormData = z.infer<typeof verificationSchema>

interface DocumentUpload {
  type: string
  file: File
  preview?: string
}

interface Profile {
  id: string
  name: string
  email: string
}

interface VerificationFormProps {
  user: User
  profile: Profile | null
  onCancel: () => void
  onSuccess: () => void
}

export function VerificationForm({ user, profile, onCancel, onSuccess }: VerificationFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [documents, setDocuments] = useState<DocumentUpload[]>([])
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      business_type: 'individual',
      years_experience: '0-2'
    }
  })

  const businessType = watch('business_type')

  const handleDocumentUpload = (type: string, files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB')
      return
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG, WebP, and PDF files are allowed')
      return
    }

    // Remove existing document of same type
    setDocuments(prev => prev.filter(doc => doc.type !== type))

    // Add new document
    const newDoc: DocumentUpload = {
      type,
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }

    setDocuments(prev => [...prev, newDoc])
  }

  const removeDocument = (type: string) => {
    setDocuments(prev => prev.filter(doc => doc.type !== type))
  }

  const uploadDocumentToSupabase = async (doc: DocumentUpload, verificationId: string) => {
    const supabase = createClient()
    const fileName = `${verificationId}/${doc.type}-${Date.now()}.${doc.file.name.split('.').pop()}`

    const { data, error } = await supabase.storage
      .from('verification-documents')
      .upload(fileName, doc.file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('verification-documents')
      .getPublicUrl(fileName)

    return {
      url: publicUrl,
      name: doc.file.name,
      type: doc.type
    }
  }

  const onSubmit = async (data: VerificationFormData) => {
    // Validate required documents
    const requiredDocs = ['government_id', 'proof_of_address', 'bank_statement']
    const uploadedDocTypes = documents.map(d => d.type)
    const missingDocs = requiredDocs.filter(doc => !uploadedDocTypes.includes(doc))

    if (missingDocs.length > 0) {
      setError(`Please upload required documents: ${missingDocs.join(', ')}`)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Create verification request
      const { data: verification, error: verificationError } = await supabase
        .from('seller_verifications')
        .insert({
          user_id: user.id,
          status: 'pending',
          business_name: data.business_name || profile?.name,
          business_type: data.business_type,
          tax_id: data.tax_id,
          phone: data.phone,
          address: data.address,
          city: data.city,
          state: data.state,
          zip: data.zip,
          website: data.website,
          years_experience: data.years_experience,
          professional_references: data.professional_references,
          submitted_at: new Date().toISOString()
        })
        .select()
        .single()

      if (verificationError) throw verificationError

      // Upload documents
      const uploadPromises = documents.map(async (doc) => {
        setUploadProgress(prev => ({ ...prev, [doc.type]: 0 }))

        const uploadedDoc = await uploadDocumentToSupabase(doc, verification.id)

        // Save document reference in database
        const { error: docError } = await supabase
          .from('verification_documents')
          .insert({
            verification_id: verification.id,
            type: doc.type,
            url: uploadedDoc.url,
            name: uploadedDoc.name,
            uploaded_at: new Date().toISOString()
          })

        if (docError) throw docError

        setUploadProgress(prev => ({ ...prev, [doc.type]: 100 }))
        return uploadedDoc
      })

      await Promise.all(uploadPromises)

      // Update user profile to indicate verification is pending
      await supabase
        .from('profiles')
        .update({
          is_seller: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      toast.success('Verification request submitted successfully!')
      onSuccess()
    } catch (err: any) {
      console.error('Verification error:', err)
      setError(err.message || 'Failed to submit verification request')
    } finally {
      setIsLoading(false)
    }
  }

  const documentTypes = [
    {
      type: 'government_id',
      label: 'Government-Issued ID',
      description: 'Driver\'s license, passport, or state ID',
      required: true
    },
    {
      type: 'business_license',
      label: 'Business License',
      description: 'Required for business entities',
      required: businessType !== 'individual'
    },
    {
      type: 'proof_of_address',
      label: 'Proof of Address',
      description: 'Utility bill or bank statement (last 3 months)',
      required: true
    },
    {
      type: 'bank_statement',
      label: 'Bank Account Verification',
      description: 'Bank statement or voided check',
      required: true
    }
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormGroup>
        <FormSection
          title="Business Information"
          description="Tell us about your horse selling business"
        >
          <Select
            label="Business Type"
            required
            error={errors.business_type}
            register={register('business_type')}
            options={[
              { value: 'individual', label: 'Individual' },
              { value: 'sole_proprietor', label: 'Sole Proprietor' },
              { value: 'llc', label: 'LLC' },
              { value: 'corporation', label: 'Corporation' },
              { value: 'partnership', label: 'Partnership' }
            ]}
          />

          {businessType !== 'individual' && (
            <>
              <Input
                label="Business Name"
                required
                error={errors.business_name}
                register={register('business_name')}
                placeholder="Enter your business name"
              />

              <Input
                label="Tax ID / EIN"
                error={errors.tax_id}
                register={register('tax_id')}
                placeholder="XX-XXXXXXX"
              />
            </>
          )}

          <Input
            label="Business Website"
            type="url"
            error={errors.website}
            register={register('website')}
            placeholder="https://example.com"
          />

          <Select
            label="Years of Experience"
            required
            error={errors.years_experience}
            register={register('years_experience')}
            options={[
              { value: '0-2', label: '0-2 years' },
              { value: '3-5', label: '3-5 years' },
              { value: '6-10', label: '6-10 years' },
              { value: '10+', label: '10+ years' }
            ]}
          />
        </FormSection>

        <FormSection
          title="Contact Information"
          description="How can we reach you?"
        >
          <Input
            label="Phone Number"
            type="tel"
            required
            error={errors.phone}
            register={register('phone')}
            placeholder="(555) 123-4567"
          />

          <Input
            label="Street Address"
            required
            error={errors.address}
            register={register('address')}
            placeholder="123 Main Street"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <Input
                label="City"
                required
                error={errors.city}
                register={register('city')}
                placeholder="City"
              />
            </div>
            <div className="md:col-span-1">
              <Select
                label="State"
                required
                error={errors.state}
                register={register('state')}
                options={US_STATES.map(state => ({
                  value: state.value,
                  label: state.label
                }))}
                placeholder="Select state"
              />
            </div>
            <div className="md:col-span-1">
              <Input
                label="ZIP Code"
                required
                error={errors.zip}
                register={register('zip')}
                placeholder="12345"
              />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="References"
          description="Optional: Provide references to speed up verification"
        >
          <Textarea
            label="Professional References"
            error={errors.professional_references}
            register={register('professional_references')}
            placeholder="List any professional references, veterinarians, or industry contacts"
            rows={4}
          />
        </FormSection>

        <FormSection
          title="Document Upload"
          description="Upload required verification documents"
        >
          <div className="space-y-4">
            {documentTypes.map((docType) => {
              const uploaded = documents.find(d => d.type === docType.type)
              const progress = uploadProgress[docType.type]

              return (
                <div key={docType.type} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{docType.label}</h4>
                        {docType.required && (
                          <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{docType.description}</p>
                    </div>
                    {uploaded && (
                      <button
                        type="button"
                        onClick={() => removeDocument(docType.type)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <X className="h-4 w-4 text-gray-600" />
                      </button>
                    )}
                  </div>

                  {uploaded ? (
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      {uploaded.preview ? (
                        <img
                          src={uploaded.preview}
                          alt={docType.label}
                          className="h-12 w-12 object-cover rounded"
                        />
                      ) : (
                        <FileText className="h-8 w-8 text-green-600" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-900">{uploaded.file.name}</p>
                        <p className="text-xs text-green-700">
                          {(uploaded.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      {progress !== undefined && progress < 100 && (
                        <div className="w-20">
                          <div className="h-2 bg-gray-200 rounded-full">
                            <div
                              className="h-full bg-green-600 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {progress === 100 && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  ) : (
                    <label className="block">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleDocumentUpload(docType.type, e.target.files)}
                        className="hidden"
                      />
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          JPEG, PNG, WebP, or PDF (max 10MB)
                        </p>
                      </div>
                    </label>
                  )}
                </div>
              )
            })}
          </div>
        </FormSection>
      </FormGroup>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          disabled={isLoading}
        >
          Cancel
        </button>
        <div className="flex-1">
          <SubmitButton
            isLoading={isLoading}
            loadingText="Submitting..."
            className="w-full"
          >
            Submit Verification
          </SubmitButton>
        </div>
      </div>
    </form>
  )
}