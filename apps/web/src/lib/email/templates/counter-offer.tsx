import * as React from 'react'

interface CounterOfferEmailProps {
  buyerName: string
  sellerName: string
  horseName: string
  originalOffer: number
  counterOffer: number
  message?: string
  offerUrl: string
}

export const CounterOfferEmail: React.FC<CounterOfferEmailProps> = ({
  buyerName,
  sellerName,
  horseName,
  originalOffer,
  counterOffer,
  message,
  offerUrl,
}) => (
  <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
    <div style={{ backgroundColor: '#0891b2', padding: '32px', textAlign: 'center' }}>
      <h1 style={{ color: 'white', margin: 0, fontSize: '28px' }}>Counter Offer Received</h1>
    </div>

    <div style={{ padding: '32px', backgroundColor: '#f9fafb' }}>
      <p style={{ fontSize: '16px', lineHeight: '24px', color: '#374151' }}>
        Hi {buyerName},
      </p>

      <p style={{ fontSize: '16px', lineHeight: '24px', color: '#374151' }}>
        {sellerName} has responded to your offer on <strong>{horseName}</strong> with a counter offer.
      </p>

      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', margin: '24px 0', border: '1px solid #e5e7eb' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', color: '#111827' }}>Offer Comparison</h2>

        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Your Offer</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6b7280' }}>
              ${originalOffer.toLocaleString()}
            </div>
          </div>

          <div style={{ textAlign: 'center', alignSelf: 'center', fontSize: '24px', color: '#9ca3af' }}>
            →
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#0891b2', fontSize: '14px', marginBottom: '8px' }}>Counter Offer</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0891b2' }}>
              ${counterOffer.toLocaleString()}
            </div>
          </div>
        </div>

        {message && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
            <span style={{ color: '#6b7280', fontSize: '14px', display: 'block', marginBottom: '8px' }}>Message from seller:</span>
            <p style={{ fontSize: '14px', color: '#374151', margin: 0, fontStyle: 'italic' }}>
              "{message}"
            </p>
          </div>
        )}
      </div>

      <div style={{ backgroundColor: '#fef3c7', padding: '16px', borderRadius: '8px', margin: '24px 0', border: '1px solid #fbbf24' }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#92400e' }}>
          You can accept this counter offer, decline it, or send your own counter offer to continue negotiating.
        </p>
      </div>

      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a
          href={offerUrl}
          style={{
            backgroundColor: '#0891b2',
            color: 'white',
            padding: '16px 32px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '16px',
            display: 'inline-block'
          }}
        >
          Respond to Counter Offer
        </a>
      </div>
    </div>

    <div style={{ padding: '24px', backgroundColor: '#f3f4f6', textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>
      <p style={{ margin: '0 0 8px 0' }}>
        This email was sent by GiddyApp - Premium Horse Marketplace
      </p>
      <p style={{ margin: 0 }}>
        <a href="https://giddyapp.com/settings/notifications" style={{ color: '#16a34a', textDecoration: 'none' }}>
          Manage email preferences
        </a>
      </p>
    </div>
  </div>
)

export default CounterOfferEmail
