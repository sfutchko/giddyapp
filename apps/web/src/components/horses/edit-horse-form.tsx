'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import {
  Save,
  X,
  Upload,
  Trash2,
  Image as ImageIcon,
  Star,
  ArrowLeft,
  Loader2,
  Film,
  FileText
} from 'lucide-react'
import Image from 'next/image'
import { US_STATES } from '@/lib/constants'
import { uploadVideoToSupabase, uploadDocumentToSupabase } from '@/lib/supabase/upload'
import { geocodeAddress } from '@/lib/utils/geocoding'

interface HorseImage {
  id: string
  url: string
  is_primary: boolean
  display_order: number
}

interface HorseVideo {
  id: string
  url: string
  title: string | null
  file_size: number | null
  display_order: number
}

interface HorseDocument {
  id: string
  url: string
  name: string
  type: string
  file_size: number | null
}

interface Horse {
  id: string
  slug: string
  name: string
  breed: string
  age: number
  gender: string
  height: number
  weight?: number
  color: string
  price: number
  description: string
  location: {
    city: string
    state: string
    zipCode: string
    country: string
  }
  metadata: {
    disciplines?: string[]
    temperament?: string
    healthStatus?: string
    registrations?: string
    competitionHistory?: string
    negotiable?: boolean
  }
  status: string
  horse_images?: HorseImage[]
  horse_videos?: HorseVideo[]
  horse_documents?: HorseDocument[]
}

interface EditHorseFormProps {
  horse: Horse
  user: User
}

const DISCIPLINES = [
  'Trail Riding',
  'Western Pleasure',
  'English Pleasure',
  'Dressage',
  'Jumping',
  'Eventing',
  'Reining',
  'Barrel Racing',
  'Cutting',
  'Roping',
  'Endurance',
  'Driving',
  'Ranch Work',
  'Therapeutic',
  'Breeding',
  'Other'
]

