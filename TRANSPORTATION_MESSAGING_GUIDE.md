# Transportation Network & Enhanced Messaging Implementation Guide

## Overview
This guide covers the implementation of two major features:
1. **Transportation Network** - Horse transport booking, quotes, and tracking
2. **Enhanced Messaging** - File sharing, automated responses, and video chat

## Database Setup

### Step 1: Run SQL Scripts
Execute these scripts in your Supabase SQL Editor **in order**:

```bash
# 1. Transportation Network
/supabase/transportation-network.sql

# 2. Enhanced Messaging
/supabase/enhanced-messaging.sql
```

### Step 2: Create Storage Buckets
Run this in Supabase SQL Editor:

```sql
-- Message attachments bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('message-attachments', 'message-attachments', false);

-- Allow authenticated users to upload attachments
CREATE POLICY "Users can upload message attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'message-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow message participants to view attachments
CREATE POLICY "Users can view their message attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'message-attachments');
```

---

## Transportation Network

### Features Included
1. **Transporter Profiles** - Companies can register as transporters
2. **Quote Requests** - Buyers request quotes for horse transport
3. **Quote Responses** - Transporters provide quotes
4. **Booking System** - Accept quotes and create bookings
5. **Live Tracking** - Track horse location during transport
6. **Reviews & Ratings** - Rate transporters after delivery
7. **Insurance Options** - Optional insurance coverage

### Database Tables

#### 1. `transporters`
Stores transporter company information:
- Company details (name, logo, description)
- Contact info and service areas
- Credentials (USDOT, MC number, insurance)
- Verification status
- Stats (trips, ratings)

#### 2. `transport_quotes`
Quote requests from buyers:
- Pickup/delivery addresses with coordinates
- Horse details and special requirements
- Preferred dates
- Status tracking

#### 3. `transporter_quote_responses`
Quotes from transporters:
- Pricing and timeline
- Services included (insurance, health cert checks)
- Vehicle details
- Terms and conditions

#### 4. `transport_bookings`
Confirmed bookings:
- Confirmed dates and pricing
- Payment tracking (deposit + full payment)
- Status updates (confirmed → in_transit → delivered)
- Live location tracking
- Document uploads (bill of lading, insurance, delivery receipt)

#### 5. `transport_tracking_updates`
Real-time location updates:
- GPS coordinates
- Status messages
- Estimated arrival times

#### 6. `transporter_reviews`
Customer reviews:
- Overall rating (1-5)
- Category ratings (communication, timeliness, care, professionalism)
- Review text and photos
- Transporter replies

#### 7. `transport_insurance_options`
Insurance plans:
- Provider and plan details
- Coverage amounts and pricing
- Terms and exclusions

### Key User Flows

#### Flow 1: Request Transport Quote
1. Buyer clicks "Request Transport" on horse detail page or after purchase
2. Fill out quote form:
   - Pickup address (auto-filled from horse location)
   - Delivery address
   - Preferred dates
   - Special requirements
3. Quote request broadcast to transporters in service area
4. Buyer receives multiple quotes
5. Compare quotes and select best option

#### Flow 2: Transporter Responds to Quote
1. Transporter receives quote request notification
2. Review request details (distance, dates, requirements)
3. Submit quote with:
   - Price
   - Timeline estimate
   - Services included
   - Vehicle type
   - Terms
4. Buyer notified of new quote

#### Flow 3: Book Transport
1. Buyer selects quote and clicks "Book"
2. Deposit payment processed
3. Booking confirmed
4. Transporter notified
5. Both parties can track status

#### Flow 4: Track Delivery
1. Transporter marks "In Transit"
2. Updates location periodically
3. Buyer sees live map with current location
4. Estimated arrival updated
5. Transporter marks "Delivered"
6. Both parties receive confirmation

#### Flow 5: Leave Review
1. After delivery, buyer can leave review
2. Rate overall experience (1-5 stars)
3. Rate specific categories
4. Write review text
5. Optional: Add photos
6. Transporter can respond

### Implementation Priority

#### Phase 1: Core Transport (Week 1)
- [ ] Transporter registration page
- [ ] Quote request form
- [ ] Quote listing page for buyers
- [ ] Quote response form for transporters

#### Phase 2: Booking & Payment (Week 2)
- [ ] Booking confirmation flow
- [ ] Deposit payment integration (Stripe)
- [ ] Booking management dashboard
- [ ] Full payment processing

#### Phase 3: Tracking (Week 3)
- [ ] Live map tracking component
- [ ] Transporter location update form
- [ ] Push notifications for status changes
- [ ] Delivery confirmation

#### Phase 4: Reviews & Insurance (Week 4)
- [ ] Review submission form
- [ ] Transporter rating display
- [ ] Insurance options selection
- [ ] Insurance certificate generation

---

## Enhanced Messaging

### Features Included
1. **File Attachments** - Share images, PDFs, documents in messages
2. **Automated Responses** - Auto-reply to messages based on keywords or conditions
3. **Read Receipts** - Detailed tracking of who read messages when
4. **Video Chat** - Schedule and conduct video calls (integration ready)

