import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TransactionsContent } from '@/components/transactions/transactions-content'

export default async function TransactionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/transactions')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <TransactionsContent />
      </div>
    </div>
  )
}
