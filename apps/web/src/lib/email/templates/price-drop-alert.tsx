import * as React from 'react'

interface PriceDropAlertEmailProps {
  buyerName: string
  horseName: string
  originalPrice: number
  newPrice: number
  horseUrl: string
  horseImage?: string
}

export const PriceDropAlertEmail: React.FC<PriceDropAlertEmailProps> = ({
  buyerName,
  horseName,
  originalPrice,
  newPrice,
  horseUrl,
  horseImage,
}) => {
  const discount = originalPrice - newPrice
  const discountPercent = Math.round((discount / originalPrice) * 100)

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ backgroundColor: '#dc2626', padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔥</div>
        <h1 style={{ color: 'white', margin: 0, fontSize: '28px' }}>Price Drop Alert!</h1>
      </div>

      <div style={{ padding: '32px', backgroundColor: '#f9fafb' }}>
        <p style={{ fontSize: '16px', lineHeight: '24px', color: '#374151' }}>
          Hi {buyerName},
        </p>

        <p style={{ fontSize: '16px', lineHeight: '24px', color: '#374151' }}>
          Great news! A horse you're watching has dropped in price.
        </p>

        {horseImage && (
          <div style={{ margin: '24px 0', textAlign: 'center' }}>
            <img
              src={horseImage}
              alt={horseName}
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}
            />
          </div>
        )}

        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', margin: '24px 0', border: '1px solid #e5e7eb' }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', color: '#111827' }}>{horseName}</h2>

          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Was</div>
              <div style={{ fontSize: '20px', color: '#6b7280', textDecoration: 'line-through' }}>
                ${originalPrice.toLocaleString()}
              </div>
            </div>

            <div style={{ textAlign: 'center', alignSelf: 'center', fontSize: '24px', color: '#9ca3af' }}>
              →
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#dc2626', fontSize: '14px', marginBottom: '8px' }}>Now</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#dc2626' }}>
                ${newPrice.toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#fee2e2', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#dc2626' }}>
              Save ${discount.toLocaleString()} ({discountPercent}% off!)
            </span>
          </div>
        </div>

        <div style={{ backgroundColor: '#fef3c7', padding: '20px', borderRadius: '8px', margin: '24px 0', border: '1px solid #fbbf24' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#92400e', textAlign: 'center', lineHeight: '20px' }}>
            <strong>Act fast!</strong> This price drop won't last forever. Make an offer or complete your purchase today.
          </p>
        </div>

        <div style={{ textAlign: 'center', margin: '32px 0' }}>
          <a
            href={horseUrl}
            style={{
              backgroundColor: '#dc2626',
              color: 'white',
              padding: '16px 32px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '16px',
              display: 'inline-block'
            }}
          >
            View This Horse
          </a>
        </div>

        <p style={{ fontSize: '12px', color: '#6b7280', margin: '24px 0 0 0', textAlign: 'center' }}>
          You're receiving this because you're watching {horseName}
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
}

export default PriceDropAlertEmail
