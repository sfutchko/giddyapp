'use client'

import { useState, useEffect } from 'react'
import { getHorseDocuments } from '@/lib/actions/documents'
import { DocumentCard } from './document-card'
import { DocumentUpload } from './document-upload'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Loader2 } from 'lucide-react'

interface DocumentListProps {
  horseId: string
  isOwner?: boolean
}

export function DocumentList({ horseId, isOwner = false }: DocumentListProps) {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'health' | 'registration' | 'competition'>('all')

  const loadDocuments = async () => {
    setLoading(true)
    const result = await getHorseDocuments(horseId)
    if (result.success && result.documents) {
      setDocuments(result.documents)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadDocuments()
  }, [horseId])

  const filterDocuments = (docs: any[]) => {
    if (filter === 'all') return docs

    const categoryMap: Record<string, string[]> = {
      health: ['health_certificate', 'vaccination_record', 'coggins_test', 'ppe_report'],
      registration: ['registration_papers', 'pedigree'],
      competition: ['competition_record', 'training_record'],
    }

    const categories = categoryMap[filter] || []
    return docs.filter((doc) => categories.includes(doc.category))
  }

  const filteredDocuments = filterDocuments(documents)

  // Group documents by category
  const documentsByCategory = filteredDocuments.reduce((acc, doc) => {
    const category = doc.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(doc)
    return acc
  }, {} as Record<string, any[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Documents & Records</h2>
          <p className="text-gray-600 mt-1">
            {documents.length} {documents.length === 1 ? 'document' : 'documents'}
          </p>
        </div>
        {isOwner && <DocumentUpload horseId={horseId} onUploadComplete={loadDocuments} />}
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={(value: any) => setFilter(value)}>
        <TabsList>
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="registration">Registration</TabsTrigger>
          <TabsTrigger value="competition">Competition</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No documents</h3>
              <p className="mt-1 text-sm text-gray-500">
                {isOwner
                  ? 'Get started by uploading a document.'
                  : 'No documents have been shared yet.'}
              </p>
              {isOwner && (
                <div className="mt-6">
                  <DocumentUpload horseId={horseId} onUploadComplete={loadDocuments} />
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredDocuments.map((document) => (
                <DocumentCard
                  key={document.id}
                  document={document}
                  isOwner={isOwner}
                  onDelete={loadDocuments}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
