import * as React from 'react'

interface EscrowReleasedEmailProps {
  recipientName: string
  recipientType: 'buyer' | 'seller'
  horseName: string
  amount: number
  transactionId: string
  dashboardUrl: string
}

export const EscrowReleasedEmail: React.FC<EscrowReleasedEmailProps> = ({
  recipientName,
  recipientType,
  horseName,
  amount,
  transactionId,
  dashboardUrl,
}) => (
  <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
    <div style={{ backgroundColor: '#16a34a', padding: '32px', textAlign: 'center' }}>
      <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎉</div>
      <h1 style={{ color: 'white', margin: 0, fontSize: '28px' }}>
        {recipientType === 'seller' ? 'Payment Released!' : 'Transaction Complete!'}
      </h1>
    </div>

    <div style={{ padding: '32px', backgroundColor: '#f9fafb' }}>
      <p style={{ fontSize: '16px', lineHeight: '24px', color: '#374151' }}>
        Hi {recipientName},
      </p>

      {recipientType === 'seller' ? (
        <p style={{ fontSize: '16px', lineHeight: '24px', color: '#374151' }}>
          Great news! The buyer has confirmed receipt of <strong>{horseName}</strong> and the escrow funds have been released to you.
        </p>
      ) : (
        <p style={{ fontSize: '16px', lineHeight: '24px', color: '#374151' }}>
          Your transaction for <strong>{horseName}</strong> is now complete. The escrow funds have been released to the seller.
        </p>
      )}

      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', margin: '24px 0', border: '1px solid #e5e7eb' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', color: '#111827' }}>Transaction Summary</h2>

        <div style={{ marginBottom: '12px' }}>
          <span style={{ color: '#6b7280', fontSize: '14px' }}>Amount {recipientType === 'seller' ? 'Received' : 'Paid'}:</span>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#16a34a', margin: '8px 0' }}>
            ${amount.toLocaleString()}
          </div>
        </div>

        <div style={{ paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>Horse:</span>
            <div style={{ fontSize: '16px', color: '#111827' }}>{horseName}</div>
          </div>
          <div>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>Transaction ID:</span>
            <div style={{ fontSize: '14px', color: '#6b7280', fontFamily: 'monospace' }}>{transactionId}</div>
          </div>
        </div>
      </div>

      {recipientType === 'seller' ? (
        <>
          <div style={{ backgroundColor: '#dbeafe', padding: '20px', borderRadius: '8px', margin: '24px 0', border: '1px solid #3b82f6' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#1e40af', lineHeight: '20px' }}>
              The funds will be deposited into your account within 3-5 business days according to your payout settings.
            </p>
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
              View Payout Details
            </a>
          </div>
        </>
      ) : (
        <>
          <div style={{ backgroundColor: '#dbeafe', padding: '20px', borderRadius: '8px', margin: '24px 0', border: '1px solid #3b82f6' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#1e40af' }}>
              How was your experience?
            </h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#1e40af', lineHeight: '20px' }}>
              We'd love to hear about your experience buying {horseName}. Your feedback helps us improve our marketplace.
            </p>
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
              Leave a Review
            </a>
          </div>
        </>
      )}

      <p style={{ fontSize: '14px', color: '#6b7280', margin: '24px 0 0 0', textAlign: 'center' }}>
        Thank you for using GiddyApp! We hope to serve you again soon.
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

export default EscrowReleasedEmail
