import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getReviewableOffers } from '@/lib/actions/reviews'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Image from 'next/image'

export default async function WriteReviewPage({
  searchParams
}: {
  searchParams: { offer?: string }
}) {
  const supabase = await createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const result = await getReviewableOffers()

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

  const offers = result.offers || []

  if (offers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Dashboard
          </Link>

          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">No Reviews to Write</h1>
            <p className="text-gray-600">
              You don't have any completed transactions to review at this time.
            </p>
            <p className="text-gray-600 mt-2">
              Complete a purchase or sale to leave a review.
            </p>
            <Link
              href="/horses/map"
              className="inline-block mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Browse Horses
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // If offer ID is specified, show that offer's review form
  const selectedOffer = searchParams.offer
    ? offers.find((o) => o.id === searchParams.offer)
    : null

  if (selectedOffer) {
    // Import and use ReviewForm component (we'll create a separate client component wrapper)
    return redirect(`/reviews/write/${selectedOffer.id}`)
  }

  // Show list of offers to review
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Write a Review</h1>
        <p className="text-gray-600 mb-8">
          Select a transaction to review from your completed purchases and sales.
        </p>

        <div className="space-y-4">
          {offers.map((offer) => {
            const isBuyer = offer.buyer_id === user.id
            const otherParty = isBuyer ? offer.seller : offer.buyer
            const otherPartyName = otherParty?.full_name || otherParty?.name || 'Unknown'
            const horse = offer.horse
            const horseImage = horse?.horse_images?.find((img) => img.is_primary)?.url || horse?.horse_images?.[0]?.url

            return (
              <Link
                key={offer.id}
                href={`/reviews/write/${offer.id}`}
                className="block bg-white rounded-lg border border-gray-200 p-6 hover:border-green-500 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  {horseImage && (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                      <Image src={horseImage} alt={horse?.name || 'Horse'} fill className="object-cover" />
                    </div>
                  )}

                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg">{horse?.name}</h3>
                    <p className="text-gray-600 mt-1">
                      {isBuyer ? 'Purchased from' : 'Sold to'} {otherPartyName}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      ${offer.amount.toLocaleString()} • {new Date(offer.updated_at).toLocaleDateString()}
                    </p>
                    <div className="mt-3">
                      <span className="text-green-600 font-medium hover:underline">
                        Write Review →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
