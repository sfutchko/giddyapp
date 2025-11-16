'use client'

import { useState } from 'react'
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  Check,
  X,
  MessageSquare,
  TrendingUp
} from 'lucide-react'
import {
  createMessageTemplate,
  updateMessageTemplate,
  deleteMessageTemplate,
  type MessageTemplate,
  type TemplateCategory
} from '@/lib/actions/message-templates'
import { TEMPLATE_CATEGORIES } from '@/lib/constants/templates'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface MessageTemplatesListProps {
  templates: MessageTemplate[]
}

export function MessageTemplatesList({ templates: initialTemplates }: MessageTemplatesListProps) {
  const [templates, setTemplates] = useState(initialTemplates)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'other' as TemplateCategory
  })

  const router = useRouter()

  const resetForm = () => {
    setFormData({ title: '', content: '', category: 'other' })
    setIsCreating(false)
    setEditingId(null)
  }

  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required')
      return
    }

    const result = await createMessageTemplate(
      formData.title,
      formData.content,
      formData.category
    )

    if ('error' in result) {
      toast.error(result.error)
    } else {
      setTemplates([result.template!, ...templates])
      toast.success('Template created successfully')
      resetForm()
      router.refresh()
    }
  }

  const handleUpdate = async (id: string) => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required')
      return
    }

    const result = await updateMessageTemplate(
      id,
      formData.title,
      formData.content,
      formData.category
    )

    if ('error' in result) {
      toast.error(result.error)
    } else {
      setTemplates(templates.map(t => (t.id === id ? result.template! : t)))
      toast.success('Template updated successfully')
      resetForm()
      router.refresh()
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)

    const result = await deleteMessageTemplate(id)

    if ('error' in result) {
      toast.error(result.error)
    } else {
      setTemplates(templates.filter(t => t.id !== id))
      toast.success('Template deleted successfully')
      router.refresh()
    }

    setDeletingId(null)
  }

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    toast.success('Template copied to clipboard')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const startEdit = (template: MessageTemplate) => {
    setEditingId(template.id)
    setFormData({
      title: template.title,
      content: template.content,
      category: (template.category as TemplateCategory) || 'other'
    })
    setIsCreating(false)
  }

  const getCategoryIcon = (category?: TemplateCategory | null) => {
    const cat = TEMPLATE_CATEGORIES.find(c => c.value === category)
    return cat?.icon || '📝'
  }

  const groupedTemplates = templates.reduce((acc, template) => {
    const category = template.category || 'other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(template)
    return acc
  }, {} as Record<string, MessageTemplate[]>)

  return (
    <div className="space-y-6">
      {/* Create Button */}
      <div className="bg-white rounded-lg shadow-md p-4">
        {!isCreating && !editingId ? (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
          >
            <Plus className="h-5 w-5" />
            Create New Template
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Edit Template' : 'New Template'}
              </h3>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Greeting - First Contact"
                  maxLength={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">{formData.title.length}/100</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as TemplateCategory })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {TEMPLATE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Use placeholders like [horse name], [price], [day], [time], [location]"
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tip: Use [horse name], [price], [day], [time], [location] as placeholders
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => (editingId ? handleUpdate(editingId) : handleCreate())}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                >
                  {editingId ? 'Update' : 'Create'} Template
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Templates List */}
      {Object.keys(groupedTemplates).length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Templates Yet</h2>
          <p className="text-gray-600">
            Create your first message template to speed up your responses.
          </p>
        </div>
      ) : (
        Object.entries(groupedTemplates).map(([category, categoryTemplates]) => {
          const categoryInfo = TEMPLATE_CATEGORIES.find(c => c.value === category)

          return (
            <div key={category} className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">{getCategoryIcon(category as TemplateCategory)}</span>
                {categoryInfo?.label || 'Other'}
                <span className="text-sm font-normal text-gray-500">
                  ({categoryTemplates.length})
                </span>
              </h2>

              <div className="grid gap-4 md:grid-cols-2">
                {categoryTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{template.title}</h3>
                        {template.usage_count > 0 && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <TrendingUp className="h-3 w-3" />
                            Used {template.usage_count} times
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopy(template.content, template.id)}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          title="Copy to clipboard"
                        >
                          {copiedId === template.id ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4 text-gray-600" />
                          )}
                        </button>
                        <button
                          onClick={() => startEdit(template)}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          title="Edit template"
                        >
                          <Edit className="h-4 w-4 text-gray-600" />
                        </button>
                        {!template.is_default && (
                          <button
                            onClick={() => handleDelete(template.id)}
                            disabled={deletingId === template.id}
                            className="p-1.5 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                            title="Delete template"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">
                      {template.content}
                    </p>

                    {template.is_default && (
                      <div className="mt-3">
                        <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          Default Template
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
