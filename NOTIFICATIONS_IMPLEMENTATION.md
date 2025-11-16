# Notification System Implementation Guide

## Overview
The notification system is now fully built and ready to integrate with your existing features. Here's everything you need to know.

## What's Been Built

### 1. Database Schema (`/supabase/NOTIFICATIONS_SYSTEM.sql`)
- **notifications** table - Stores all notifications with RLS policies
- **notification_preferences** table - User notification settings
- **price_history** table - Automatic price change tracking
- **Triggers** - Auto-create price change notifications when watched horses change price
- **Helper functions** - Utilities for managing notifications

### 2. Server Actions (`/lib/actions/notifications.ts`)
- `getNotifications()` - Fetch user's notifications
- `getUnreadNotificationCount()` - Get unread count
- `markNotificationAsRead()` - Mark single as read
- `markAllNotificationsAsRead()` - Mark all as read
- `archiveNotification()` - Archive notification
- `deleteNotification()` - Delete notification
- `getNotificationPreferences()` - Get user preferences
- `updateNotificationPreferences()` - Update preferences
- `createNotification()` - Create new notification

### 3. UI Components
- **NotificationBell** (`/components/notifications/notification-bell.tsx`)
  - Bell icon in header with unread count badge
  - Dropdown preview of recent notifications
  - Click to mark as read, delete
  - Auto-refreshes every 30 seconds

- **NotificationsContent** (`/components/notifications/notifications-content.tsx`)
  - Full notifications page at `/notifications`
  - Filter by read/unread and type
  - Horse thumbnails for related notifications
  - Mark all as read, delete actions

- **NotificationPreferencesContent** (`/components/notifications/notification-preferences-content.tsx`)
  - Preferences page at `/notifications/preferences`
  - Toggle in-app, email, and push notifications
  - Email digest frequency (instant/daily/weekly/never)
  - Quiet hours configuration

### 4. Helper Functions (`/lib/notifications/create-notification-helper.ts`)
Ready-to-use notification creators for:
- New messages
- New offers
- Offer accepted/rejected/countered
- Viewing requests
- Viewing approved/declined
- Listings sold
- New reviews
- System notifications

## How to Integrate

### Step 1: Run the SQL Migration
In Supabase SQL Editor, run `/supabase/NOTIFICATIONS_SYSTEM.sql`

This creates all tables, triggers, and functions.

### Step 2: Add Notification Calls to Existing Features

#### For Messages (in `/lib/actions/messages.ts`)
```typescript
import { notifyNewMessage } from '@/lib/notifications/create-notification-helper'

// When creating a new message
export async function sendMessage(...) {
  // ... existing code to save message ...

  // Add notification
  await notifyNewMessage({
    recipientId: recipientId,
    senderName: senderProfile.full_name || senderProfile.name || 'Someone',
    horseId: horseId,
    horseName: horse.name,
    horseSlug: horse.slug,
    messagePreview: content
  })
}
```

#### For Offers (in `/lib/actions/offers.ts`)
```typescript
import {
  notifyNewOffer,
  notifyOfferAccepted,
  notifyOfferRejected,
  notifyCounterOffer,
  notifyListingSold
} from '@/lib/notifications/create-notification-helper'

// When creating an offer
export async function createOffer(...) {
  // ... existing code ...

  await notifyNewOffer({
    sellerId: offer.seller_id,
    buyerName: buyerName,
    horseId: horseId,
    horseName: horse.name,
    horseSlug: horse.slug,
    offerAmount: amount,
    offerId: offer.id
  })
}

// When accepting an offer
export async function acceptOffer(...) {
  // ... existing code ...

  await notifyOfferAccepted({
    buyerId: offer.buyer_id,
    sellerName: sellerName,
    horseId: offer.horse_id,
    horseName: horse.name,
    horseSlug: horse.slug,
    offerAmount: offer.amount,
    offerId: offerId
  })

  // Notify about listing sold
  await notifyListingSold({
    sellerId: offer.seller_id,
    horseName: horse.name,
    salePrice: offer.amount,
    horseId: offer.horse_id
  })
}

// When rejecting an offer
export async function rejectOffer(...) {
  // ... existing code ...

  await notifyOfferRejected({
    buyerId: offer.buyer_id,
    sellerName: sellerName,
    horseId: offer.horse_id,
    horseName: horse.name,
    horseSlug: horse.slug,
    offerId: offerId
  })
}

// When making a counter-offer
export async function counterOffer(...) {
  // ... existing code ...

  await notifyCounterOffer({
    recipientId: recipientId, // The person receiving the counter
    counterpartyName: counterpartyName,
    horseId: offer.horse_id,
    horseName: horse.name,
    horseSlug: horse.slug,
    counterAmount: counterAmount,
    offerId: newOffer.id
  })
}
```

