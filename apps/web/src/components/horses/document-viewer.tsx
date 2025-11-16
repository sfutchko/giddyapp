'use client'

import { FileText, Download } from 'lucide-react'

interface Document {
  id: string
  url: string
  name: string
  type: string
  file_size: number | null
}

interface DocumentViewerProps {
  documents: Document[]
}

export function DocumentViewer({ documents }: DocumentViewerProps) {
  if (!documents || documents.length === 0) {
    return null
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(2)} MB`
  }

  const getFileTypeLabel = (type: string) => {
    if (type.includes('pdf')) return 'PDF'
    if (type.includes('word') || type.includes('document')) return 'Word Document'
    if (type.includes('image')) return 'Image'
    return 'Document'
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <FileText className="h-6 w-6 text-green-600" />
        Health Records & Documents
      </h2>
      <div className="space-y-3">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {doc.name}
                </p>
                <p className="text-xs text-gray-500">
                  {getFileTypeLabel(doc.type)} · {formatFileSize(doc.file_size)}
                </p>
              </div>
            </div>
            <a
              href={doc.url}
              download={doc.name}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex-shrink-0"
            >
              <Download className="h-4 w-4" />
              Download
            </a>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-4">
        These documents have been provided by the seller. Please verify authenticity before purchase.
      </p>
    </div>
  )
}
