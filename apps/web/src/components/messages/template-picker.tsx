'use client'

import { useState, useEffect } from 'react'
import { FileText, X, Search } from 'lucide-react'
import { getMessageTemplates, incrementTemplateUsage, type MessageTemplate } from '@/lib/actions/message-templates'

interface TemplatePickerProps {
  onSelectTemplate: (content: string) => void
  className?: string
}

export function TemplatePicker({ onSelectTemplate, className = '' }: TemplatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (isOpen && templates.length === 0) {
      loadTemplates()
    }
  }, [isOpen])

  const loadTemplates = async () => {
    setLoading(true)
    const result = await getMessageTemplates()
    if ('error' in result) {
      console.error('Failed to load templates:', result.error)
    } else {
      setTemplates(result.templates)
    }
    setLoading(false)
  }

  const handleSelectTemplate = async (template: MessageTemplate) => {
    onSelectTemplate(template.content)
    setIsOpen(false)
    setSearchQuery('')

    // Increment usage count
    await incrementTemplateUsage(template.id)

    // Update local state to reflect new usage count
    setTemplates(templates.map(t =>
      t.id === template.id ? { ...t, usage_count: t.usage_count + 1 } : t
    ))
  }

  const filteredTemplates = templates.filter(template =>
    template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.category?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        title="Insert template"
        type="button"
      >
        <FileText className="h-5 w-5 text-gray-600" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 w-80 max-h-96 overflow-hidden z-20">
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">Message Templates</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="overflow-y-auto max-h-72">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="animate-spin h-6 w-6 border-2 border-green-600 border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-2 text-sm">Loading templates...</p>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm">
                    {searchQuery ? 'No templates found' : 'No templates yet'}
                  </p>
                  <a
                    href="/settings/message-templates"
                    className="text-sm text-green-600 hover:text-green-700 font-medium mt-2 inline-block"
                  >
                    Create your first template
                  </a>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      className="w-full p-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-medium text-gray-900 text-sm">{template.title}</h4>
                        {template.usage_count > 0 && (
                          <span className="text-xs text-gray-500 ml-2">
                            {template.usage_count}x
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {template.content}
                      </p>
                      {template.category && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                          {template.category}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-2 border-t border-gray-200 bg-gray-50">
              <a
                href="/settings/message-templates"
                className="block text-center text-sm text-green-600 hover:text-green-700 font-medium"
              >
                Manage Templates
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