### Database Tables

#### 1. `message_attachments`
Files attached to messages:
- File metadata (name, type, size)
- Storage URL and path
- Thumbnail URL for preview

#### 2. `automated_responses`
Seller auto-response rules:
- Trigger types: keyword, new_message, after_hours, quick_reply
- Response message
- Business hours settings
- Usage statistics

#### 3. `auto_response_log`
Tracks when auto-responses were sent:
- Links to original message
- Sent message
- Timestamp

#### 4. `message_read_receipts`
Detailed read tracking:
- Who read the message
- When they read it

#### 5. `video_call_sessions`
Video chat sessions:
- Participants
- Room ID and access tokens
- Status and timing
- Optional recording URL

### Key User Flows

#### Flow 1: Send Message with Attachment
1. User composes message
2. Clicks attachment icon
3. Selects file(s) from device
4. Files upload to Supabase Storage
5. Message sent with attachment references
6. Recipient sees file preview/download option

#### Flow 2: Set Up Auto-Response
1. Seller goes to Settings → Auto-Responses
2. Create new auto-response:
   - Choose trigger (keyword, new message, after hours)
   - Write response message
   - Set business hours (optional)
   - Activate
3. System automatically sends responses when triggered

#### Flow 3: Schedule Video Call
1. User clicks "Video Call" button in conversation
2. Select date/time or "Call Now"
3. Invitation sent to other party
4. Other party accepts
5. Video room created
6. Both join via unique link

#### Flow 4: Join Video Call
1. Click "Join Call" button
2. Grant camera/mic permissions
3. Enter video room
4. Video chat interface with controls:
   - Mute/unmute
   - Camera on/off
   - Screen share
   - End call

### File Attachment Implementation

#### Supported File Types
- **Images**: JPG, PNG, GIF, WEBP (max 10MB)
- **Documents**: PDF, DOC, DOCX (max 25MB)
- **Videos**: MP4, MOV (max 100MB)

#### Upload Flow
```typescript
// 1. User selects file
const file = event.target.files[0]

// 2. Upload to Supabase Storage
const filePath = `${userId}/${messageId}/${file.name}`
const { data, error } = await supabase.storage
  .from('message-attachments')
  .upload(filePath, file)

// 3. Create attachment record
await supabase.from('message_attachments').insert({
  message_id: messageId,
  file_name: file.name,
  file_type: getFileType(file),
  file_size: file.size,
  mime_type: file.type,
  storage_url: data.path,
  storage_path: filePath,
  uploaded_by: userId
})
```

### Auto-Response System

#### Trigger Types

**1. Keyword Trigger**
- Triggers when message contains specific keywords
- Example: "price", "available", "visit"
- Response: "Thanks for your interest! The horse is still available. Call me at..."

**2. New Message Trigger**
- Triggers for first-time senders
- Sends welcome message
- Example: "Thanks for reaching out! I'll get back to you within 24 hours."

**3. After Hours Trigger**
- Triggers outside business hours
- Example: "Thanks for your message! Our business hours are 9am-5pm EST. I'll reply during business hours."

**4. Quick Reply**
- Pre-written responses for common questions
- Not automatic - seller clicks to insert

#### Example Auto-Response
```typescript
{
  trigger_type: 'keyword',
  keywords: ['price', 'cost', 'how much'],
  response_message: 'The asking price is ${{horse_price}}. This includes all health records and a 30-day health guarantee. Would you like to schedule a viewing?',
  active_hours_only: false,
  business_hours_start: '09:00',
  business_hours_end: '17:00',
  business_days: [1,2,3,4,5] // Monday-Friday
}
```

### Video Chat Integration

#### Recommended Providers
1. **Daily.co** (Easiest)
   - Pre-built React components
   - Free tier: 10,000 minutes/month
   - No credit card required
   - Setup time: 30 minutes

2. **Agora** (Most Features)
   - Custom UI flexibility
   - Free tier: 10,000 minutes/month
   - Setup time: 2 hours

3. **Whereby** (Simplest)
   - Embedded rooms
   - Free tier: 1 room, unlimited time
   - Setup time: 15 minutes

#### Integration Steps (Daily.co)

**Step 1: Sign up and get API key**
```bash
# Add to .env.local
NEXT_PUBLIC_DAILY_API_KEY=your_api_key
```

**Step 2: Install SDK**
```bash
pnpm add @daily-co/daily-react
```

**Step 3: Create room when scheduling call**
```typescript
async function createVideoRoom() {
  const response = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
        enable_screenshare: true,
        enable_chat: true,
        max_participants: 2
      }
    })
  })

  const room = await response.json()

  // Save to database
  await supabase.from('video_call_sessions').insert({
    room_id: room.name,
    room_token: room.url,
    initiated_by: userId,
    participant_id: otherUserId,
    scheduled_at: scheduledTime
  })

  return room.url
}
```

**Step 4: Join video call component**
```typescript
import { DailyProvider, useDaily } from '@daily-co/daily-react'

function VideoCall({ roomUrl }) {
  return (
    <DailyProvider url={roomUrl}>
      <VideoUI />
    </DailyProvider>
  )
}
```

