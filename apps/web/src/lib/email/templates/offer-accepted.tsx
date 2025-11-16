import * as React from 'react'

interface OfferAcceptedEmailProps {
  buyerName: string
  sellerName: string
  horseName: string
  offerAmount: number
  checkoutUrl: string
}

export const OfferAcceptedEmail: React.FC<OfferAcceptedEmailProps> = ({
  buyerName,
  sellerName,
  horseName,
  offerAmount,
  checkoutUrl,
}) => (
  <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
    <div style={{ backgroundColor: '#16a34a', padding: '32px', textAlign: 'center' }}>
      <h1 style={{ color: 'white', margin: 0, fontSize: '28px' }}>🎉 Your Offer Was Accepted!</h1>
    </div>

    <div style={{ padding: '32px', backgroundColor: '#f9fafb' }}>
      <p style={{ fontSize: '16px', lineHeight: '24px', color: '#374151' }}>
        Hi {buyerName},
      </p>

      <p style={{ fontSize: '16px', lineHeight: '24px', color: '#374151' }}>
        Congratulations! {sellerName} has accepted your offer on <strong>{horseName}</strong>.
      </p>

      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', margin: '24px 0', border: '1px solid #e5e7eb' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', color: '#111827' }}>Accepted Offer</h2>
        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#16a34a', margin: '8px 0' }}>
          ${offerAmount.toLocaleString()}
        </div>
      </div>

      <div style={{ backgroundColor: '#fef3c7', padding: '16px', borderRadius: '8px', margin: '24px 0', border: '1px solid #fbbf24' }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#92400e' }}>
          <strong>Next Step:</strong> Complete your purchase to secure {horseName}. Your payment will be held in escrow until the transaction is complete.
        </p>
      </div>

      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a
          href={checkoutUrl}
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
          Complete Purchase
        </a>
      </div>

      <div style={{ marginTop: '32px', padding: '20px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#111827' }}>What happens next?</h3>
        <ol style={{ margin: 0, paddingLeft: '20px', color: '#374151', fontSize: '14px', lineHeight: '20px' }}>
          <li style={{ marginBottom: '8px' }}>Complete payment - funds are held securely in escrow</li>
          <li style={{ marginBottom: '8px' }}>Coordinate pickup or delivery with the seller</li>
          <li style={{ marginBottom: '8px' }}>Inspect the horse and confirm everything meets expectations</li>
          <li style={{ marginBottom: '8px' }}>Release funds to the seller once satisfied</li>
        </ol>
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

export default OfferAcceptedEmail
