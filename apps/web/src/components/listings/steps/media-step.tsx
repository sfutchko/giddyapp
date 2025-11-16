'use client'

import { useState, useCallback } from 'react'
import { ListingData } from '../listing-wizard'
import { ChevronRight, ChevronLeft, Upload, X, Image, Film, FileText } from 'lucide-react'

interface MediaStepProps {
  data: Partial<ListingData>
  updateData: (data: Partial<ListingData>) => void
  onNext: () => void
  onBack: () => void
}

export function MediaStep({ data, updateData, onNext, onBack }: MediaStepProps) {
  const [images, setImages] = useState<File[]>(data.images || [])
  const [videos, setVideos] = useState<File[]>(data.videos || [])
  const [documents, setDocuments] = useState<File[]>(data.documents || [])
  const [farmLogo, setFarmLogo] = useState<File | null>(data.farmLogo || null)
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [farmLogoPreview, setFarmLogoPreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ images?: string; videos?: string; documents?: string; farmLogo?: string }>({})

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    // Validate file types and sizes
    const validImages = files.filter(file => {
      const isImage = file.type.startsWith('image/')
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB
      return isImage && isValidSize
    })

    if (validImages.length !== files.length) {
      setErrors({ images: 'Some files were invalid. Only images under 10MB are allowed.' })
    } else {
      setErrors({})
    }

    // Create previews
    validImages.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })

    setImages(prev => [...prev, ...validImages])
  }, [])

  const handleVideoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    // Validate file types and sizes
    const validVideos = files.filter(file => {
      const isVideo = file.type.startsWith('video/')
      const isValidSize = file.size <= 50 * 1024 * 1024 // 50MB
      if (!isValidSize && isVideo) {
        alert(`${file.name} is too large. Videos must be under 50MB (current: ${(file.size / 1024 / 1024).toFixed(1)}MB)`)
      }
      return isVideo && isValidSize
    })

    if (validVideos.length !== files.length) {
      setErrors({ videos: 'Some files were invalid. Only videos under 50MB are allowed.' })
    } else {
      setErrors({})
    }

    setVideos(prev => [...prev, ...validVideos])
  }, [])

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const removeVideo = (index: number) => {
    setVideos(prev => prev.filter((_, i) => i !== index))
  }

  const handleDocumentUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    // Validate file types and sizes
    const validDocs = files.filter(file => {
      const isValidType = file.type === 'application/pdf' ||
                         file.type.startsWith('image/') ||
                         file.type === 'application/msword' ||
                         file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB
      return isValidType && isValidSize
    })

    if (validDocs.length !== files.length) {
      setErrors({ documents: 'Some files were invalid. Only PDF, images, and Word documents under 10MB are allowed.' })
    } else {
      setErrors({})
    }

    setDocuments(prev => [...prev, ...validDocs])
  }, [])

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index))
  }

  const handleFarmLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type and size
    const isImage = file.type.startsWith('image/')
    const isValidSize = file.size <= 5 * 1024 * 1024 // 5MB

    if (!isImage || !isValidSize) {
      setErrors({ farmLogo: 'Please upload an image under 5MB' })
      return
    }

    setErrors({})
    setFarmLogo(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setFarmLogoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  const removeFarmLogo = () => {
    setFarmLogo(null)
    setFarmLogoPreview(null)
  }

  const handleNext = () => {
    if (images.length === 0) {
      setErrors({ images: 'Please upload at least one photo' })
      return
    }

    updateData({ images, videos, documents, farmLogo: farmLogo || undefined })
    onNext()
  }

  return (
    <div className="space-y-6">
      {/* Photos Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Photos *</h3>
        <p className="text-sm text-gray-600 mb-4">
          Upload high-quality photos of your horse. The first photo will be the main listing image.
        </p>

        {/* Upload Area */}
        <label className="block">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors cursor-pointer">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-1">Click to upload photos</p>
            <p className="text-sm text-gray-500">PNG, JPG up to 10MB each</p>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        </label>

        {errors.images && (
          <p className="mt-2 text-sm text-red-600">{errors.images}</p>
        )}

        {/* Image Previews */}
        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                {index === 0 && (
                  <span className="absolute top-2 left-2 px-2 py-1 bg-green-600 text-white text-xs rounded">
                    Main Photo
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Videos Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Videos (Optional)</h3>
        <p className="text-sm text-gray-600 mb-4">
          Upload videos showing your horse in action. Great for demonstrating gaits and behavior.
        </p>

        {/* Upload Area */}
        <label className="block">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors cursor-pointer">
            <Film className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-1">Click to upload videos</p>
            <p className="text-sm text-gray-500">MP4, MOV up to 100MB each</p>
            <input
              type="file"
              multiple
              accept="video/*"
              onChange={handleVideoUpload}
              className="hidden"
            />
          </div>
        </label>

        {errors.videos && (
          <p className="mt-2 text-sm text-red-600">{errors.videos}</p>
        )}

        {/* Video List */}
        {videos.length > 0 && (
          <div className="space-y-2 mt-4">
            {videos.map((video, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Film className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-700">{video.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(video.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeVideo(index)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documents Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Health Records & Documents (Optional)</h3>
        <p className="text-sm text-gray-600 mb-4">
          Upload health records, vaccination history, registration papers, or other relevant documents.
        </p>

        {/* Upload Area */}
        <label className="block">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors cursor-pointer">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-1">Click to upload documents</p>
            <p className="text-sm text-gray-500">PDF, Word, or images up to 10MB each</p>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,image/*"
              onChange={handleDocumentUpload}
              className="hidden"
            />
          </div>
        </label>

        {errors.documents && (
          <p className="mt-2 text-sm text-red-600">{errors.documents}</p>
        )}

        {/* Document List */}
        {documents.length > 0 && (
          <div className="space-y-2 mt-4">
            {documents.map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-700">{doc.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(doc.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeDocument(index)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Farm Logo Section - Optional */}
      {data.farmName && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Farm Logo (Optional)</h3>
          <p className="text-sm text-gray-600 mb-4">
            Upload your farm logo to display with your listing
          </p>

          {!farmLogoPreview ? (
            <label className="block">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors cursor-pointer max-w-xs mx-auto">
                <Image className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-1">Click to upload logo</p>
                <p className="text-sm text-gray-500">PNG, JPG up to 5MB</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFarmLogoUpload}
                  className="hidden"
                />
              </div>
            </label>
          ) : (
            <div className="max-w-xs mx-auto">
              <div className="relative group">
                <img
                  src={farmLogoPreview}
                  alt="Farm Logo Preview"
                  className="w-full h-40 object-contain bg-gray-50 rounded-lg border-2 border-gray-200"
                />
                <button
                  type="button"
                  onClick={removeFarmLogo}
                  className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {errors.farmLogo && (
            <p className="mt-2 text-sm text-red-600 text-center">{errors.farmLogo}</p>
          )}
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Photo Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Include full body shots from both sides</li>
          <li>• Show close-ups of any unique markings</li>
          <li>• Take photos in good lighting</li>
          <li>• Include action shots if possible</li>
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
          type="button"
          onClick={handleNext}
          className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          Next Step
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}