---

## Implementation Checklist

### Transportation Network
- [ ] Run `transportation-network.sql`
- [ ] Create transporter registration page (`/transporter/register`)
- [ ] Create quote request form component
- [ ] Create quote listing page (`/transport/quotes`)
- [ ] Create quote response form for transporters
- [ ] Create booking confirmation flow
- [ ] Integrate deposit payment (Stripe)
- [ ] Create live tracking map component
- [ ] Create review submission form
- [ ] Add transporter profile pages
- [ ] Add insurance selection UI

### Enhanced Messaging
- [ ] Run `enhanced-messaging.sql`
- [ ] Create message-attachments storage bucket
- [ ] Add file upload button to message composer
- [ ] Create file attachment preview component
- [ ] Create auto-response management page (`/settings/auto-responses`)
- [ ] Implement auto-response trigger logic
- [ ] Add video call button to conversations
- [ ] Integrate Daily.co/Agora SDK
- [ ] Create video call UI component
- [ ] Add call scheduling modal
- [ ] Implement read receipt display

---

## Next Steps

### Immediate (Week 1)
1. Run both SQL scripts in Supabase
2. Create storage bucket for attachments
3. Build transporter registration page
4. Build quote request form

### Short-term (Weeks 2-3)
1. Complete booking and payment flow
2. Add file sharing to messages
3. Implement auto-responses
4. Add basic tracking

### Medium-term (Week 4+)
1. Add video chat integration
2. Build review system
3. Add insurance options
4. Polish UI and add animations

### Testing Checklist
- [ ] Test transporter registration
- [ ] Test quote request submission
- [ ] Test quote response flow
- [ ] Test booking creation
- [ ] Test file upload in messages
- [ ] Test auto-response triggers
- [ ] Test video call creation
- [ ] Test tracking updates
- [ ] Test review submission

---

## API Examples

### Create Transport Quote Request
```typescript
import { createTransportQuote } from '@/lib/actions/transport'

const quote = await createTransportQuote({
  horseId: 'uuid',
  pickupAddress: '123 Farm Rd, City, ST 12345',
  deliveryAddress: '456 Buyer St, City, ST 54321',
  preferredPickupDate: '2025-02-01',
  specialRequirements: 'Nervous around trailers, needs patience',
  horseCount: 1
})
```

### Send Message with Attachment
```typescript
import { sendMessage } from '@/lib/actions/messages'

const message = await sendMessage({
  recipientId: 'uuid',
  horseId: 'uuid',
  content: 'Here are the vet records you requested',
  attachments: [
    {
      fileName: 'vet-records.pdf',
      fileUrl: 'storage-url',
      fileType: 'pdf'
    }
  ]
})
```

### Create Auto-Response
```typescript
import { createAutoResponse } from '@/lib/actions/auto-responses'

const autoResponse = await createAutoResponse({
  triggerType: 'keyword',
  keywords: ['price', 'cost'],
  responseMessage: 'The asking price is $15,000. Happy to discuss!',
  activeHoursOnly: true,
  businessHoursStart: '09:00',
  businessHoursEnd: '17:00',
  businessDays: [1,2,3,4,5]
})
```

---

## Production Considerations

### Security
- [ ] File upload virus scanning (ClamAV integration)
- [ ] File type validation
- [ ] Max file size enforcement
- [ ] Rate limiting on uploads
- [ ] Validate transporter credentials

### Performance
- [ ] Lazy load message attachments
- [ ] Compress images before upload
- [ ] CDN for attachment delivery
- [ ] Cache transporter locations

### Monitoring
- [ ] Track quote request→booking conversion rate
- [ ] Monitor average response time for quotes
- [ ] Track file upload success/failure rates
- [ ] Monitor video call quality metrics

### Legal
- [ ] Terms of service for transporters
- [ ] Liability disclaimers
- [ ] Insurance verification process
- [ ] Background check requirements
- [ ] Video call recording consent

---

## Support & Troubleshooting

### Common Issues

**File Upload Fails**
- Check storage bucket exists
- Verify RLS policies
- Check file size limits
- Confirm user is authenticated

**Auto-Response Not Triggering**
- Verify response is active
- Check keyword matching
- Verify business hours logic
- Check trigger conditions

**Video Call Won't Connect**
- Verify API key is correct
- Check room hasn't expired
- Confirm camera/mic permissions
- Test with different browser

---

## Future Enhancements

### Transportation
- [ ] Multi-leg routing (pickup multiple horses)
- [ ] Real-time GPS tracking device integration
- [ ] Automated ETA calculations
- [ ] Driver mobile app
- [ ] Payment disputes resolution
- [ ] Transport marketplace analytics

### Messaging
- [ ] Voice messages
- [ ] Message reactions (emoji)
- [ ] Message forwarding
- [ ] Group conversations
- [ ] Message search
- [ ] Archive conversations
- [ ] Message scheduling

---

**Last Updated**: January 2025
**Status**: Ready for Implementation
