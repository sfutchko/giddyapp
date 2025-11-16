# Reviews and Ratings System Implementation Guide

## Overview
The reviews and ratings system is fully built and ready to use. This comprehensive system allows buyers and sellers to review each other after completed transactions, building trust and reputation in the marketplace.

## What's Been Built

### 1. Database Schema (`/supabase/REVIEWS_RATINGS_SYSTEM.sql`)
- **reviews** table - Stores all reviews with transaction verification
- **review_helpful_votes** table - Allows users to vote on review helpfulness
- **review_reports** table - Moderation and reporting system
- **user_reputation** table - Cached reputation scores and statistics
- **Triggers** - Auto-update helpful counts, reputation scores, and notifications
- **Helper functions** - Utilities for reputation calculation and review eligibility

### 2. Server Actions (`/lib/actions/reviews.ts`)
Complete TypeScript API for review management:
- `canReviewOffer()` - Check if user can review a transaction
- `createReview()` - Create new review
- `getUserReviews()` - Get reviews for a specific user
- `getReview()` - Get single review details
- `getUserReputation()` - Get user's reputation stats
- `updateReview()` - Edit existing review
- `addSellerReply()` - Add seller response to review
- `voteReviewHelpful()` - Vote on review helpfulness
- `reportReview()` - Report inappropriate reviews
- `getReviewsByUser()` - Get reviews written by a user
- `getReviewableOffers()` - Get transactions that can be reviewed
- `deleteReview()` - Delete own review

### 3. UI Components

#### ReviewForm (`/components/reviews/review-form.tsx`)
- Interactive star rating system (1-5 stars)
- Category ratings for seller reviews (communication, accuracy, professionalism)
- Optional title and required review text
- Photo upload placeholder (ready for integration)
- Form validation and error handling

#### ReviewCard (`/components/reviews/review-card.tsx`)
- Displays complete review with metadata
- Verified purchase badge
- Category ratings display
- Seller reply functionality
- Helpful/not helpful voting
- Report button
- Delete option for own reviews

#### UserReputationDisplay (`/components/reviews/user-reputation.tsx`)
- Overall reputation score (0-100)
- Star rating and review count
- Rating distribution bar chart
- Top Rated and Verified badges
- Category averages for sellers
- Separate buyer/seller statistics

#### SellerReviewsSection (`/components/reviews/seller-reviews-section.tsx`)
- Compact display for horse listing pages
- Overall rating and review count
- Recent reviews preview
- Link to full reviews page

### 4. Page Routes

#### Write Review Pages
- `/reviews/write` - List of reviewable transactions
- `/reviews/write/[offerId]` - Review form for specific transaction

#### Profile Reviews Page
- `/profile/reviews` - User's reviews received and written
- Displays reputation dashboard
- Links to write new reviews

### 5. Features

#### Transaction-Based Reviews
- Only users who completed a transaction can review
- One review per user per transaction
- Automatic verification of purchase
- Reviews tied to specific offers

#### Two-Way Reviews
- Buyers can review sellers (with category ratings)
- Sellers can review buyers
- Each party reviews the other independently

#### Category Ratings (Seller Reviews Only)
- Communication (1-5 stars)
- Accuracy of Listing (1-5 stars)
- Professionalism (1-5 stars)
- Averages calculated automatically

#### Reputation System
- Automatic calculation via database triggers
- 0-100 reputation score based on:
  - Average rating (weighted heavily)
  - Number of reviews (bonus points)
  - Consistency (10+ reviews bonus)
- Top Rated badge (4.5+ stars, 5+ reviews)
- Verified Seller badge (separate verification)

#### Review Moderation
- Users can report inappropriate reviews
- Report reasons: spam, offensive, fake, irrelevant, personal info, other
- Admin moderation queue (pending, reviewed, actioned, dismissed)
- Reviews can be: pending, published, hidden, flagged, removed

#### Helpful Votes
- Users can mark reviews as helpful or not helpful
- Vote counts displayed on each review
- Users can change or remove their votes
- Automatic counter updates via triggers

#### Seller Replies
- Sellers can reply to reviews they received
- One reply per review
- Timestamp tracked
- Displayed prominently on review card

