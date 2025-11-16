import * as React from 'react'

interface ViewingRequestReceivedEmailProps {
  sellerName: string
  buyerName: string
  horseName: string
  requestedDate: string
  requestedTime: string
  message?: string
  phone?: string
  email?: string
  requestUrl: string
}

export const ViewingRequestReceivedEmail: React.FC<ViewingRequestReceivedEmailProps> = ({
  sellerName,
  buyerName,
  horseName,
  requestedDate,
  requestedTime,
  message,
  phone,
  email,
  requestUrl,
}) => (
  <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
    <div style={{ backgroundColor: '#16a34a', padding: '32px', textAlign: 'center' }}>
      <h1 style={{ color: 'white', margin: 0, fontSize: '28px' }}>New Viewing Request</h1>
    </div>

    <div style={{ padding: '32px', backgroundColor: '#f9fafb' }}>
      <p style={{ fontSize: '16px', color: '#374151', marginTop: 0 }}>
        Hi {sellerName},
      </p>

      <p style={{ fontSize: '16px', color: '#374151' }}>
        <strong>{buyerName}</strong> has requested to view your horse <strong>{horseName}</strong>.
      </p>

      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', margin: '24px 0', border: '1px solid #e5e7eb' }}>
        <h2 style={{ fontSize: '18px', color: '#111827', marginTop: 0 }}>Request Details</h2>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tr>
            <td style={{ padding: '8px 0', color: '#6b7280', fontSize: '14px' }}>Requested Date:</td>
            <td style={{ padding: '8px 0', color: '#111827', fontSize: '14px', fontWeight: 'bold' }}>{new Date(requestedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px 0', color: '#6b7280', fontSize: '14px' }}>Requested Time:</td>
            <td style={{ padding: '8px 0', color: '#111827', fontSize: '14px', fontWeight: 'bold' }}>{requestedTime}</td>
          </tr>
          {phone && (
            <tr>
              <td style={{ padding: '8px 0', color: '#6b7280', fontSize: '14px' }}>Phone:</td>
              <td style={{ padding: '8px 0', color: '#111827', fontSize: '14px' }}>{phone}</td>
            </tr>
          )}
          {email && (
            <tr>
              <td style={{ padding: '8px 0', color: '#6b7280', fontSize: '14px' }}>Email:</td>
              <td style={{ padding: '8px 0', color: '#111827', fontSize: '14px' }}>{email}</td>
            </tr>
          )}
        </table>

        {message && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 8px 0' }}>Message from buyer:</p>
            <p style={{ color: '#111827', fontSize: '14px', margin: 0, fontStyle: 'italic' }}>"{message}"</p>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a
          href={requestUrl}
          style={{
            display: 'inline-block',
            padding: '14px 28px',
            backgroundColor: '#16a34a',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '16px'
          }}
        >
          Review Request
        </a>
      </div>

      <div style={{ backgroundColor: '#dbeafe', padding: '16px', borderRadius: '8px', border: '1px solid #93c5fd' }}>
        <p style={{ fontSize: '14px', color: '#1e40af', margin: 0 }}>
          💡 <strong>Tip:</strong> Respond quickly to show buyers you're engaged and serious about selling.
        </p>
      </div>
    </div>

    <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>
      <p style={{ margin: 0 }}>
        This is an automated message from GiddyApp. Please do not reply to this email.
      </p>
    </div>
  </div>
)

export default ViewingRequestReceivedEmail
