'use client'

import { useState } from 'react'
import { Share2, X, Check, Facebook, Twitter, Mail, Link as LinkIcon } from 'lucide-react'

interface ShareButtonProps {
  url: string
  title: string
  description?: string
  className?: string
}

export function ShareButton({ url, title, description, className = '' }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${url}` : url

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const shareViaFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
      '_blank',
      'width=600,height=400'
    )
  }

  const shareViaTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(title)}`,
      '_blank',
      'width=600,height=400'
    )
  }

  const shareViaEmail = () => {
    const subject = encodeURIComponent(title)
    const body = encodeURIComponent(`Check out this horse listing: ${fullUrl}${description ? `\n\n${description}` : ''}`)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors ${className}`}
        aria-label="Share listing"
      >
        <Share2 className="h-5 w-5 text-gray-600" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Share this listing</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-2">
                <button
                  onClick={copyToClipboard}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-green-600 font-medium">Link copied!</span>
                    </>
                  ) : (
                    <>
                      <LinkIcon className="h-5 w-5 text-gray-600" />
                      <span className="text-sm text-gray-700">Copy link</span>
                    </>
                  )}
                </button>

                <button
                  onClick={shareViaFacebook}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Facebook className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-gray-700">Share on Facebook</span>
                </button>

                <button
                  onClick={shareViaTwitter}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Twitter className="h-5 w-5 text-sky-500" />
                  <span className="text-sm text-gray-700">Share on Twitter</span>
                </button>

                <button
                  onClick={shareViaEmail}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Mail className="h-5 w-5 text-gray-600" />
                  <span className="text-sm text-gray-700">Share via email</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
