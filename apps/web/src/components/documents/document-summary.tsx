'use client'

import { useState, useEffect } from 'react'
import { getHorseDocuments } from '@/lib/actions/documents'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, ChevronRight, Lock, Globe, CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface DocumentSummaryProps {
  horseId: string
  horseSlug: string
  isOwner?: boolean
}

export function DocumentSummary({ horseId, horseSlug, isOwner = false }: DocumentSummaryProps) {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDocuments()
  }, [horseId])

  const loadDocuments = async () => {
    setLoading(true)
    const result = await getHorseDocuments(horseId)
    if (result.success && result.documents) {
      setDocuments(result.documents)
    }
    setLoading(false)
  }

  const publicDocuments = documents.filter((d) => d.is_public)
  const verifiedDocuments = documents.filter((d) => d.is_verified)

  // Group documents by category for display
  const categoryCounts = documents.reduce((acc, doc) => {
    const category = doc.category
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const categoryLabels: Record<string, string> = {
    health_certificate: 'Health Certificates',
    vaccination_record: 'Vaccination Records',
    coggins_test: 'Coggins Tests',
    registration_papers: 'Registration',
    pedigree: 'Pedigree',
    competition_record: 'Competition Records',
    training_record: 'Training Records',
    ppe_report: 'PPE Reports',
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents & Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (documents.length === 0 && !isOwner) {
    return null // Don't show section if no documents and not owner
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents & Records
              {verifiedDocuments.length > 0 && (
                <Badge variant="secondary" className="gap-1 ml-2">
                  <CheckCircle className="h-3 w-3" />
                  {verifiedDocuments.length} Verified
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              {documents.length} {documents.length === 1 ? 'document' : 'documents'} available
              {publicDocuments.length > 0 &&
                ` • ${publicDocuments.length} public`}
            </CardDescription>
          </div>
          <Link href={`/horses/${horseSlug}/documents`}>
            <Button variant="outline" size="sm" className="gap-2">
              View All
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-6">
            <FileText className="h-10 w-10 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              {isOwner
                ? 'No documents uploaded yet. Add health certificates, registration papers, and more.'
                : 'No documents available yet.'}
            </p>
            {isOwner && (
              <Link href={`/horses/${horseSlug}/documents`}>
                <Button className="mt-4" size="sm">
                  Upload Documents
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="rounded-lg bg-green-100 p-2">
                  <Globe className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{publicDocuments.length}</div>
                  <div className="text-gray-500">Public</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="rounded-lg bg-blue-100 p-2">
                  <Lock className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {documents.length - publicDocuments.length}
                  </div>
                  <div className="text-gray-500">Private</div>
                </div>
              </div>
            </div>

            {/* Document Categories */}
            {Object.keys(categoryCounts).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Available Documents</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(categoryCounts)
                    .filter(([category]) => categoryLabels[category])
                    .slice(0, 4) // Show max 4 categories
                    .map(([category, count]) => (
                      <div
                        key={category}
                        className="flex items-center justify-between text-sm p-2 rounded-lg bg-gray-50"
                      >
                        <span className="text-gray-700">{categoryLabels[category]}</span>
                        <Badge variant="secondary" className="text-xs">
                          {count}
                        </Badge>
                      </div>
                    ))}
                </div>
                {Object.keys(categoryCounts).length > 4 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{Object.keys(categoryCounts).length - 4} more categories
                  </p>
                )}
              </div>
            )}

            {/* CTA */}
            <Link href={`/horses/${horseSlug}/documents`}>
              <Button variant="outline" className="w-full gap-2">
                <FileText className="h-4 w-4" />
                View All Documents
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>

            {/* Trust Badge */}
            {verifiedDocuments.length > 0 && (
              <div className="border-t pt-3 mt-2">
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-3">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">
                    {verifiedDocuments.length} document
                    {verifiedDocuments.length !== 1 ? 's' : ''} verified by GiddyApp
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
