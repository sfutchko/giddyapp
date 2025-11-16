import * as React from 'react'

interface OfferExpiredEmailProps {
  buyerName: string
  horseName: string
  offerAmount: number
  offerUrl: string
}

export const OfferExpiredEmail: React.FC<OfferExpiredEmailProps> = ({
  buyerName,
  horseName,
  offerAmount,
  offerUrl,
}) => (
  <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
    <div style={{ backgroundColor: '#f59e0b', padding: '32px', textAlign: 'center' }}>
      <h1 style={{ color: 'white', margin: 0, fontSize: '28px' }}>Your Offer Has Expired</h1>
    </div>

    <div style={{ padding: '32px', backgroundColor: '#f9fafb' }}>
      <p style={{ fontSize: '16px', lineHeight: '24px', color: '#374151' }}>
        Hi {buyerName},
      </p>

      <p style={{ fontSize: '16px', lineHeight: '24px', color: '#374151' }}>
        Your offer on <strong>{horseName}</strong> has expired without a response from the seller.
      </p>

      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', margin: '24px 0', border: '1px solid #e5e7eb' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', color: '#111827' }}>Expired Offer Details</h2>
        <div style={{ marginBottom: '12px' }}>
          <span style={{ color: '#6b7280', fontSize: '14px' }}>Your Offer Amount:</span>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b', margin: '8px 0' }}>
            ${offerAmount.toLocaleString()}
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: '#fef3c7', padding: '16px', borderRadius: '8px', margin: '24px 0', borderLeft: '4px solid #f59e0b' }}>
        <p style={{ fontSize: '14px', color: '#92400e', margin: 0 }}>
          <strong>Good news!</strong> You can extend this offer for another 7 days if you're still interested in {horseName}.
        </p>
      </div>

      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a
          href={offerUrl}
          style={{
            backgroundColor: '#f59e0b',
            color: 'white',
            padding: '16px 32px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '16px',
            display: 'inline-block'
          }}
        >
          Extend Offer for 7 Days
        </a>
      </div>

      <p style={{ fontSize: '14px', color: '#6b7280', margin: '24px 0 0 0' }}>
        If you're no longer interested, no action is needed. The horse is still available for viewing and new offers.
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

export default OfferExpiredEmail
