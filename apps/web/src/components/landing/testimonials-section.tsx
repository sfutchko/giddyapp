import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'Sarah Mitchell',
    role: 'Professional Rider',
    location: 'Kentucky',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    quote: 'GiddyApp made selling my dressage horse incredibly smooth. The escrow system gave both me and the buyer complete peace of mind. Highly recommended!',
    rating: 5,
  },
  {
    name: 'James Rodriguez',
    role: 'Horse Trainer',
    location: 'Texas',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    quote: 'I\'ve bought three horses through GiddyApp. The verification process and secure payments make it the only platform I trust for high-value purchases.',
    rating: 5,
  },
  {
    name: 'Emily Chen',
    role: 'Equestrian Enthusiast',
    location: 'California',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    quote: 'Found my dream horse within a week! The detailed listings and verified sellers made the whole process stress-free. Couldn\'t be happier!',
    rating: 5,
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-24 px-4 bg-gradient-to-br from-gray-50 to-green-50/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Trusted by Thousands
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            See what our community of buyers and sellers have to say
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 relative"
            >
              <Quote className="absolute top-6 right-6 h-8 w-8 text-green-100" />

              <div className="flex gap-1 mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <p className="text-gray-700 leading-relaxed mb-6 relative z-10">
                "{testimonial.quote}"
              </p>

              <div className="flex items-center gap-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-bold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">
                    {testimonial.role} • {testimonial.location}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
