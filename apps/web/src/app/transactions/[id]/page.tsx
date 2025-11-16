import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TransactionDetail } from '@/components/transactions/transaction-detail'

export default async function TransactionDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/transactions/' + params.id)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <TransactionDetail transactionId={params.id} />
      </div>
    </div>
  )
}
