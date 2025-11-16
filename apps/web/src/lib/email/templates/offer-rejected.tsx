import * as React from 'react'

interface OfferRejectedEmailProps {
  buyerName: string
  sellerName: string
  horseName: string
  offerAmount: number
  horseUrl: string
}

export const OfferRejectedEmail: React.FC<OfferRejectedEmailProps> = ({
  buyerName,
  sellerName,
  horseName,
  offerAmount,
  horseUrl,
}) => (
  <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
    <div style={{ backgroundColor: '#6b7280', padding: '32px', textAlign: 'center' }}>
      <h1 style={{ color: 'white', margin: 0, fontSize: '28px' }}>Offer Update</h1>
    </div>

    <div style={{ padding: '32px', backgroundColor: '#f9fafb' }}>
      <p style={{ fontSize: '16px', lineHeight: '24px', color: '#374151' }}>
        Hi {buyerName},
      </p>

      <p style={{ fontSize: '16px', lineHeight: '24px', color: '#374151' }}>
        Unfortunately, {sellerName} has declined your offer of <strong>${offerAmount.toLocaleString()}</strong> on {horseName}.
      </p>

      <div style={{ backgroundColor: '#fef3c7', padding: '20px', borderRadius: '8px', margin: '24px 0', border: '1px solid #fbbf24' }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#92400e' }}>
          <strong>Don't give up!</strong> You can make a new offer or browse other amazing horses on our marketplace.
        </p>
      </div>

      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a
          href={horseUrl}
          style={{
            backgroundColor: '#16a34a',
            color: 'white',
            padding: '16px 32px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '16px',
            display: 'inline-block',
            marginRight: '12px'
          }}
        >
          Make Another Offer
        </a>
        <a
          href="https://giddyapp.com/horses/map"
          style={{
            backgroundColor: 'white',
            color: '#16a34a',
            padding: '16px 32px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '16px',
            display: 'inline-block',
            border: '2px solid #16a34a'
          }}
        >
          Browse More Horses
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

export default OfferRejectedEmail
