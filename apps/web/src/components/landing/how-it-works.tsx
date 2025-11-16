import { Search, MessageCircle, DollarSign, CheckCircle } from 'lucide-react'

const steps = [
  {
    icon: Search,
    title: 'Browse Listings',
    description: 'Search thousands of horses with detailed photos, videos, and comprehensive information from verified sellers.',
  },
  {
    icon: MessageCircle,
    title: 'Connect with Sellers',
    description: 'Message sellers directly, request viewings, and ask questions through our secure messaging platform.',
  },
  {
    icon: DollarSign,
    title: 'Make an Offer',
    description: 'Submit offers, negotiate terms, and arrange pre-purchase exams with buyer protection built in.',
  },
  {
    icon: CheckCircle,
    title: 'Complete the Sale',
    description: 'Finalize the transaction with confidence using our secure payment processing and documentation.',
  },
]

export function HowItWorks() {
  return (
    <section className="py-20 px-4 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            How It Works
          </h2>
          <p className="text-lg text-gray-600">
            A straightforward process from search to sale
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={index} className="relative">
                <div className="bg-white rounded-lg p-6 border border-gray-200 h-full hover:border-slate-300 hover:shadow-md transition-all">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-slate-700">{index + 1}</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-full w-8 -ml-4 border-t-2 border-dashed border-gray-300" />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}