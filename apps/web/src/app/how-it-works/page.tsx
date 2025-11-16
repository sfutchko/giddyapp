import Link from 'next/link'
import { Search, MessageSquare, FileText, Shield, DollarSign, Truck, CheckCircle, Star, MapPin, Calendar, Bell, Heart } from 'lucide-react'

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">How GiddyApp Works</h1>
          <p className="text-xl text-emerald-50 max-w-3xl">
            The trusted marketplace for buying and selling horses. We make it safe, simple, and secure.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-24">
        {/* For Buyers */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-stone-900 mb-4">For Buyers</h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              Find your perfect horse with confidence and security
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-8 hover:shadow-xl transition-all">
              <div className="inline-flex p-4 bg-emerald-50 rounded-xl mb-6">
                <Search className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-8 h-8 bg-emerald-600 text-white font-bold rounded-full text-sm">1</span>
                <h3 className="text-xl font-bold text-stone-900">Browse & Search</h3>
              </div>
              <p className="text-stone-600 leading-relaxed">
                Browse thousands of horses or use our advanced filters to find exactly what you're looking for by breed, age, location, price, and more.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-8 hover:shadow-xl transition-all">
              <div className="inline-flex p-4 bg-blue-50 rounded-xl mb-6">
                <Heart className="h-8 w-8 text-blue-600" />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-8 h-8 bg-emerald-600 text-white font-bold rounded-full text-sm">2</span>
                <h3 className="text-xl font-bold text-stone-900">Save Favorites</h3>
              </div>
              <p className="text-stone-600 leading-relaxed">
                Add horses to your watchlist to track them. Get notifications when the price changes or when similar horses are listed.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-8 hover:shadow-xl transition-all">
              <div className="inline-flex p-4 bg-purple-50 rounded-xl mb-6">
                <MessageSquare className="h-8 w-8 text-purple-600" />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-8 h-8 bg-emerald-600 text-white font-bold rounded-full text-sm">3</span>
                <h3 className="text-xl font-bold text-stone-900">Contact Seller</h3>
              </div>
              <p className="text-stone-600 leading-relaxed">
                Message the seller directly through our secure messaging system. Ask questions, request additional photos or videos.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-8 hover:shadow-xl transition-all">
              <div className="inline-flex p-4 bg-amber-50 rounded-xl mb-6">
                <Calendar className="h-8 w-8 text-amber-600" />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-8 h-8 bg-emerald-600 text-white font-bold rounded-full text-sm">4</span>
                <h3 className="text-xl font-bold text-stone-900">Schedule Viewing</h3>
              </div>
              <p className="text-stone-600 leading-relaxed">
                Request to view the horse in person. Schedule a convenient time with the seller to meet and evaluate the horse.
              </p>
            </div>

            {/* Step 5 */}
            <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-8 hover:shadow-xl transition-all">
              <div className="inline-flex p-4 bg-green-50 rounded-xl mb-6">
                <FileText className="h-8 w-8 text-green-600" />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-8 h-8 bg-emerald-600 text-white font-bold rounded-full text-sm">5</span>
                <h3 className="text-xl font-bold text-stone-900">Make an Offer</h3>
              </div>
              <p className="text-stone-600 leading-relaxed">
                Submit an offer through our platform. The seller can accept, counter, or decline. Negotiate until you reach an agreement.
              </p>
            </div>

            {/* Step 6 */}
            <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-8 hover:shadow-xl transition-all">
              <div className="inline-flex p-4 bg-emerald-50 rounded-xl mb-6">
                <Shield className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-8 h-8 bg-emerald-600 text-white font-bold rounded-full text-sm">6</span>
                <h3 className="text-xl font-bold text-stone-900">Secure Payment</h3>
              </div>
              <p className="text-stone-600 leading-relaxed">
                Once your offer is accepted, pay securely through our escrow service. Your money is held safely until the horse is delivered and inspected.
              </p>
            </div>
          </div>
        </section>

        {/* For Sellers */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-stone-900 mb-4">For Sellers</h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              List your horse and reach thousands of qualified buyers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-8 hover:shadow-xl transition-all">
              <div className="inline-flex p-4 bg-emerald-50 rounded-xl mb-6">
                <FileText className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-8 h-8 bg-emerald-600 text-white font-bold rounded-full text-sm">1</span>
                <h3 className="text-xl font-bold text-stone-900">Create Listing</h3>
              </div>
              <p className="text-stone-600 leading-relaxed">
                Create a detailed listing with photos, videos, health records, and complete information about your horse. It only takes minutes.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-8 hover:shadow-xl transition-all">
              <div className="inline-flex p-4 bg-blue-50 rounded-xl mb-6">
                <MapPin className="h-8 w-8 text-blue-600" />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-8 h-8 bg-emerald-600 text-white font-bold rounded-full text-sm">2</span>
                <h3 className="text-xl font-bold text-stone-900">Reach Buyers</h3>
              </div>
              <p className="text-stone-600 leading-relaxed">
                Your listing is instantly visible to thousands of buyers. Get notified when buyers save your horse or send inquiries.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-8 hover:shadow-xl transition-all">
              <div className="inline-flex p-4 bg-purple-50 rounded-xl mb-6">
                <MessageSquare className="h-8 w-8 text-purple-600" />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-8 h-8 bg-emerald-600 text-white font-bold rounded-full text-sm">3</span>
                <h3 className="text-xl font-bold text-stone-900">Respond to Inquiries</h3>
              </div>
              <p className="text-stone-600 leading-relaxed">
                Communicate with interested buyers through our secure messaging. Answer questions and share additional information.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-8 hover:shadow-xl transition-all">
              <div className="inline-flex p-4 bg-amber-50 rounded-xl mb-6">
                <Calendar className="h-8 w-8 text-amber-600" />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-8 h-8 bg-emerald-600 text-white font-bold rounded-full text-sm">4</span>
                <h3 className="text-xl font-bold text-stone-900">Manage Viewings</h3>
              </div>
              <p className="text-stone-600 leading-relaxed">
                Approve or schedule viewing requests from serious buyers. Manage all appointments from your dashboard.
              </p>
            </div>

            {/* Step 5 */}
            <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-8 hover:shadow-xl transition-all">
              <div className="inline-flex p-4 bg-green-50 rounded-xl mb-6">
                <FileText className="h-8 w-8 text-green-600" />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-8 h-8 bg-emerald-600 text-white font-bold rounded-full text-sm">5</span>
                <h3 className="text-xl font-bold text-stone-900">Review Offers</h3>
              </div>
              <p className="text-stone-600 leading-relaxed">
                Receive offers from buyers. Accept, counter, or decline. Track all negotiations in one place with offer expiration dates.
              </p>
            </div>

            {/* Step 6 */}
            <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-8 hover:shadow-xl transition-all">
              <div className="inline-flex p-4 bg-emerald-50 rounded-xl mb-6">
                <DollarSign className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-8 h-8 bg-emerald-600 text-white font-bold rounded-full text-sm">6</span>
                <h3 className="text-xl font-bold text-stone-900">Get Paid</h3>
              </div>
              <p className="text-stone-600 leading-relaxed">
                Receive payment through our secure escrow service. Funds are released to you after the buyer confirms delivery and inspection.
              </p>
            </div>
          </div>
        </section>

        {/* Security & Trust */}
        <section className="bg-white rounded-2xl shadow-xl border border-stone-200 p-12">
          <div className="text-center mb-12">
            <div className="inline-flex p-4 bg-emerald-50 rounded-2xl mb-4">
              <Shield className="h-12 w-12 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-bold text-stone-900 mb-4">Safe & Secure Transactions</h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              Your safety and security are our top priorities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Shield className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900 mb-2">Escrow Protection</h3>
                <p className="text-stone-600">
                  Payment is held securely until the buyer confirms the horse has been delivered and meets expectations.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900 mb-2">Verified Listings</h3>
                <p className="text-stone-600">
                  All sellers are verified, and listings are monitored for accuracy and authenticity.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900 mb-2">Secure Messaging</h3>
                <p className="text-stone-600">
                  All communication happens through our platform, protecting your privacy and creating a clear record.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Star className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900 mb-2">Buyer & Seller Reviews</h3>
                <p className="text-stone-600">
                  Build trust through our review system. See ratings and feedback from previous transactions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl shadow-xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-emerald-50 mb-8 max-w-2xl mx-auto">
            Join thousands of buyers and sellers who trust GiddyApp for their horse transactions
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/horses/map"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-emerald-600 font-semibold rounded-xl hover:bg-emerald-50 transition-all shadow-lg hover:shadow-xl"
            >
              <Search className="h-5 w-5" />
              Browse Horses
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-emerald-800 text-white font-semibold rounded-xl hover:bg-emerald-900 transition-all shadow-lg hover:shadow-xl"
            >
              <CheckCircle className="h-5 w-5" />
              Create Account
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
