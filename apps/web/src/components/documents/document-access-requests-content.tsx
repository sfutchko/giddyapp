'use client'

import { useState, useEffect } from 'react'
import {
  getDocumentAccessRequests,
  getMyDocumentAccessRequests,
  respondToAccessRequest,
} from '@/lib/actions/documents'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FileText, Clock, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

export function DocumentAccessRequestsContent() {
  const [received, setReceived] = useState<any[]>([])
  const [sent, setSent] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [showResponseDialog, setShowResponseDialog] = useState(false)
  const [responseMessage, setResponseMessage] = useState('')
  const [accessDays, setAccessDays] = useState('7')
  const [approving, setApproving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    setLoading(true)
    const [receivedResult, sentResult] = await Promise.all([
      getDocumentAccessRequests(),
      getMyDocumentAccessRequests(),
    ])

    if (receivedResult.success && receivedResult.requests) {
      setReceived(receivedResult.requests)
    }
    if (sentResult.success && sentResult.requests) {
      setSent(sentResult.requests)
    }
    setLoading(false)
  }

  const handleApprove = async () => {
    if (!selectedRequest) return

    setResponding(true)
    const days = parseInt(accessDays) || undefined
    const result = await respondToAccessRequest(
      selectedRequest.id,
      true,
      responseMessage || undefined,
      days
    )

    if (result.success) {
      toast({
        title: 'Access Approved',
        description: 'The requester has been granted access to the document',
      })
      setShowResponseDialog(false)
      setSelectedRequest(null)
      setResponseMessage('')
      setAccessDays('7')
      await loadRequests()
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to approve access',
        variant: 'destructive',
      })
    }
    setResponding(false)
  }

  const handleDeny = async () => {
    if (!selectedRequest) return

    setResponding(true)
    const result = await respondToAccessRequest(
      selectedRequest.id,
      false,
      responseMessage || undefined
    )

    if (result.success) {
      toast({
        title: 'Access Denied',
        description: 'The access request has been denied',
      })
      setShowResponseDialog(false)
      setSelectedRequest(null)
      setResponseMessage('')
      await loadRequests()
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to deny access',
        variant: 'destructive',
      })
    }
    setResponding(false)
  }

  const openResponseDialog = (request: any, approve: boolean) => {
    setSelectedRequest(request)
    setApproving(approve)
    setShowResponseDialog(true)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; label: string; icon: any }> = {
      pending: { variant: 'secondary', label: 'Pending', icon: Clock },
      approved: { variant: 'default', label: 'Approved', icon: CheckCircle },
      denied: { variant: 'destructive', label: 'Denied', icon: XCircle },
      expired: { variant: 'secondary', label: 'Expired', icon: AlertCircle },
    }

    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <>
      <Tabs defaultValue="received" className="space-y-6">
        <TabsList>
          <TabsTrigger value="received">
            Received ({received.filter((r) => r.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="sent">Sent ({sent.length})</TabsTrigger>
        </TabsList>

        {/* Received Requests Tab */}
        <TabsContent value="received">
          {received.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-gray-900">No access requests</h3>
                <p className="text-sm text-gray-500 mt-1">
                  You haven't received any document access requests yet
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {received.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-base">
                            {(request.horse_documents as any)?.title || 'Document'}
                          </CardTitle>
                          {getStatusBadge(request.status)}
                        </div>
                        <CardDescription>
                          Request from {(request.requester as any)?.name || 'Unknown'} •{' '}
                          {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {request.message && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Message</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 rounded p-3">
                          {request.message}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="h-4 w-4" />
                      <span>
                        {(request.horse_documents as any)?.category
                          ?.replace(/_/g, ' ')
                          .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </span>
                      <span>•</span>
                      <Link
                        href={`/horses/${(request.horses as any)?.slug}`}
                        className="text-green-600 hover:underline"
                      >
                        {(request.horses as any)?.name}
                      </Link>
                    </div>

                    {request.status === 'pending' && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => openResponseDialog(request, true)}
                          size="sm"
                          className="flex-1"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => openResponseDialog(request, false)}
                          size="sm"
                          variant="outline"
                          className="flex-1"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Deny
                        </Button>
                      </div>
                    )}

                    {request.status !== 'pending' && request.response_message && (
                      <div className="border-t pt-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Your Response</h4>
                        <p className="text-sm text-gray-600">{request.response_message}</p>
                      </div>
                    )}

                    {request.status === 'approved' && request.access_granted_until && (
                      <div className="text-xs text-gray-500">
                        Access expires{' '}
                        {formatDistanceToNow(new Date(request.access_granted_until), {
                          addSuffix: true,
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Sent Requests Tab */}
        <TabsContent value="sent">
          {sent.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-gray-900">No access requests</h3>
                <p className="text-sm text-gray-500 mt-1">
                  You haven't requested access to any documents yet
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sent.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-base">
                            {(request.horse_documents as any)?.title || 'Document'}
                          </CardTitle>
                          {getStatusBadge(request.status)}
                        </div>
                        <CardDescription>
                          Requested{' '}
                          {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {request.message && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Your Message</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 rounded p-3">
                          {request.message}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="h-4 w-4" />
                      <Link
                        href={`/horses/${(request.horses as any)?.slug}`}
                        className="text-green-600 hover:underline"
                      >
                        {(request.horses as any)?.name}
                      </Link>
                    </div>

                    {request.response_message && (
                      <div className="border-t pt-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Seller Response</h4>
                        <p className="text-sm text-gray-600">{request.response_message}</p>
                      </div>
                    )}

                    {request.status === 'approved' && (
                      <div className="bg-green-50 rounded p-3">
                        <div className="flex items-center gap-2 text-sm text-green-800">
                          <CheckCircle className="h-4 w-4" />
                          <span className="font-medium">Access granted</span>
                        </div>
                        {request.access_granted_until && (
                          <p className="text-xs text-green-700 mt-1">
                            Expires{' '}
                            {formatDistanceToNow(new Date(request.access_granted_until), {
                              addSuffix: true,
                            })}
                          </p>
                        )}
                        <Link href={`/horses/${(request.horses as any)?.slug}/documents`}>
                          <Button size="sm" className="mt-2">
                            View Document
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Response Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approving ? 'Approve Access Request' : 'Deny Access Request'}
            </DialogTitle>
            <DialogDescription>
              {approving
                ? 'Grant temporary access to this document'
                : 'Deny access to this document'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {approving && (
              <div>
                <Label htmlFor="accessDays">Access Duration (Days)</Label>
                <Input
                  id="accessDays"
                  type="number"
                  min="1"
                  max="365"
                  value={accessDays}
                  onChange={(e) => setAccessDays(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for permanent access
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="responseMessage">Message (Optional)</Label>
              <Textarea
                id="responseMessage"
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                placeholder={
                  approving
                    ? 'Optional message to the requester...'
                    : 'Optional reason for denial...'
                }
                rows={3}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResponseDialog(false)}
              disabled={responding}
            >
              Cancel
            </Button>
            <Button
              onClick={approving ? handleApprove : handleDeny}
              disabled={responding}
              variant={approving ? 'default' : 'destructive'}
            >
              {responding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {approving ? 'Approving...' : 'Denying...'}
                </>
              ) : approving ? (
                'Approve Access'
              ) : (
                'Deny Access'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
