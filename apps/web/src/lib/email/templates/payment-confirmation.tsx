import * as React from 'react'

interface PaymentConfirmationEmailProps {
  buyerName: string
  horseName: string
  amount: number
  transactionId: string
  sellerName: string
  dashboardUrl: string
}

export const PaymentConfirmationEmail: React.FC<PaymentConfirmationEmailProps> = ({
  buyerName,
  horseName,
  amount,
  transactionId,
  sellerName,
  dashboardUrl,
}) => (
  <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
    <div style={{ backgroundColor: '#16a34a', padding: '32px', textAlign: 'center' }}>
      <div style={{ fontSize: '48px', marginBottom: '8px' }}>✓</div>
      <h1 style={{ color: 'white', margin: 0, fontSize: '28px' }}>Payment Confirmed!</h1>
    </div>

    <div style={{ padding: '32px', backgroundColor: '#f9fafb' }}>
      <p style={{ fontSize: '16px', lineHeight: '24px', color: '#374151' }}>
        Hi {buyerName},
      </p>

      <p style={{ fontSize: '16px', lineHeight: '24px', color: '#374151' }}>
        Your payment for <strong>{horseName}</strong> has been successfully processed and is now held securely in escrow.
      </p>

      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', margin: '24px 0', border: '1px solid #e5e7eb' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', color: '#111827' }}>Payment Details</h2>

        <div style={{ marginBottom: '12px' }}>
          <span style={{ color: '#6b7280', fontSize: '14px' }}>Amount Paid:</span>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#16a34a', margin: '8px 0' }}>
            ${amount.toLocaleString()}
          </div>
        </div>

        <div style={{ paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>Horse:</span>
            <div style={{ fontSize: '16px', color: '#111827' }}>{horseName}</div>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>Seller:</span>
            <div style={{ fontSize: '16px', color: '#111827' }}>{sellerName}</div>
          </div>
          <div>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>Transaction ID:</span>
            <div style={{ fontSize: '14px', color: '#6b7280', fontFamily: 'monospace' }}>{transactionId}</div>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: '#dbeafe', padding: '20px', borderRadius: '8px', margin: '24px 0', border: '1px solid #3b82f6' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#1e40af' }}>
          🔒 Your Payment is Protected
        </h3>
        <p style={{ margin: 0, fontSize: '14px', color: '#1e40af', lineHeight: '20px' }}>
          Your funds are held securely in escrow until you confirm receipt and satisfaction with {horseName}. This protects both you and the seller.
        </p>
      </div>

      <div style={{ marginTop: '24px', padding: '20px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#111827' }}>Next Steps:</h3>
        <ol style={{ margin: 0, paddingLeft: '20px', color: '#374151', fontSize: '14px', lineHeight: '20px' }}>
          <li style={{ marginBottom: '8px' }}>Contact {sellerName} to arrange pickup or delivery</li>
          <li style={{ marginBottom: '8px' }}>Inspect {horseName} thoroughly upon arrival</li>
          <li style={{ marginBottom: '8px' }}>Once satisfied, release the escrow funds from your dashboard</li>
        </ol>
      </div>

      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a
          href={dashboardUrl}
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
          View Transaction
        </a>
      </div>

      <p style={{ fontSize: '14px', color: '#6b7280', margin: '24px 0 0 0' }}>
        If you have any questions or concerns, please don't hesitate to contact our support team.
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

export default PaymentConfirmationEmail
