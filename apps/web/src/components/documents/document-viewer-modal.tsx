'use client'

import { X, Download, FileText } from 'lucide-react'
import { useState } from 'react'

interface DocumentViewerModalProps {
  isOpen: boolean
  onClose: () => void
  document: {
    id: string
    url: string
    name: string
    type: string
    file_size?: number
  }
}

export function DocumentViewerModal({ isOpen, onClose, document }: DocumentViewerModalProps) {
  if (!isOpen) return null

  const isPdf = document.type === 'application/pdf' || document.name.toLowerCase().endsWith('.pdf')
  const isImage = document.type?.startsWith('image/') ||
    /\.(jpg|jpeg|png|gif|webp)$/i.test(document.name)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[80] animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[90] pointer-events-none flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] pointer-events-auto animate-scale-in overflow-hidden flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-stone-200 bg-stone-50">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <FileText className="h-5 w-5 text-emerald-700" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-stone-900 truncate">{document.name}</h2>
                {document.file_size && (
                  <p className="text-sm text-stone-500">
                    {(document.file_size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={document.url}
                download={document.name}
                className="p-2 hover:bg-stone-200 rounded-lg transition-colors"
                title="Download"
              >
                <Download className="h-5 w-5 text-stone-700" />
              </a>
              <button
                onClick={onClose}
                className="p-2 hover:bg-stone-200 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-stone-700" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto bg-stone-100">
            {isPdf ? (
              <iframe
                src={document.url}
                className="w-full h-full min-h-[600px]"
                title={document.name}
              />
            ) : isImage ? (
              <div className="flex items-center justify-center p-8 min-h-[600px]">
                <img
                  src={document.url}
                  alt={document.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 min-h-[600px] text-center">
                <FileText className="h-16 w-16 text-stone-400 mb-4" />
                <p className="text-stone-600 mb-4">
                  Preview not available for this file type
                </p>
                <a
                  href={document.url}
                  download={document.name}
                  className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors inline-flex items-center gap-2"
                >
                  <Download className="h-5 w-5" />
                  Download File
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </>
  )
}
