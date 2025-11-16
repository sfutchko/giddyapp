import { HeroSection } from '@/components/landing/hero-section'
import { FeaturedListings } from '@/components/listings/featured-listings'
import { HowItWorks } from '@/components/landing/how-it-works'
import { TrustIndicators } from '@/components/landing/trust-indicators'
import { FeaturesSection } from '@/components/landing/features-section'
import { TestimonialsSection } from '@/components/landing/testimonials-section'
import { CTASection } from '@/components/landing/cta-section'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      <HeroSection />
      <div className="pt-16">
        <TrustIndicators />
        <FeaturedListings />
        <FeaturesSection />
        <HowItWorks />
        <TestimonialsSection />
        <CTASection />
      </div>
    </main>
  )
}