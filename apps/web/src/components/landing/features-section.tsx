import { Shield, Lock, FileCheck, Headphones, BadgeCheck, CreditCard } from 'lucide-react'

const features = [
  {
    icon: Lock,
    title: 'Secure Escrow Protection',
    description: 'Your payment is held safely until you confirm satisfaction. 7-day protection period gives you peace of mind.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: BadgeCheck,
    title: 'Verified Sellers Only',
    description: 'Every seller undergoes identity verification. Buy with confidence knowing you\'re dealing with authenticated professionals.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: FileCheck,
    title: 'Complete Documentation',
    description: 'Secure document sharing, vet records, registration papers, and all transaction history in one place.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: CreditCard,
    title: 'Flexible Payment Options',
    description: 'Secure payment processing with buyer protection. Make offers, negotiate, and complete transactions safely.',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: Headphones,
    title: '24/7 Expert Support',
    description: 'Our team of equestrian experts is always available to help guide you through every step of the process.',
    color: 'from-indigo-500 to-purple-500',
  },
  {
    icon: Shield,
    title: 'Fraud Protection',
    description: 'Advanced security measures and buyer/seller protection ensure safe, transparent transactions every time.',
    color: 'from-teal-500 to-green-500',
  },
]

export function FeaturesSection() {
  return (
    <section className="py-24 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Premium Features Built for Trust
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to buy or sell horses with complete confidence
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="group relative bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300"
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl mb-5 shadow-lg`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