#### Smart Notifications
- Automatic notifications when receiving reviews
- Includes rating, reviewer name, and horse details
- Links directly to reviews page
- Notification preferences respected

## Database Schema Details

### Reviews Table
```sql
- id (UUID, primary key)
- reviewer_id (references auth.users)
- reviewee_id (references auth.users)
- offer_id (references offers) - Transaction verification
- horse_id (references horses)
- review_type (buyer_to_seller | seller_to_buyer)
- rating (1-5, required)
- communication_rating (1-5, optional)
- accuracy_rating (1-5, optional)
- professionalism_rating (1-5, optional)
- title (varchar 200, optional)
- review_text (text, min 10 chars)
- photo_urls (text array, optional)
- status (pending | published | hidden | flagged | removed)
- helpful_count / not_helpful_count (auto-updated)
- seller_reply (text, optional)
- seller_replied_at (timestamp)
- verified_purchase (always true for this system)
```

### User Reputation Table
```sql
- user_id (primary key)
- total_reviews, average_rating
- rating_5_count, rating_4_count, etc.
- average_communication, average_accuracy, average_professionalism
- as_seller_reviews, as_seller_rating
- as_buyer_reviews, as_buyer_rating
- reputation_score (0-100)
- is_top_rated, is_verified_seller (badges)
```

## How It Works

### 1. Complete a Transaction
- Buyer makes offer on a horse
- Seller accepts offer
- Offer status changes to "accepted"

### 2. Write a Review
- Navigate to `/reviews/write`
- See list of completed transactions
- Click on transaction to review
- Fill out review form:
  - Select overall star rating (required)
  - Add category ratings (optional, seller reviews only)
  - Write review title (optional)
  - Write review text (required, min 10 characters)
  - Upload photos (optional, coming soon)
- Submit review

### 3. Review Published
- Review immediately published
- Reviewee receives notification
- Reputation score automatically updated
- Review appears on:
  - Reviewee's profile (`/profile/reviews`)
  - Horse listing sidebar (if seller)
  - Public review pages

### 4. Respond to Review (Optional)
- Reviewee sees review on `/profile/reviews`
- Click "Reply" button
- Write response
- Reply displayed below review

### 5. Community Interaction
- Other users can vote reviews helpful/not helpful
- Users can report inappropriate reviews
- Reviews build seller reputation over time

## Reputation Score Calculation

The reputation score (0-100) is calculated as:
```typescript
score = (average_rating * 20) +        // Max 100 from 5.0 rating
        min(20, total_reviews) +       // Up to 20 bonus for volume
        (total_reviews >= 10 ? 10 : 0) // Bonus for 10+ reviews
```

Top Rated Badge Requirements:
- Average rating >= 4.5 stars
- At least 5 reviews

## Security

### Row Level Security (RLS)
- Users can only view published reviews
- Users can view their own reviews (any status)
- Reviews can only be created for completed transactions
- Users can only update/delete their own reviews
- Reviewees can add replies to reviews about them

### Verification
- All reviews require completed offer (accepted status)
- Verified purchase badge on all reviews
- One review per user per transaction (enforced by unique constraint)
- Review eligibility checked via database function

### Moderation
- Report system for inappropriate content
- Admin moderation queue
- Review status workflow
- Moderation notes and timestamps

## Integration Points

### Already Integrated
✅ Horse listing pages show seller reviews
✅ Notification system sends review alerts
✅ Profile page links to reviews
✅ Automatic reputation calculation

### Where to Add Review Prompts
You may want to add "Write a Review" prompts to:
1. **Order confirmation emails** - After transaction completes
2. **Dashboard** - Banner/reminder for pending reviews
3. **Offer acceptance page** - Mention review system

## Testing the System

### Manual Testing Steps

1. **Create Test Transaction**
   - Have two users (buyer and seller)
   - Create offer and accept it
   - Verify offer status is "accepted"

2. **Write Review as Buyer**
   - Login as buyer
   - Go to `/reviews/write`
   - Should see the completed transaction
   - Write review with:
     - 5-star rating
     - Category ratings
     - Title: "Great experience!"
     - Review text describing transaction
   - Submit review