#### For Viewing Requests (in `/lib/actions/viewing-requests.ts`)
```typescript
import {
  notifyViewingRequest,
  notifyViewingApproved,
  notifyViewingDeclined
} from '@/lib/notifications/create-notification-helper'

// When creating a viewing request
export async function createViewingRequest(...) {
  // ... existing code ...

  await notifyViewingRequest({
    sellerId: sellerId,
    requesterName: requesterName,
    horseId: horseId,
    horseName: horse.name,
    horseSlug: horse.slug,
    requestedDate: requestedDate,
    requestedTime: requestedTime,
    viewingRequestId: data.id
  })
}

// When approving a request
export async function updateViewingRequestStatus(requestId, status, ...) {
  // ... existing code ...

  if (status === 'approved') {
    await notifyViewingApproved({
      requesterId: request.requester_id,
      sellerName: sellerName,
      horseId: request.horse_id,
      horseName: horse.name,
      horseSlug: horse.slug,
      requestedDate: request.requested_date,
      requestedTime: request.requested_time,
      viewingRequestId: requestId
    })
  } else if (status === 'declined') {
    await notifyViewingDeclined({
      requesterId: request.requester_id,
      sellerName: sellerName,
      horseId: request.horse_id,
      horseName: horse.name,
      horseSlug: horse.slug,
      viewingRequestId: requestId
    })
  }
}
```

### Step 3: Price Change Notifications (Already Automatic!)
The system automatically:
1. Tracks all price changes in `price_history` table (trigger on horses table)
2. Notifies all users watching that horse who have `notify_price_change` enabled
3. Creates rich notifications with old/new prices and percentage change

**No code needed** - just works once you run the SQL migration!

## Features

### Automatic Price Tracking
- Every price change is recorded in `price_history`
- Calculates price change amount and percentage
- Automatically stored via database trigger

### Smart Notifications
- Notifications link to relevant pages (horse detail, offers, viewing requests, etc.)
- Include horse thumbnails when applicable
- Show metadata (prices, names, dates)
- Mark as read automatically when clicking
- Auto-refresh unread count

### User Preferences
Users can control:
- In-app notifications (per category)
- Email notifications (per category)
- Push notifications (per category)
- Email digest frequency
- Quiet hours

### Notification Bell
- Shows in header for logged-in users
- Real-time unread count badge
- Dropdown with last 10 notifications
- Click notification to navigate and mark as read
- Quick delete and mark as read actions

## Testing

### Manual Testing Steps

1. **Price Change Notifications**
   - Edit a horse listing and change the price
   - Watch that horse (if not already)
   - Check notifications bell - should see price change notification

2. **Message Notifications**
   - Send a message to another user
   - Check their notifications (login as that user)

3. **Offer Notifications**
   - Make an offer on a horse
   - Accept/reject/counter the offer
   - Check both parties' notifications

4. **Viewing Request Notifications**
   - Request a viewing
   - Approve/decline as seller
   - Check both parties' notifications

5. **Preferences**
   - Go to `/notifications/preferences`
   - Toggle various settings
   - Verify they save correctly

## Database Indexes
The system includes optimized indexes for:
- User ID lookups
- Unread notification queries
- Notification type filtering
- Date-based sorting

## Security
- Row Level Security (RLS) enabled on all tables
- Users can only see their own notifications
- Users can only modify their own preferences
- System can create notifications for any user (for automated triggers)

## Performance
- Notifications limited to 10 in dropdown
- Auto-refresh every 30 seconds (configurable)
- Efficient indexes for fast queries
- Metadata stored as JSONB for flexibility

## Future Enhancements (Email/Push)
The infrastructure is ready for:
- Email notifications via Resend
- Push notifications via Firebase/OneSignal
- SMS notifications via Twilio

All preferences are already in the database and UI!

## Troubleshooting

### Notifications not appearing
1. Check if SQL migration was run
2. Verify RLS policies are enabled
3. Check browser console for errors
4. Verify notification helper functions are being called

### Price changes not creating notifications
1. Ensure `notify_price_change` is TRUE in favorites table
2. Check if price_history trigger is working
3. Verify user has the horse in watchlist

### Unread count not updating
1. Check if notification bell is polling (every 30 seconds)
2. Refresh the page
3. Check network tab for failed requests

## API Reference

See `/lib/actions/notifications.ts` for full TypeScript types and documentation.

## Support

All notification code is production-ready with:
- Proper error handling
- TypeScript types
- Loading states
- Optimistic updates
- Toast notifications for user feedback
