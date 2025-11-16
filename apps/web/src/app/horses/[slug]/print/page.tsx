import { notFound } from 'next/navigation'
import { getHorseBySlug } from '@/lib/actions/horses'

export default async function HorsePrintPage({
  params,
}: {
  params: { slug: string }
}) {
  const result = await getHorseBySlug(params.slug)

  if ('error' in result) {
    notFound()
  }

  const horse = result.horse
  const primaryImage = horse.horse_images?.find((img: any) => img.is_primary)?.url ||
                       horse.horse_images?.[0]?.url

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            .no-print {
              display: none !important;
            }
            @page {
              margin: 1cm;
            }
          }
        `
      }} />
      <div className="max-w-4xl mx-auto p-8 bg-white">

      <div className="border-b-2 border-gray-900 pb-6 mb-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{horse.name}</h1>
        <p className="text-xl text-gray-600">
          {horse.breed} • {horse.gender.toLowerCase()}
        </p>
      </div>

      {primaryImage && (
        <div className="mb-6">
          <img
            src={primaryImage}
            alt={horse.name}
            className="w-full max-h-96 object-cover rounded-lg"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-300">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Age</h3>
          <p className="text-lg font-bold text-gray-900">{horse.age} years</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Height</h3>
          <p className="text-lg font-bold text-gray-900">{horse.height} hands</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Color</h3>
          <p className="text-lg font-bold text-gray-900">{horse.color}</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Price</h3>
          <p className="text-lg font-bold text-gray-900">${horse.price.toLocaleString()}</p>
          {horse.metadata?.negotiable && (
            <p className="text-sm text-gray-600">Negotiable</p>
          )}
        </div>
      </div>

      <div className="mb-6 pb-6 border-b border-gray-300">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Description</h2>
        <p className="text-gray-700 whitespace-pre-line leading-relaxed">
          {horse.description}
        </p>
      </div>

      {horse.metadata?.disciplines && horse.metadata.disciplines.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Disciplines</h3>
          <p className="text-gray-700">{horse.metadata.disciplines.join(', ')}</p>
        </div>
      )}

      {horse.metadata?.temperament && (
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Temperament</h3>
          <p className="text-gray-700">{horse.metadata.temperament}</p>
        </div>
      )}

      {horse.metadata?.healthStatus && (
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Health Status</h3>
          <p className="text-gray-700">{horse.metadata.healthStatus}</p>
        </div>
      )}

      {horse.metadata?.registrations && (
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Registrations</h3>
          <p className="text-gray-700">{horse.metadata.registrations}</p>
        </div>
      )}

      {horse.metadata?.competitionHistory && (
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Competition History</h3>
          <p className="text-gray-700 whitespace-pre-line">{horse.metadata.competitionHistory}</p>
        </div>
      )}

      <div className="mb-6 pb-6 border-b border-gray-300">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Location</h3>
        <p className="text-gray-700">
          {horse.location?.city}, {horse.location?.state} {horse.location?.zipCode}
        </p>
      </div>

      {horse.profiles && (
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Seller Contact</h3>
          <p className="text-gray-700">{horse.profiles.name}</p>
          {horse.profiles.email && (
            <p className="text-gray-700">Email: {horse.profiles.email}</p>
          )}
          {horse.profiles.phone && (
            <p className="text-gray-700">Phone: {horse.profiles.phone}</p>
          )}
        </div>
      )}

      <div className="text-center text-gray-500 text-sm mt-8 pt-6 border-t border-gray-300">
        <p>Printed from GiddyApp.com</p>
        <p className="mt-1">
          View full listing at: {typeof window !== 'undefined' ? window.location.origin : ''}/horses/{horse.slug}
        </p>
      </div>
      </div>
    </>
  )
}
