import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'

export function CTASection() {
  return (
    <section className="py-24 px-4 bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzMuMzEzIDAgNiAyLjY4NyA2IDZzLTIuNjg3IDYtNiA2LTYtMi42ODctNi02IDIuNjg3LTYgNi02ek0zNiA0NGMzLjMxMyAwIDYgMi42ODcgNiA2cy0yLjY4NyA2LTYgNi02LTIuNjg3LTYtNiAyLjY4Ny02IDYtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
            <Sparkles className="h-4 w-4 text-yellow-300" />
            <span className="text-sm font-medium text-white">Join thousands of happy buyers & sellers</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Find Your Perfect Horse?
          </h2>

          <p className="text-xl text-green-50 mb-10 max-w-2xl mx-auto">
            Start browsing quality horses from verified sellers, or list your horse and reach thousands of qualified buyers.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/horses/map"
              className="group px-8 py-4 bg-white hover:bg-gray-50 text-green-700 font-bold rounded-lg shadow-xl transition-all hover:shadow-2xl hover:scale-105 flex items-center gap-2"
            >
              Browse Horses
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/register"
              className="px-8 py-4 bg-green-800/50 hover:bg-green-800/70 backdrop-blur-sm border-2 border-white/30 hover:border-white/50 text-white font-bold rounded-lg transition-all hover:shadow-lg"
            >
              List Your Horse
            </Link>
          </div>

          <p className="text-green-100 text-sm mt-8">
            No credit card required to browse • Verified sellers only • Secure escrow protection
          </p>
        </div>
      </div>
    </section>
  )
}
