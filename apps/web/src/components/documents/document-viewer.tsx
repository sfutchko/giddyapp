'use client'

import { useState, useEffect } from 'react'
import { getDocument, logDocumentView, requestDocumentAccess } from '@/lib/actions/documents'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  FileText,
  Download,
  Lock,
  Calendar,
  Building2,
  Loader2,
  CheckCircle,
  Globe,
  AlertCircle,
} from 'lucide-react'

interface DocumentViewerProps {
  documentId: string | null
  open: boolean
  onClose: () => void
}

export function DocumentViewer({ documentId, open, onClose }: DocumentViewerProps) {
  const [document, setDocument] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [requestMessage, setRequestMessage] = useState('')
  const [showRequestForm, setShowRequestForm] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (documentId && open) {
      loadDocument()
    }
  }, [documentId, open])

  const loadDocument = async () => {
    if (!documentId) return

    setLoading(true)
    const result = await getDocument(documentId)

    if (result.success && result.document) {
      setDocument(result.document)
      // Log the view
      await logDocumentView(documentId)
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to load document',
        variant: 'destructive',
      })
      onClose()
    }

    setLoading(false)
  }

  const handleDownload = async () => {
    if (!document) return

    try {
      const response = await fetch(document.file_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = window.document.createElement('a')
      a.href = url
      a.download = document.file_name
      window.document.body.appendChild(a)
      a.click()
      window.document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download document',
        variant: 'destructive',
      })
    }
  }

  const handleRequestAccess = async () => {
    if (!documentId) return

    setRequesting(true)
    const result = await requestDocumentAccess(documentId, requestMessage)

    if (result.success) {
      toast({
        title: 'Request Sent',
        description: 'Your access request has been sent to the seller',
      })
      setShowRequestForm(false)
      setRequestMessage('')
      onClose()
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to send access request',
        variant: 'destructive',
      })
    }

    setRequesting(false)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const isExpired =
    document?.expiration_date && new Date(document.expiration_date) < new Date()
  const isExpiringSoon =
    document?.expiration_date &&
    new Date(document.expiration_date) <
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!document) return null

  // Check if user can view the document
  const canView = document.is_public || document.horses?.seller_id === document.uploaded_by

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-green-100 p-3">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl">{document.title}</DialogTitle>
              <DialogDescription className="mt-1">
                {document.category.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                {' • '}
                {formatFileSize(document.file_size)}
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              {document.is_verified && (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Verified
                </Badge>
              )}
              {document.is_public ? (
                <Badge variant="secondary" className="gap-1">
                  <Globe className="h-3 w-3" />
                  Public
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <Lock className="h-3 w-3" />
                  Private
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Description */}
          {document.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
              <p className="text-sm text-gray-600">{document.description}</p>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4">
            {document.document_date && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Document Date</h4>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  {new Date(document.document_date).toLocaleDateString()}
                </div>
              </div>
            )}

            {document.expiration_date && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Expiration Date</h4>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span className={isExpired ? 'text-red-600' : 'text-gray-600'}>
                    {new Date(document.expiration_date).toLocaleDateString()}
                  </span>
                  {isExpired && (
                    <Badge variant="destructive" className="text-xs">
                      Expired
                    </Badge>
                  )}
                  {!isExpired && isExpiringSoon && (
                    <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
                      Expiring Soon
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {document.issuing_authority && (
              <div className="col-span-2">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Issuing Authority</h4>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building2 className="h-4 w-4" />
                  {document.issuing_authority}
                </div>
              </div>
            )}
          </div>

          {/* Document Preview/Access */}
          {canView ? (
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-700">Document File</h4>
                <Button onClick={handleDownload} size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>

              {/* Preview based on file type */}
              {document.file_type === 'application/pdf' ? (
                <div className="bg-white rounded border h-[500px]">
                  <iframe
                    src={document.file_url}
                    className="w-full h-full rounded"
                    title={document.title}
                  />
                </div>
              ) : document.file_type.startsWith('image/') ? (
                <div className="bg-white rounded border p-4">
                  <img
                    src={document.file_url}
                    alt={document.title}
                    className="max-w-full mx-auto rounded"
                  />
                </div>
              ) : (
                <div className="bg-white rounded border p-6 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Preview not available for this file type
                  </p>
                  <Button onClick={handleDownload} className="mt-4 gap-2">
                    <Download className="h-4 w-4" />
                    Download to View
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="border rounded-lg p-6 bg-gray-50">
              <div className="text-center">
                <Lock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Private Document</h4>
                <p className="text-sm text-gray-600 mb-4">
                  This document is private. Request access from the seller to view it.
                </p>

                {showRequestForm ? (
                  <div className="max-w-md mx-auto space-y-4">
                    <div>
                      <Label htmlFor="message">Message to Seller (Optional)</Label>
                      <Textarea
                        id="message"
                        value={requestMessage}
                        onChange={(e) => setRequestMessage(e.target.value)}
                        placeholder="Let the seller know why you'd like to view this document..."
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleRequestAccess}
                        disabled={requesting}
                        className="flex-1"
                      >
                        {requesting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          'Send Request'
                        )}
                      </Button>
                      <Button
                        onClick={() => setShowRequestForm(false)}
                        variant="outline"
                        disabled={requesting}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button onClick={() => setShowRequestForm(true)} className="gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Request Access
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Verification Info */}
          {document.is_verified && document.verification_notes && (
            <div className="border-l-4 border-green-500 bg-green-50 p-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-green-900">Verified Document</h4>
                  <p className="text-sm text-green-800 mt-1">{document.verification_notes}</p>
                  {document.verified_at && (
                    <p className="text-xs text-green-700 mt-1">
                      Verified {new Date(document.verified_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
