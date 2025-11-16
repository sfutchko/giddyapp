'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Download,
  Eye,
  Lock,
  Globe,
  Calendar,
  Building2,
  MoreVertical,
  Trash2,
  Edit,
  Share2,
  CheckCircle,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import { deleteDocument, type DocumentCategory } from '@/lib/actions/documents'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  health_certificate: 'Health Certificate',
  vaccination_record: 'Vaccination Record',
  coggins_test: 'Coggins Test',
  registration_papers: 'Registration Papers',
  pedigree: 'Pedigree',
  competition_record: 'Competition Record',
  training_record: 'Training Record',
  ppe_report: 'PPE Report',
  insurance: 'Insurance',
  bill_of_sale: 'Bill of Sale',
  other: 'Other',
}

interface DocumentCardProps {
  document: any
  isOwner?: boolean
  onDelete?: () => void
  onView?: () => void
}

export function DocumentCard({ document, isOwner = false, onDelete, onView }: DocumentCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    setDeleting(true)
    const result = await deleteDocument(document.id)

    if (result.success) {
      toast({
        title: 'Success',
        description: 'Document deleted successfully',
      })
      onDelete?.()
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to delete document',
        variant: 'destructive',
      })
    }

    setDeleting(false)
    setShowDeleteDialog(false)
  }

  const handleDownload = async () => {
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const isExpired =
    document.expiration_date && new Date(document.expiration_date) < new Date()
  const isExpiringSoon =
    document.expiration_date &&
    new Date(document.expiration_date) <
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="rounded-lg bg-green-100 p-2">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-base truncate">{document.title}</CardTitle>
                  {document.is_verified && (
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                </div>
                <CardDescription className="mt-1">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-medium">
                      {CATEGORY_LABELS[document.category as DocumentCategory]}
                    </span>
                    <span>•</span>
                    <span>{formatFileSize(document.file_size)}</span>
                    {document.document_date && (
                      <>
                        <span>•</span>
                        <span>
                          {new Date(document.document_date).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </div>
                </CardDescription>
              </div>
            </div>

            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onView}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {document.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{document.description}</p>
          )}

          {/* Metadata */}
          <div className="space-y-2 text-xs text-gray-500">
            {document.issuing_authority && (
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5" />
                <span>{document.issuing_authority}</span>
              </div>
            )}
            {document.expiration_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  Expires: {new Date(document.expiration_date).toLocaleDateString()}
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
            )}
          </div>

          {/* Privacy and Status Badges */}
          <div className="flex items-center gap-2 flex-wrap pt-2">
            {document.is_public ? (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Globe className="h-3 w-3" />
                Public
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Lock className="h-3 w-3" />
                Private
              </Badge>
            )}

            {!isOwner && (
              <Button size="sm" variant="outline" onClick={onView}>
                <Eye className="mr-2 h-3 w-3" />
                View
              </Button>
            )}

            {isOwner && (
              <Button size="sm" variant="outline" onClick={handleDownload}>
                <Download className="mr-2 h-3 w-3" />
                Download
              </Button>
            )}
          </div>

          {/* Upload info */}
          <div className="text-xs text-gray-400 pt-2 border-t">
            Uploaded {formatDistanceToNow(new Date(document.created_at), { addSuffix: true })}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{document.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