3. **Verify Review Published**
   - Check notification bell (seller should have notification)
   - View seller's profile reviews
   - Check horse listing sidebar (should show review)
   - Verify reputation score updated

4. **Add Seller Reply**
   - Login as seller
   - Go to `/profile/reviews`
   - Find the review
   - Click "Reply"
   - Add response
   - Verify reply appears on review

5. **Test Helpful Votes**
   - Login as third user
   - View the review
   - Click thumbs up/down
   - Verify count updates

6. **Write Counter-Review**
   - Login as seller
   - Go to `/reviews/write`
   - Review the buyer
   - Submit review

7. **Test Edge Cases**
   - Try to review same transaction twice (should fail)
   - Try to review without completed transaction (should fail)
   - Try to delete someone else's review (should fail)

## API Examples

### Check if Can Review
```typescript
const { canReview } = await canReviewOffer('offer-id')
if (canReview) {
  // Show review form
}
```

### Create Review
```typescript
const result = await createReview({
  offerId: 'offer-id',
  rating: 5,
  communicationRating: 5,
  accuracyRating: 5,
  professionalismRating: 5,
  title: 'Great experience!',
  reviewText: 'Very professional seller, horse was exactly as described.'
})
```

### Get User Reviews
```typescript
const { reviews } = await getUserReviews('user-id', {
  reviewType: 'buyer_to_seller',
  minRating: 4,
  limit: 10,
  offset: 0
})
```

### Vote on Review
```typescript
await voteReviewHelpful('review-id', true) // helpful
await voteReviewHelpful('review-id', false) // not helpful
await voteReviewHelpful('review-id', true) // click again to remove vote
```

## Database Performance

### Indexes Created
- User ID lookups
- Review status filtering
- Horse ID filtering
- Offer ID lookups
- Date-based sorting
- Helpful votes counting

### Automatic Updates
- Helpful counts updated via triggers
- Reputation recalculated on review changes
- Notifications sent via triggers
- No manual maintenance needed

## Future Enhancements

Ready-to-implement features:
1. **Photo Upload** - Add actual upload service integration
2. **Review Images** - Display photos in reviews
3. **Email Digest** - Weekly top reviews
4. **Review Analytics** - Charts for sellers
5. **Verified Buyer Badge** - Distinguish actual purchases
6. **Review Reminders** - Automated emails to write reviews
7. **Admin Moderation UI** - Dashboard for reviewing reports
8. **Review Search** - Filter and search all reviews
9. **Seller Profile Page** - Dedicated seller pages with all reviews

## Troubleshooting

### Reviews not appearing
1. Check review status (should be 'published')
2. Verify RLS policies are enabled
3. Check browser console for errors
4. Ensure offer is 'accepted' status

### Reputation not updating
1. Check if reputation trigger is working
2. Verify review status is 'published'
3. Manually call `calculate_user_reputation(user_id)`
4. Check for database errors in logs

### Can't submit review
1. Verify offer is completed (status: 'accepted')
2. Check if review already exists for this transaction
3. Ensure user is either buyer or seller
4. Validate review text is at least 10 characters

### Helpful votes not updating
1. Check if vote trigger is working
2. Verify user is logged in
3. Check for unique constraint violations
4. Refresh page to see updates

## Database Migration

Run the SQL file in Supabase SQL Editor:
```sql
/supabase/REVIEWS_RATINGS_SYSTEM.sql
```

This creates all tables, triggers, functions, and policies.

Then reload the schema cache:
```sql
NOTIFY pgrst, 'reload schema';
```

## Summary

The reviews and ratings system is production-ready with:
- ✅ Complete database schema with triggers
- ✅ Type-safe server actions
- ✅ Beautiful, interactive UI components
- ✅ Transaction verification
- ✅ Automatic reputation calculation
- ✅ Review moderation system
- ✅ Helpful voting system
- ✅ Seller replies
- ✅ Notification integration
- ✅ Display on horse listings
- ✅ User profile integration
- ✅ Security via RLS policies
- ✅ Performance optimization

Users can now build trust through authentic, verified reviews of their transactions!
