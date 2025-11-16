import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMessageTemplates } from '@/lib/actions/message-templates'
import { MessageTemplatesList } from '@/components/messages/message-templates-list'
import Link from 'next/link'
import { ArrowLeft, MessageSquare } from 'lucide-react'

export default async function MessageTemplatesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const result = await getMessageTemplates()

  if ('error' in result) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Error</h1>
          <p className="text-red-600 mt-4">{result.error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare className="h-8 w-8 text-green-600" />
                <h1 className="text-3xl font-bold text-gray-900">Message Templates</h1>
              </div>
              <p className="text-gray-600">
                Create and manage reusable message templates to speed up your responses. Use
                placeholders like [horse name], [price], [day], [time], and [location] to
                personalize your messages.
              </p>
            </div>
          </div>
        </div>

        <MessageTemplatesList templates={result.templates} />
      </div>
    </div>
  )
}
