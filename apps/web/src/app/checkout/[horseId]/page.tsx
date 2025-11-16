import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CheckoutForm } from '@/components/checkout/checkout-form'

interface CheckoutPageProps {
  params: {
    horseId: string
  }
  searchParams: {
    offerId?: string
  }
}

export default async function CheckoutPage({ params, searchParams }: CheckoutPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirect=/checkout/${params.horseId}${searchParams.offerId ? `?offerId=${searchParams.offerId}` : ''}`)
  }

  // Get horse details
  const { data: horse, error: horseError } = await supabase
    .from('horses')
    .select(`
      id,
      name,
      slug,
      price,
      breed,
      age,
      seller_id,
      status,
      horse_images (url, is_primary)
    `)
    .eq('id', params.horseId)
    .single()

  if (horseError || !horse) {
    redirect('/browse')
  }

  // Prevent seller from buying their own horse
  if (horse.seller_id === user.id) {
    redirect(`/horses/${horse.slug}`)
  }

  // Get offer details if offerId provided
  let offer = null
  if (searchParams.offerId) {
    const { data: offerData } = await supabase
      .from('offers')
      .select('*')
      .eq('id', searchParams.offerId)
      .eq('status', 'accepted')
      .single()

    if (!offerData || offerData.buyer_id !== user.id) {
      redirect(`/horses/${horse.slug}`)
    }

    offer = offerData
  }

  const primaryImage = horse.horse_images?.find((img: any) => img.is_primary)?.url || horse.horse_images?.[0]?.url

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Secure Checkout</h1>
          <p className="text-gray-600 mt-1">Complete your purchase with escrow protection</p>
        </div>

        <CheckoutForm
          horse={horse}
          user={user}
          offerId={searchParams.offerId}
          offerAmount={offer?.offer_amount}
          primaryImage={primaryImage}
        />
      </div>
    </div>
  )
}
