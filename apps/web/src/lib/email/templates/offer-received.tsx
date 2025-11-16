import * as React from 'react'

interface OfferReceivedEmailProps {
  sellerName: string
  buyerName: string
  horseName: string
  offerAmount: number
  message?: string
  offerUrl: string
}

export const OfferReceivedEmail: React.FC<OfferReceivedEmailProps> = ({
  sellerName,
  buyerName,
  horseName,
  offerAmount,
  message,
  offerUrl,
}) => (
  <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
    <div style={{ backgroundColor: '#16a34a', padding: '32px', textAlign: 'center' }}>
      <h1 style={{ color: 'white', margin: 0, fontSize: '28px' }}>New Offer Received!</h1>
    </div>

    <div style={{ padding: '32px', backgroundColor: '#f9fafb' }}>
      <p style={{ fontSize: '16px', lineHeight: '24px', color: '#374151' }}>
        Hi {sellerName},
      </p>

      <p style={{ fontSize: '16px', lineHeight: '24px', color: '#374151' }}>
        Great news! {buyerName} has made an offer on <strong>{horseName}</strong>.
      </p>

      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', margin: '24px 0', border: '1px solid #e5e7eb' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', color: '#111827' }}>Offer Details</h2>
        <div style={{ marginBottom: '12px' }}>
          <span style={{ color: '#6b7280', fontSize: '14px' }}>Offer Amount:</span>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#16a34a', margin: '8px 0' }}>
            ${offerAmount.toLocaleString()}
          </div>
        </div>
        {message && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
            <span style={{ color: '#6b7280', fontSize: '14px', display: 'block', marginBottom: '8px' }}>Message from buyer:</span>
            <p style={{ fontSize: '14px', color: '#374151', margin: 0, fontStyle: 'italic' }}>
              "{message}"
            </p>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a
          href={offerUrl}
          style={{
            backgroundColor: '#16a34a',
            color: 'white',
            padding: '16px 32px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '16px',
            display: 'inline-block'
          }}
        >
          View & Respond to Offer
        </a>
      </div>

      <p style={{ fontSize: '14px', color: '#6b7280', margin: '24px 0 0 0' }}>
        You can accept, reject, or send a counter offer. We recommend responding within 24 hours to keep the buyer engaged.
      </p>
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

export default OfferReceivedEmail
