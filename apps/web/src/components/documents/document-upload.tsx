'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createDocument, type DocumentCategory } from '@/lib/actions/documents'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Upload, FileText, X, Loader2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'

const DOCUMENT_CATEGORIES: { value: DocumentCategory; label: string }[] = [
  { value: 'health_certificate', label: 'Health Certificate' },
  { value: 'vaccination_record', label: 'Vaccination Record' },
  { value: 'coggins_test', label: 'Coggins Test' },
  { value: 'registration_papers', label: 'Registration Papers' },
  { value: 'pedigree', label: 'Pedigree' },
  { value: 'competition_record', label: 'Competition Record' },
  { value: 'training_record', label: 'Training Record' },
  { value: 'ppe_report', label: 'PPE Report' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'bill_of_sale', label: 'Bill of Sale' },
  { value: 'other', label: 'Other' },
]

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

interface DocumentUploadProps {
  horseId: string
  onUploadComplete?: () => void
}

export function DocumentUpload({ horseId, onUploadComplete }: DocumentUploadProps) {
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const { toast } = useToast()

  // Form fields
  const [category, setCategory] = useState<DocumentCategory>('health_certificate')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [documentDate, setDocumentDate] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  const [issuingAuthority, setIssuingAuthority] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [isSharedWithBuyers, setIsSharedWithBuyers] = useState(false)
  const [requiresApproval, setRequiresApproval] = useState(true)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (file: File) => {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'Error',
        description: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        variant: 'destructive',
      })
      return
    }

    // Validate file type (allow PDFs, images, and common document formats)
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Error',
        description: 'Please upload a PDF, image, or Word document',
        variant: 'destructive',
      })
      return
    }

    setSelectedFile(file)

    // Auto-fill title from filename if empty
    if (!title) {
      const fileName = file.name.replace(/\.[^/.]+$/, '') // Remove extension
      setTitle(fileName)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const uploadFile = async (file: File): Promise<string> => {
    const supabase = createClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `${horseId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    const { data, error } = await supabase.storage
      .from('horse-documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('horse-documents')
      .getPublicUrl(data.path)

    return publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFile) {
      toast({
        title: 'Error',
        description: 'Please select a file to upload',
        variant: 'destructive',
      })
      return
    }

    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a title',
        variant: 'destructive',
      })
      return
    }

    setUploading(true)

    try {
      // Upload file to Supabase storage
      const fileUrl = await uploadFile(selectedFile)

      // Create document record
      const result = await createDocument({
        horseId,
        category,
        title: title.trim(),
        description: description.trim() || undefined,
        fileUrl,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        documentDate: documentDate || undefined,
        expirationDate: expirationDate || undefined,
        issuingAuthority: issuingAuthority.trim() || undefined,
        isPublic,
        isSharedWithBuyers,
        requiresApproval,
      })

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Document uploaded successfully',
        })
        resetForm()
        setOpen(false)
        onUploadComplete?.()
      } else {
        throw new Error(result.error || 'Failed to create document record')
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload document',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const resetForm = () => {
    setSelectedFile(null)
    setTitle('')
    setDescription('')
    setDocumentDate('')
    setExpirationDate('')
    setIssuingAuthority('')
    setIsPublic(false)
    setIsSharedWithBuyers(false)
    setRequiresApproval(true)
    setCategory('health_certificate')
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Horse Document</DialogTitle>
          <DialogDescription>
            Upload health certificates, registration papers, and other important documents
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Area */}
          <div>
            <Label>Document File</Label>
            <div
              className={`mt-2 flex justify-center rounded-lg border border-dashed px-6 py-10 ${
                dragActive ? 'border-green-600 bg-green-50' : 'border-gray-300'
              } ${selectedFile ? 'bg-gray-50' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {!selectedFile ? (
                <div className="text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4 flex text-sm leading-6 text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md bg-white font-semibold text-green-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-green-600 focus-within:ring-offset-2 hover:text-green-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        onChange={handleFileInputChange}
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs leading-5 text-gray-600">
                    PDF, JPG, PNG, or DOC up to 50MB
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <FileText className="h-10 w-10 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="rounded-full p-1 hover:bg-gray-200"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Document Category */}
          <div>
            <Label htmlFor="category">Document Category *</Label>
            <Select value={category} onValueChange={(value: DocumentCategory) => setCategory(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., 2025 Health Certificate"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description or notes about this document"
              rows={3}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="documentDate">Document Date</Label>
              <Input
                id="documentDate"
                type="date"
                value={documentDate}
                onChange={(e) => setDocumentDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="expirationDate">Expiration Date</Label>
              <Input
                id="expirationDate"
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
              />
            </div>
          </div>

          {/* Issuing Authority */}
          <div>
            <Label htmlFor="issuingAuthority">Issuing Authority</Label>
            <Input
              id="issuingAuthority"
              value={issuingAuthority}
              onChange={(e) => setIssuingAuthority(e.target.value)}
              placeholder="e.g., Dr. Smith, ABC Veterinary Clinic"
            />
          </div>

          {/* Privacy Settings */}
          <div className="space-y-4 rounded-lg border p-4">
            <h4 className="font-medium">Privacy Settings</h4>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Public Document</Label>
                <p className="text-sm text-gray-500">Visible to all users viewing this horse</p>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>

            {!isPublic && (
              <>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Share with Buyers</Label>
                    <p className="text-sm text-gray-500">
                      Allow serious buyers to request access
                    </p>
                  </div>
                  <Switch
                    checked={isSharedWithBuyers}
                    onCheckedChange={setIsSharedWithBuyers}
                  />
                </div>

                {isSharedWithBuyers && (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Approval</Label>
                      <p className="text-sm text-gray-500">
                        Manually approve each access request
                      </p>
                    </div>
                    <Switch
                      checked={requiresApproval}
                      onCheckedChange={setRequiresApproval}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={uploading || !selectedFile}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Document'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