export function EditHorseForm({ horse, user }: EditHorseFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [isDeletingImage, setIsDeletingImage] = useState<string | null>(null)
  const [uploadingImages, setUploadingImages] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: horse.name,
    breed: horse.breed,
    age: horse.age,
    gender: horse.gender,
    height: horse.height,
    weight: horse.weight || '',
    color: horse.color,
    price: horse.price,
    description: horse.description,
    city: horse.location.city,
    state: horse.location.state,
    zipCode: horse.location.zipCode,
    disciplines: horse.metadata?.disciplines || [],
    temperament: horse.metadata?.temperament || '',
    healthStatus: horse.metadata?.healthStatus || '',
    registrations: horse.metadata?.registrations || '',
    competitionHistory: horse.metadata?.competitionHistory || '',
    negotiable: horse.metadata?.negotiable || false,
    status: horse.status
  })

  const [existingImages, setExistingImages] = useState<HorseImage[]>(
    horse.horse_images || []
  )
  const [newImageFiles, setNewImageFiles] = useState<File[]>([])
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([])

  const [existingVideos, setExistingVideos] = useState<HorseVideo[]>(
    horse.horse_videos || []
  )
  const [newVideoFiles, setNewVideoFiles] = useState<File[]>([])

  const [existingDocuments, setExistingDocuments] = useState<HorseDocument[]>(
    horse.horse_documents || []
  )
  const [newDocumentFiles, setNewDocumentFiles] = useState<File[]>([])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleDisciplineToggle = (discipline: string) => {
    setFormData(prev => ({
      ...prev,
      disciplines: prev.disciplines.includes(discipline)
        ? prev.disciplines.filter(d => d !== discipline)
        : [...prev.disciplines, discipline]
    }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    // Validate file types
    const validFiles = files.filter(file =>
      file.type.startsWith('image/')
    )

    if (validFiles.length !== files.length) {
      toast.error('Only image files are allowed')
    }

    // Create previews
    const previews = validFiles.map(file => URL.createObjectURL(file))

    setNewImageFiles(prev => [...prev, ...validFiles])
    setNewImagePreviews(prev => [...prev, ...previews])
  }

  const handleRemoveNewImage = (index: number) => {
    URL.revokeObjectURL(newImagePreviews[index])
    setNewImageFiles(prev => prev.filter((_, i) => i !== index))
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleDeleteExistingImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return
    }

    setIsDeletingImage(imageId)
    try {
      const { error } = await supabase
        .from('horse_images')
        .delete()
        .eq('id', imageId)
        .eq('horse_id', horse.id)

      if (error) throw error

      setExistingImages(prev => prev.filter(img => img.id !== imageId))
      toast.success('Image deleted successfully')
    } catch (error: any) {
      console.error('Error deleting image:', error)
      toast.error('Failed to delete image')
    } finally {
      setIsDeletingImage(null)
    }
  }

  const handleSetPrimaryImage = async (imageId: string) => {
    try {
      // First, unset all primary flags for this horse
      await supabase
        .from('horse_images')
        .update({ is_primary: false })
        .eq('horse_id', horse.id)

      // Then set the selected image as primary
      const { error } = await supabase
        .from('horse_images')
        .update({ is_primary: true })
        .eq('id', imageId)

      if (error) throw error

      setExistingImages(prev => prev.map(img => ({
        ...img,
        is_primary: img.id === imageId
      })))

      toast.success('Primary image updated')
    } catch (error: any) {
      console.error('Error updating primary image:', error)
      toast.error('Failed to update primary image')
    }
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('video/')) {
        toast.error(`${file.name}: Only video files are allowed`)
        return false
      }
      if (file.size > MAX_VIDEO_SIZE) {
        toast.error(`${file.name}: Video must be under 50MB (current: ${(file.size / 1024 / 1024).toFixed(1)}MB)`)
        return false
      }
      return true
    })

    if (validFiles.length > 0) {
      setNewVideoFiles(prev => [...prev, ...validFiles])
    }
  }

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setNewDocumentFiles(prev => [...prev, ...files])
  }

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('Delete this video?')) return

    try {
      const { error } = await supabase
        .from('horse_videos')
        .delete()
        .eq('id', videoId)

      if (error) throw error

      setExistingVideos(prev => prev.filter(v => v.id !== videoId))
      toast.success('Video deleted')
    } catch (error: any) {
      console.error('Error deleting video:', error)
      toast.error('Failed to delete video')
    }
  }

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Delete this document?')) return

    try {
      const { error } = await supabase
        .from('horse_documents')
        .delete()
        .eq('id', docId)

      if (error) throw error

      setExistingDocuments(prev => prev.filter(d => d.id !== docId))
      toast.success('Document deleted')
    } catch (error: any) {
      console.error('Error deleting document:', error)
      toast.error('Failed to delete document')
    }
  }

  const uploadNewImages = async () => {
    if (newImageFiles.length === 0) return []

    const uploadedImages = []

    for (let i = 0; i < newImageFiles.length; i++) {
      const file = newImageFiles[i]
      const fileName = `${horse.id}/${Date.now()}-${file.name}`

      const { data, error } = await supabase.storage
        .from('media')
        .upload(fileName, file)

      if (error) {
        console.error('Error uploading image:', error)
        continue
      }

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(fileName)

      uploadedImages.push({
        horse_id: horse.id,
        url: publicUrl,
        is_primary: existingImages.length === 0 && i === 0,
        display_order: existingImages.length + i
      })
    }

    return uploadedImages
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Upload new images first
      setUploadingImages(true)
      const uploadedImages = await uploadNewImages()
      setUploadingImages(false)

      // Add uploaded images to database
      if (uploadedImages.length > 0) {
        const { error: imageError } = await supabase
          .from('horse_images')
          .insert(uploadedImages)

        if (imageError) {
          console.error('Error saving images:', imageError)
        }
      }

      // Upload and save videos
      for (const video of newVideoFiles) {
        console.log('📹 Uploading video:', video.name, 'for horse:', horse.id)
        const uploadResult = await uploadVideoToSupabase(video, user.id)
        console.log('📹 Upload result:', uploadResult)

        if ('url' in uploadResult) {
          const { data, error } = await supabase.from('horse_videos').insert({
            horse_id: horse.id,
            url: uploadResult.url,
            title: video.name,
            file_size: video.size,
            display_order: 0
          })
          console.log('📹 DB insert result:', { data, error })

          if (error) {
            console.error('📹 Failed to insert video:', error)
            toast.error(`Failed to save video: ${error.message}`)
          }
        } else {
          console.error('📹 Video upload failed:', uploadResult)
          toast.error(`Failed to upload video: ${uploadResult.error}`)
        }
      }

      // Upload and save documents
      for (const doc of newDocumentFiles) {
        const uploadResult = await uploadDocumentToSupabase(doc, user.id)
        if ('url' in uploadResult) {
          await supabase.from('horse_documents').insert({
            horse_id: horse.id,
            url: uploadResult.url,
            name: uploadResult.name,
            type: doc.type,
            file_size: doc.size
          })
        }
      }

      // Check if price changed for price history tracking
      const oldPrice = horse.price
      const newPrice = formData.price
      const priceChanged = oldPrice !== newPrice

      // Geocode location if it changed
      let latitude = horse.latitude
      let longitude = horse.longitude
      const locationString = `${formData.city}, ${formData.state} ${formData.zipCode}`
      const oldLocationString = horse.location ? `${horse.location.city}, ${horse.location.state} ${horse.location.zipCode}` : ''

      if (locationString !== oldLocationString) {
        const geocodeResult = await geocodeAddress(locationString)
        if (geocodeResult) {
          latitude = geocodeResult.latitude
          longitude = geocodeResult.longitude
        }
      }

      // Update horse data
      const { error: updateError } = await supabase
        .from('horses')
        .update({
          name: formData.name,
          breed: formData.breed,
          age: formData.age,
          gender: formData.gender,
          height: formData.height,
          weight: formData.weight || null,
          color: formData.color,
          price: formData.price,
          description: formData.description,
          location: {
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: 'USA'
          },
          latitude,
          longitude,
          metadata: {
            disciplines: formData.disciplines,
            temperament: formData.temperament,
            healthStatus: formData.healthStatus,
            registrations: formData.registrations,
            competitionHistory: formData.competitionHistory,
            negotiable: formData.negotiable
          },
          status: formData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', horse.id)
        .eq('seller_id', user.id)

      if (updateError) throw updateError

      // Track price change if price changed
      if (priceChanged && oldPrice && newPrice) {
        const priceChange = newPrice - oldPrice
        const priceChangePercent = ((priceChange / oldPrice) * 100).toFixed(2)

        const { error: priceHistoryError } = await supabase
          .from('price_history')
          .insert({
            horse_id: horse.id,
            old_price: oldPrice,
            new_price: newPrice,
            price_change: priceChange,
            price_change_percent: parseFloat(priceChangePercent)
          })

        if (priceHistoryError) {
          console.error('Failed to track price change:', priceHistoryError)
          // Don't throw - price history is supplementary
        }

        // If price dropped, notify watchers
        if (priceChange < 0) {
          console.log('💰 Price dropped! Looking for watchers...')

          // Get all watchers for this horse (using favorites table)
          const { data: watchers, error: watchersError } = await supabase
            .from('favorites')
            .select('user_id')
            .eq('horse_id', horse.id)

          console.log('👀 Found watchers:', watchers, 'Error:', watchersError)

          if (watchers && watchers.length > 0) {
            // Create notifications for each watcher
            const notifications = watchers.map(watcher => ({
              user_id: watcher.user_id,
              type: 'price_change',
              title: 'Price Drop Alert!',
              message: `${formData.name} is now $${newPrice.toLocaleString()} (was $${oldPrice.toLocaleString()}) - Save $${Math.abs(priceChange).toLocaleString()}!`,
              horse_id: horse.id,
              action_url: `/horses/${horse.slug}`,
              metadata: {
                old_price: oldPrice,
                new_price: newPrice,
                price_change: priceChange,
                price_change_percent: priceChangePercent,
                horse_name: formData.name,
                horse_slug: horse.slug
              }
            }))

            console.log('📧 Creating notifications:', notifications)

            const { data: notificationData, error: notificationError } = await supabase
              .from('notifications')
              .insert(notifications)
              .select()

            if (notificationError) {
              console.error('❌ Failed to create notifications:', notificationError)
            } else {
              console.log('✅ Notifications created successfully:', notificationData)
            }
          } else {
            console.log('⚠️ No watchers found for this horse')
          }
        }
      }

      toast.success('Listing updated successfully!')
      router.push('/dashboard#my-listings')
    } catch (error: any) {
      console.error('Error updating listing:', error)
      toast.error(error.message || 'Failed to update listing')
    } finally {
      setIsLoading(false)
      setUploadingImages(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-6">Basic Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Horse Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Breed *
            </label>
            <input
              type="text"
              name="breed"
              value={formData.breed}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age (years) *
            </label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleInputChange}
              required
              min="0"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender *
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
            >
              <option value="MARE">Mare</option>
              <option value="GELDING">Gelding</option>
              <option value="STALLION">Stallion</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Height (hands) *
            </label>
            <input
              type="number"
              name="height"
              value={formData.height}
              onChange={handleInputChange}
              required
              min="0"
              step="0.1"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight (lbs)
            </label>
            <input
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleInputChange}
              min="0"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color *
            </label>
            <input
              type="text"
              name="color"
              value={formData.color}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status *
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
            >
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="PAUSED">Paused</option>
            </select>
          </div>
        </div>
      </div>

      {/* Location & Pricing */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-6">Location & Pricing</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City *
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State *
            </label>
            <select
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
            >
              <option value="">Select state</option>
              {US_STATES.map(state => (
                <option key={state.value} value={state.value}>
                  {state.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ZIP Code *
            </label>
            <input
              type="text"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price ($) *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              required
              min="0"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="negotiable"
                checked={formData.negotiable}
                onChange={handleInputChange}
                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">Price is negotiable</span>
            </label>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-6">Details</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={5}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temperament
            </label>
            <input
              type="text"
              name="temperament"
              value={formData.temperament}
              onChange={handleInputChange}
              placeholder="e.g., Calm, friendly, energetic"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Health Status
            </label>
            <input
              type="text"
              name="healthStatus"
              value={formData.healthStatus}
              onChange={handleInputChange}
              placeholder="e.g., Up to date on vaccines, recent vet check"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Registrations
            </label>
            <input
              type="text"
              name="registrations"
              value={formData.registrations}
              onChange={handleInputChange}
              placeholder="e.g., AQHA, APHA"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Competition History
            </label>
            <textarea
              name="competitionHistory"
              value={formData.competitionHistory}
              onChange={handleInputChange}
              placeholder="e.g., Won Reserve Champion at XYZ Show 2024, Placed 3rd in ABC Competition..."
              rows={4}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Disciplines */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-6">Disciplines</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {DISCIPLINES.map(discipline => (
            <label
              key={discipline}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={formData.disciplines.includes(discipline)}
                onChange={() => handleDisciplineToggle(discipline)}
                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">{discipline}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-6">Images</h2>

        {/* Existing Images */}
        {existingImages.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Current Images</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {existingImages.map(image => (
                <div key={image.id} className="relative group">
                  <div className="relative h-32 bg-gray-200 rounded-lg overflow-hidden">
                    <Image
                      src={image.url}
                      alt="Horse image"
                      fill
                      className="object-cover"
                    />
                    {image.is_primary && (
                      <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
                        Primary
                      </div>
                    )}
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!image.is_primary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryImage(image.id)}
                        className="p-1 bg-white rounded shadow-md hover:bg-gray-100"
                        title="Set as primary"
                      >
                        <Star className="h-4 w-4 text-gray-600" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteExistingImage(image.id)}
                      disabled={isDeletingImage === image.id}
                      className="p-1 bg-white rounded shadow-md hover:bg-red-100"
                      title="Delete image"
                    >
                      {isDeletingImage === image.id ? (
                        <Loader2 className="h-4 w-4 text-gray-600 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-600" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Images */}
        {newImagePreviews.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">New Images (will be uploaded on save)</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {newImagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <div className="relative h-32 bg-gray-200 rounded-lg overflow-hidden">
                    <Image
                      src={preview}
                      alt="New image"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveNewImage(index)}
                    className="absolute top-2 right-2 p-1 bg-white rounded shadow-md hover:bg-red-100"
                    title="Remove image"
                  >
                    <X className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload New Images */}
        <div>
          <label className="block">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-green-500 transition-colors">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Click to upload new images</p>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP up to 10MB each</p>
            </div>
          </label>
        </div>
      </div>

      {/* Videos */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Film className="h-5 w-5" />
          Videos
        </h2>

        {existingVideos.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Current Videos</h3>
            <div className="space-y-3">
              {existingVideos.map(video => (
                <div key={video.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{video.title || 'Video'}</p>
                    <p className="text-xs text-gray-500">{(video.file_size ? (video.file_size / 1024 / 1024).toFixed(2) : '?')} MB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteVideo(video.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {newVideoFiles.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">New Videos</h3>
            <div className="space-y-2">
              {newVideoFiles.map((video, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <span className="text-sm">{video.name}</span>
                  <button
                    type="button"
                    onClick={() => setNewVideoFiles(prev => prev.filter((_, idx) => idx !== i))}
                    className="text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block">
            <input
              type="file"
              multiple
              accept="video/*"
              onChange={handleVideoUpload}
              className="hidden"
            />
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-green-500">
              <Film className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Click to upload videos</p>
            </div>
          </label>
        </div>
      </div>

      {/* Documents */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documents
        </h2>

        {existingDocuments.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Current Documents</h3>
            <div className="space-y-3">
              {existingDocuments.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-xs text-gray-500">{(doc.file_size ? (doc.file_size / 1024 / 1024).toFixed(2) : '?')} MB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {newDocumentFiles.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">New Documents</h3>
            <div className="space-y-2">
              {newDocumentFiles.map((doc, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <span className="text-sm">{doc.name}</span>
                  <button
                    type="button"
                    onClick={() => setNewDocumentFiles(prev => prev.filter((_, idx) => idx !== i))}
                    className="text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block">
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,image/*"
              onChange={handleDocumentUpload}
              className="hidden"
            />
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-green-500">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Click to upload documents</p>
              <p className="text-xs text-gray-500 mt-1">Health records, vet reports, registration papers, etc.</p>
            </div>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push('/dashboard#my-listings')}
          className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancel
        </button>

        <button
          type="submit"
          disabled={isLoading || uploadingImages}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isLoading || uploadingImages ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {uploadingImages ? 'Uploading Images...' : 'Saving...'}
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  )
}