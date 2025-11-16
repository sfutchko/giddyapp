import { SearchBar } from '@/components/search/search-bar'
import { Shield, Lock, TrendingUp } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export function HeroSection() {
  return (
    <section className="relative h-[700px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?q=80&w=2371&auto=format&fit=crop"
          alt="Horse in field"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
      </div>

      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto w-full">
        {/* Trust Badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6">
          <Shield className="h-4 w-4 text-green-400" />
          <span className="text-sm font-medium text-white">Trusted by Thousands of Buyers & Sellers</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
          The Premium Horse
          <br />
          <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
            Marketplace
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto font-light">
          Buy and sell with confidence. Verified sellers, secure escrow, and expert support.
        </p>

        {/* Trust Pills */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2">
            <Lock className="h-4 w-4 text-green-400" />
            <span className="text-sm font-medium text-white">Secure Escrow</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2">
            <Shield className="h-4 w-4 text-green-400" />
            <span className="text-sm font-medium text-white">Verified Sellers</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="text-sm font-medium text-white">Premium Listings</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link
            href="/horses/map"
            className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-lg shadow-green-900/30 transition-all hover:shadow-xl hover:scale-105"
          >
            Browse Horses
          </Link>
          <Link
            href="/register"
            className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white font-semibold rounded-lg transition-all hover:shadow-lg"
          >
            List Your Horse
          </Link>
        </div>
      </div>

      {/* Search Bar Positioned at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-20 transform translate-y-1/2">
        <SearchBar variant="hero" />
      </div>
    </section>
  )
}