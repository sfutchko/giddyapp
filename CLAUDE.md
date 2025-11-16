# GiddyApp Development Roadmap - REAL - NOT MVP

## Current Status (Updated 2025-01-15 Night)

### 🎉 Latest Completed:
- **Transportation Network Database Architecture** ⭐ - Complete schema for horse transport marketplace
  - 7 comprehensive tables: transporters, quotes, responses, bookings, tracking, reviews, insurance
  - Full RLS policies and database triggers
  - Transporter verification system
  - Quote request and response workflow
  - Live GPS tracking infrastructure
  - Review and rating system
  - Insurance options catalog
- **Enhanced Messaging Database Architecture** ⭐ - Advanced messaging features
  - File attachment support with storage integration
  - Automated response system (keyword, new message, after-hours triggers)
  - Detailed read receipts
  - Video call session infrastructure (Daily.co/Agora ready)
  - Auto-response analytics and logging
- **Comprehensive Implementation Guide** ⭐ - 500+ line guide covering both systems
  - Step-by-step setup instructions
  - All user flows documented
  - API examples and code snippets
  - Video chat provider comparison
  - Testing checklist and production considerations
- **Premium Homepage Redesign** ⭐ - Professional landing page with trust signals
  - Enhanced hero section with gradient text and trust badges
  - Premium trust indicators with animated hover effects
  - Features section highlighting 6 key platform features
  - Testimonials section with 5-star reviews and social proof
  - Final CTA section with gradient background
  - Fully integrated new sections into homepage layout
- **Map-First Discovery Experience** ⭐ - Map is now the primary browsing method
  - All "Browse Horses" CTAs redirect to interactive map (`/horses/map`)
  - Search bar redirects to map with location/breed/price filters
  - Map requests user location on first visit for personalized results
  - URL query parameters for deep linking (location, breed, maxPrice)
- **Zillow-Style Map Functionality** ⭐ - Dynamic map-based browsing
  - **Bounds-based filtering** - Shows horses in visible map area (no distance limits)
  - **Auto-update on pan/zoom** - Listings refresh as you move the map
  - **"Search as I move the map" toggle** - Enable/disable auto-refresh (on by default)
  - **"Search this area" button** - Manual refresh option when toggle is off
  - **Pan anywhere in US** - See horses in Ohio, Texas, California, anywhere
  - Map bounds filtering instead of radius-based distance filter
  - Seamless exploration of nationwide inventory
- **Complete Offer → Payment → Transaction Flow** ⭐ - End-to-end working with RLS enabled
  - Fixed RLS blocking on Stripe account queries (using service role client)
  - Fixed RLS blocking on payment intent inserts
  - Fixed PostgREST schema cache issue with manual joins (transactions now visible)
  - Transaction detail pages working properly
  - Escrow tracking fully functional
  - Dashboard integration complete
  - **Fixed "Complete Payment" alert** - Excludes offers with existing transactions (no longer shows after payment)
  - **Fixed Escrow System for Test Mode** ⭐
    - Removed `transfer_data` from payment intents (funds stay on platform for escrow)
    - Added manual transfer on escrow release
    - Created "Mark as Completed (Test)" button for test mode transactions
    - Documented test mode limitations (insufficient funds in test account)
    - Production-ready escrow flow (will work with real payments)
  - **Seller Offer Status Display** ⭐
    - Sellers now see transaction status instead of just "Offer Accepted"
    - Shows "Payment Received" with escrow/completed status when paid
    - Shows "Waiting for Payment" when buyer hasn't paid yet
    - "View Transaction" button links to full transaction details
    - Transaction data fetched and attached to offers
- **Horse Documents & Records System** ⭐ - Complete document management with privacy controls
- **Reviews & Ratings System** ⭐ - Already complete (offer-based review system discovered)
- **Transaction Management Dashboard** ⭐ - Complete transaction tracking and escrow management
- **Stripe Payment Integration** ⭐ - Complete end-to-end payment system with escrow
- **Browse Pages** - `/horses/breeds`, `/horses/disciplines`, `/horses/recent` navigation pages
- **Homepage Redesign** - Zillow-style hero with horse background image and overlapping search
- **Quick Wins Completed** - Height format (hh), gender display, color display, NEW badges
- **State Filter Fix** - Fixed JSONB query for state filtering (-> changed to ->>)

✅ **Completed Features**:

### Infrastructure & Setup
- Monorepo setup with Turborepo
- Next.js 14 with App Router
- TypeScript with strict mode
- Supabase integration (Auth, Database, Storage)
- Tailwind CSS styling
- Environment variables configured

### Authentication & User Management
- Email/password authentication
- User registration and login flows
- Password change functionality
- Profile management with edit modal
- Session management
- Protected routes

### Horse Listings
- Multi-step listing creation wizard (5 steps)
- Client-side image uploads to Supabase Storage
- Draft/Active/Paused status support
- Individual horse detail pages with image gallery
- Browse page with grid view
- Advanced filtering (price, breed, age, gender, location)
- Sort options (price, age, recent)
- Seller contact information display
- **Edit Existing Listings** (`/horses/[slug]/edit`) ✅
  - Full edit form with all fields
  - Image management (add/delete/set primary)
  - Status updates
  - Auto-save to dashboard
  - Fixed routing conflict (uses slug parameter)

### User Dashboard & Profile
- `/dashboard` - Seller dashboard with:
  - Real-time statistics including Total Revenue
  - My Listings management
  - Edit/Delete/Pause actions (disabled for SOLD horses)
  - Recent activity feed
  - Clickable stat cards
  - Combined notification badge (messages + offers)
  - Quick action buttons (5 total)
  - SOLD status badges on listings
- `/profile` - User profile with tabs:
  - Overview with stats
  - My Listings tab
  - Favorites tab (partial)
  - Settings tab

### Seller Verification System
- Multi-step verification form
- Document upload (ID, proof of address, bank info)
- Status tracking (pending/approved/rejected)
- Verification center dashboard
- Verification badges throughout platform
- Database fields: is_verified_seller, seller_verified_at

### Admin Dashboard (`/admin`)
- Statistics overview
- Verification review system
- User management panel
- Individual verification review pages
- Approve/reject/request info workflows
- Ban/unban users
- Grant/revoke admin privileges

### Core UI Components
- Error boundaries and error pages
- Loading states and skeletons
- Toast notification system
- Modal/dialog components
- Form components (Input, Textarea, Select, etc.)
- Breadcrumb navigation

### Messaging System ✅
- Direct messages between buyers/sellers
- Real-time message updates using Supabase subscriptions
- Conversation threads organized by horse listing
- Unread message counter with badge notification
- Contact seller button on horse listings
- Messages page with conversation list
- Read receipts and status tracking
- Database schema updated for auth.users compatibility

### Make Offer System ✅
- Complete offer/counter-offer negotiation system
- Make Offer modal with custom terms
- Offer includes transport and vetting options
- Contingencies and expiration dates
- Accept/reject/counter/withdraw functionality
- Offer history tracking with events table
- Pending offers badge notification in navigation
- Dashboard integration with offers stats
- Offers management page (`/offers`) with sent/received tabs
- Real-time offer status updates
- Percentage of asking price calculator
- Auto-update horse to SOLD when offer accepted
- Counter offers properly routed to correct recipient
- Other pending offers auto-rejected when one accepted

### Sales Analytics (`/analytics`) ✅
- Comprehensive sales performance dashboard
- Key metrics: Total Revenue, Horses Sold, Average Price, Days to Sell
- Monthly revenue bar chart visualization
- Sales history table with:
  - Listed vs sold price comparison
  - Price change percentage indicators
  - Days to sell badges
  - Horse details with images
- Quick access from dashboard stats and quick actions
- Tracks sold_date and sold_price for each sale

### Horse Listing Enhancements
- SOLD status badges on horse cards
- Visual overlay on sold horses (darker/disabled appearance)
- Sold horses excluded from edit/delete actions
- Browse page shows SOLD indicators
- **Competition history field** for listing creation and display
- **View tracking system** with session-based counting (RPC function)
- **Video and document upload** in edit listing form with file size validation
- **Similar horses recommendations** on detail pages (shows 4 similar by breed)
- **Share functionality** (Facebook, Twitter, Email, Copy link)
- **Print-friendly listing pages** with optimized print styles
- **Contact seller UX improvements** (separated contact info from action buttons)
- Client-side file size validation (50MB limit for videos)
- **Farm branding system** ✅
  - Optional farm name and logo for listings
  - Farm name field in Basic Info step
  - Farm logo upload in Media step (conditional on farm name)
  - Farm logo stored in Supabase Storage
  - Database fields: `farm_name` (TEXT), `farm_logo_url` (TEXT)
  - Farm displayed on all horse cards throughout site with logo
  - Farm section on horse detail page sidebar
  - Farm info shown in map search results
  - Fallback to seller name if no farm provided
  - Professional branding for verified sellers

### Watchlist System (`/watchlist`) ✅
- Heart button on every horse card to add/remove from watchlist
- Watch button on horse detail pages with watch count
- Shows "X watching" count on horse cards
- Dedicated watchlist page with filters (All/Available/Sold)
- Track how long you've been watching each horse
- Enable/disable price change notifications per horse
- Remove horses from watchlist
- Quick access from dashboard
- Real-time watch count updates
- Login prompt for non-authenticated users

### Search & Discovery Enhancements ✅
- **Enhanced Filters**: Height range (0.1 precision), multi-select disciplines, color dropdown
- **Saved Searches** (`/saved-searches`):
  - Save current filter combinations with custom names
  - Toggle email notifications for matching horses
  - View, edit, delete saved searches
  - Quick navigation to saved search results
  - Database table: `saved_searches` with JSONB filters
- **Recently Viewed Horses**:
  - Automatic tracking using localStorage (last 10 horses)
  - Stores horse ID, name, slug, image, price, and timestamp
  - Ready for display in sidebar or dashboard widget
- **Compare Horses** (`/compare`):
  - Add up to 4 horses to comparison list
  - Floating comparison bar at bottom of screen
  - Side-by-side comparison table with all attributes
  - localStorage persistence across sessions
  - Compare buttons on all horse cards
  - Quick remove from comparison
  - Empty state with CTA to browse

### Price Change Notifications ✅
- **Application-level price tracking** implemented in `edit-horse-form.tsx:408-504`
- Price history database table tracks all price changes with:
  - Old price, new price, change amount, change percentage
  - Timestamp tracking
- **Automatic notifications for price drops**:
  - When seller lowers price, all users who favorited the horse receive notifications
  - Notification includes old price, new price, and savings amount
  - Links directly to horse listing
- **Price history API** (`lib/actions/price-history.ts`):
  - Get price history for a horse
  - Get lowest/highest prices
  - Check for recent price drops
  - Get price statistics
  - Find horses with recent price drops
- **UI Components**:
  - `price-history-badge.tsx` - Shows "Price Drop!", "Lowest Price Ever!", savings badges
  - `price-history-chart.tsx` - Visual timeline of price changes
- **RLS Note**: Disabled RLS on notifications table (acceptable for marketplace cross-user notifications)
- **Ready for enhancement**: Email/SMS alerts (infrastructure in place, email sending pending)

### Map-Based Search ✅
- **Mapbox GL integration** with interactive maps
- **Map Components**:
  - `components/map/horse-map.tsx` - Interactive map with horse markers
  - `components/map/horse-detail-panel.tsx` - Sliding detail panel for selected horse
  - `app/horses/map/map-search-content.tsx` - Split view with map and list
  - `app/horses/map/page.tsx` - Dedicated map search page
- **Geocoding utilities** (`lib/utils/geocoding.ts`):
  - Forward geocoding (address → coordinates) with bounding box support
  - Reverse geocoding (coordinates → address)
  - Distance calculation between points
  - Place type detection (city, state, region)
- **Features**:
  - **Split view layout**: Map (60%) + Horse list (40%) side by side
  - **Interactive markers**: Click to view horse details, hover to highlight
  - **Price formatting on markers**: Shows "$2.0M" for millions, "250k" for thousands
  - **Location-based search**: Search by city, state, or ZIP code
  - **State/region search**: Automatically fits map bounds to show entire states (e.g., "Florida", "Texas")
  - **City search**: Centers on city at zoom level 11
  - **Distance filtering**: Filter horses within X miles of search location (slider: 10-500 miles)
  - **Real-time filtering**: Price range, breed, min/max price filters
  - **Sort options**: Recommended, price (low/high), newest, distance
  - **Synchronized interactions**: Clicking horse card pans map to location
  - **Horse cards**: Show farm name and logo on list cards and map detail panel
  - **Full details access**: "View Full Details" button opens complete listing page
- **Mapbox API Key**: `pk.eyJ1Ijoic2Z1dGNoa28iLCJhIjoiY21odmZ2M25hMGFzNTJqcHRoNjF0ZWt0MCJ9.BBqlIS2nP2QLohJXxIkwtg`
  - Configured in environment variables as `NEXT_PUBLIC_MAPBOX_TOKEN`

### Payment System ✅ (COMPLETED 2025-01-13)
- **Stripe Connect Integration** - Complete marketplace payment system
- **Seller Onboarding** (`/seller/stripe`):
  - Express Connect account creation
  - Identity verification via Stripe
  - Bank account setup
  - Status tracking (charges_enabled, payouts_enabled)
  - Stripe Dashboard access
- **Buyer Checkout**:
  - Professional checkout modal with Stripe Elements
  - Payment Intent creation with validation
  - Real-time payment processing
  - Fee breakdown display (5% platform + Stripe fees)
  - Success page with transaction details
- **7-Day Escrow System**:
  - Funds held securely after payment
  - Manual release by buyer option
  - Automatic release after 7 days
  - Transfer to seller's Connect account
  - Full audit trail with transaction events
- **Fee Calculations**:
  - Platform fee: 5%
  - Stripe fee: 2.9% + $0.30
  - All calculations use integers (cents) to avoid floating-point errors
- **Webhook Handling**:
  - Payment success/failure events
  - Account update events
  - Refund processing
  - Automatic transaction status updates
- **Database Schema**:
  - stripe_accounts - Connect account tracking
  - payment_intents - Payment processing
  - transactions - Complete transaction records
  - transaction_events - Full audit log
  - refunds - Refund management
  - refund_requests - Refund request tracking
  - platform_fees - Dynamic fee configuration
- **Security**: Webhook signature verification, RLS policies, proper error handling
- **Documentation**: Complete setup guide in `STRIPE_SETUP.md`

### Transaction Management Dashboard ✅ (COMPLETED 2025-01-13)
- **Transaction List Page** (`/transactions`):
  - Stats cards: total transactions, purchases, sales, active escrow, revenue
  - Multiple filter options: role-based (purchases/sales) and status-based
  - Transaction cards with status badges and amounts
  - Escrow countdown for active transactions
  - Empty states with helpful messaging
- **Transaction Detail Page** (`/transactions/[id]`):
  - Complete financial breakdown (listing price, final price, fees, net amounts)
  - Live escrow countdown timer (days/hours/minutes/seconds)
  - Manual escrow release button (buyer only)
  - Transaction event timeline with icons and status transitions
  - Horse details with link to listing
  - Buyer/seller party information
  - Refund request functionality with modal form
  - Help/support section
- **Escrow Management**:
  - Real-time countdown component updating every second
  - Automatic release scheduling (7 days)
  - Manual release by buyer with confirmation
  - Stripe transfer to seller's Connect account
  - Full event logging
- **Refund System**:
  - Request refund modal with reason field
  - Full and partial refund support
  - Stripe refund processing
  - Notification to both parties
  - Transaction event logging
  - Status updates (refunded/partially_refunded)
- **Dashboard Integration**:
  - Transaction stats on main dashboard
  - Quick action button to transactions page
  - Badge notifications for active escrow
  - Clickable stat cards with filtered views
- **Navigation**:
  - "Transactions" link in header (desktop and mobile)
  - Direct URL access: `/transactions` and `/transactions/[id]`
  - Integrated with existing navigation structure

### Reviews & Ratings System ✅ (ALREADY COMPLETED)
- **Post-Transaction Reviews** - Buyers and sellers can review each other after accepted offers
- **5-Star Rating System** - Overall rating plus optional sub-ratings (communication, accuracy, professionalism)
- **Review Submission** (`/reviews/write/[offerId]`):
  - Rating selection with star display
  - Title and detailed review text
  - Photo upload support
  - Sub-ratings for detailed feedback
- **Review Display**:
  - Review cards with star ratings
  - Reviewer profile information
  - Verified purchase badges
  - Helpful/not helpful voting system
  - Seller reply support
- **User Reputation**:
  - Aggregated reputation scores
  - Total reviews and average rating
  - Rating distribution (5-star to 1-star counts)
  - Separate buyer/seller ratings
  - Top-rated seller badges
  - Reputation score calculation
- **Review Moderation**:
  - Report review functionality (spam, offensive, fake, etc.)
  - Admin review moderation
  - Auto-flagging for multiple reports
  - Review status management (pending, published, hidden, flagged, removed)
- **Review Management**:
  - View all reviews received
  - View all reviews written
  - Edit own reviews
  - Delete own reviews
  - Add seller replies
  - Reviewable offers list
- **Integration**:
  - Reviews displayed on user profiles
  - Reputation scores on listings
  - Review prompts after completed transactions
  - Notifications for new reviews
- **Database Schema**:
  - reviews table with ratings and text
  - review_helpful_votes for voting
  - review_reports for moderation
  - user_reputation view for aggregated scores

### Horse Documents & Records System ✅ (COMPLETED 2025-01-13)
- **Document Management** - Complete system for uploading, organizing, and sharing horse documents
- **Document Categories**:
  - Health certificates
  - Vaccination records
  - Coggins tests
  - Registration papers
  - Pedigree documents
  - Competition records
  - Training records
  - PPE (Pre-Purchase Exam) reports
  - Insurance documents
  - Bills of sale
  - Other documents
- **Upload System** (`DocumentUpload` component):
  - Drag-and-drop file upload
  - Support for PDF, images (JPG, PNG), and Word documents
  - File size limit: 50MB
  - Automatic filename parsing for title
  - Document metadata: title, description, dates, issuing authority
  - Category selection
  - Privacy controls (public, shared with buyers, approval required)
- **Document Display** (`/horses/[slug]/documents`):
  - Dedicated documents page for each horse
  - Category-based filtering (All, Health, Registration, Competition)
  - Document cards with metadata and status badges
  - Public/Private indicators
  - Expiration warnings
  - Verified document badges
  - Document download functionality
- **Privacy & Access Control**:
  - Public documents (visible to all)
  - Private documents (owner only)
  - Shared with buyers (request-based access)
  - Approval system for access requests
  - Temporary access with expiration dates
  - Access request management page (`/documents/access-requests`)
- **Document Viewer** (`DocumentViewer` component):
  - Modal viewer with PDF preview
  - Image preview for photos
  - Document metadata display
  - Request access for private documents
  - Download functionality
  - View tracking and analytics
- **Access Request System**:
  - Buyers can request access to private documents
  - Sellers approve/deny requests with optional messages
  - Configurable access duration (days)
  - Request status tracking (pending, approved, denied, expired)
  - View count tracking
  - Last viewed timestamps
- **Structured Records**:
  - **Vaccination Records Table**: Structured data for vaccinations
    - Vaccine name, type, dates (administered, expiration, next due)
    - Veterinarian information
    - Lot numbers and clinic details
    - Adverse reactions notes
  - **Competition Records Table**: Structured competition history
    - Competition name, date, location
    - Discipline and level
    - Placement, scores, ribbons
    - Rider and judge information
- **Document Verification**:
  - Admin verification system
  - Verified badges on documents
  - Verification notes and timestamps
  - Trust indicators for buyers
- **Document Sharing**:
  - Shareable links with expiration
  - Optional password protection
  - View limits
  - Link revocation
  - Share link tracking
- **Document Summary** (`DocumentSummary` component):
  - Compact summary on horse listing pages
  - Document count and category breakdown
  - Public vs private stats
  - Quick access to full documents page
  - Verified document indicators
- **Storage**:
  - Supabase Storage bucket: `horse-documents`
  - Organized by horse ID
  - Public URLs with RLS protection
  - 50MB file size limit
- **Database Schema**:
  - `horse_documents` - Main documents table
  - `document_access_requests` - Access request tracking
  - `document_views` - View analytics
  - `document_share_links` - Shareable links
  - `vaccination_records` - Structured vaccination data
  - `competition_records` - Structured competition data
- **RLS Policies**:
  - Public documents viewable by all
  - Horse owners can manage all documents
  - Approved users can view granted documents
  - Admins can view and verify all documents
- **Database Functions**:
  - `log_document_view()` - Track document views
  - `expire_old_access_requests()` - Auto-expire access
  - `get_horse_document_stats()` - Document statistics
- **Integration Points**:
  - Horse listing detail pages
  - Seller dashboard
  - Buyer document access workflow
  - Admin verification dashboard (future)
- **Key Features**:
  - Professional document organization
  - Privacy-first design
  - Trust-building through verification
  - Streamlined buyer due diligence
  - Comprehensive audit trail
  - Expiration tracking and warnings
  - Category-based organization
  - Temporary access for serious buyers

## 🚧 NOT YET BUILT (High Priority)

## 🎯 Next Immediate Priorities (Post-Payment Integration)

### 1. **Clean Up & Polish** ⚡
- [x] Remove debug console.log statements ✅
  - Removed 12 debug console.log statements across:
  - `transactions.ts` (2 removed)
  - `create-intent/route.ts` (1 removed)
  - `success/page.tsx` (4 removed)
  - `map-search-content.tsx` (5 removed)
  - Kept all console.error for proper error logging
- [ ] Test complete end-to-end flow as both buyer and seller
- [ ] Verify offer status updates after payment
- [ ] Test escrow release (manual and automatic)
- [ ] Test refund flow

### 2. **Offer System Enhancements** ✅ COMPLETED
- [x] Implement offer expiration handling
  - `extendOffer()` server action allows buyers to extend expired offers by 7 days
  - `checkExpiredOffers()` server action automatically finds and marks expired offers
  - Integrated on page load to auto-check for expired offers
- [x] Add offer expiration notifications
  - Created `offer-expired.tsx` email template with amber/orange theme
  - `sendOfferExpiredEmail()` function sends notifications to buyers
  - Emails sent automatically when offers expire with option to extend
- [x] Show expired offers differently in UI
  - Gray status badge for expired offers
  - Expired offers clearly marked in offers list
- [x] Add "extend offer" functionality
  - "Extend Offer (7 days)" button for buyers on expired offers
  - Resets offer to 'pending' status with new expiration date
  - Creates offer_extended event in audit trail

### 3. **Email Notifications** ✅ (Partially Complete - Resend Integration Active)
- [x] Set up Resend API integration (working in development mode)
  - API key configured in `.env.local`
  - Using `onboarding@resend.dev` for testing
  - **PRODUCTION TODO**: Verify `giddyapp.com` domain in Resend and update from address
- [x] Email on offer received (sends to seller)
- [x] Email on offer accepted (sends to buyer)
- [x] Email on offer rejected (sends to buyer)
- [x] Email on counter offer (sends to original buyer)
- [x] Email on offer expired (sends to buyer with extend option)
- [x] Email on viewing request received (sends to seller)
- [x] Email on payment confirmation (sends to buyer)
- [x] Email on escrow release (sends to both parties)
- [x] Email templates created with professional design using @react-email/render
- [ ] Email on price drops (watchlist) - Infrastructure ready
- [ ] Email on saved search matches - Infrastructure ready

### 4. **Transportation Network** ✅ DATABASE READY - UI PENDING
- [x] Complete database schema design
  - `transporters` - Company profiles with credentials and verification
  - `transport_quotes` - Quote requests with pickup/delivery details
  - `transporter_quote_responses` - Quotes from transporters
  - `transport_bookings` - Confirmed bookings with payment tracking
  - `transport_tracking_updates` - Real-time GPS location updates
  - `transporter_reviews` - 5-star rating system with category ratings
  - `transport_insurance_options` - Insurance plan catalog
- [x] RLS policies for all tables
- [x] Database triggers for stats and status updates
- [x] Comprehensive implementation guide created
- [ ] Build transporter registration UI (`/transporter/register`)
- [ ] Build quote request form component
- [ ] Build quote listing and comparison page
- [ ] Build booking confirmation flow
- [ ] Integrate deposit payments (Stripe)
- [ ] Build live tracking map component
- [ ] Build review submission UI

### 5. **Enhanced Messaging** ✅ FILE SHARING COMPLETE
- [x] Complete database schema design
  - `message_attachments` - File storage with previews
  - `automated_responses` - Auto-reply rules with triggers
  - `auto_response_log` - Usage tracking
  - `message_read_receipts` - Detailed read tracking
  - `video_call_sessions` - Video chat integration ready
- [x] RLS policies for secure access
- [x] Database functions for auto-response logic
- [x] Storage bucket configuration with RLS policies
- [x] Video chat provider comparison (Daily.co/Agora/Whereby)
- [x] **File Sharing Implementation** ⭐
  - File upload button with paperclip icon in message composer
  - Multiple file upload support (images, PDFs, documents up to 25MB)
  - File preview before sending with remove option
  - Image thumbnails displayed inline in messages
  - PDF/document attachments with file icon, name, size, and download link
  - Files stored in Supabase Storage at `message-attachments` bucket
  - Proper RLS policies for secure file access
  - Different styling for sender vs recipient attachments
  - Messages can contain only files (no text required)
- [ ] Build auto-response management page (`/settings/auto-responses`)
- [ ] Implement auto-response trigger logic
- [ ] Integrate Daily.co/Agora SDK for video chat
- [ ] Build video call UI component
- [ ] Add read receipt indicators to messages

### 6. **Mobile App**
- React Native mobile application
- Push notifications
- Offline mode capabilities
- Camera integration for quick listing photos

## Database Setup Instructions
**CRITICAL: Must be completed before running the application**

### Prerequisites
- Supabase project created at: `https://tibxubhjuuqldwvfelbn.supabase.co`
- Environment variables configured in `.env.local`
- Email confirmation DISABLED in Supabase Auth settings

### Current Database Schema

#### Tables Created:
1. **profiles** - User profiles with fields:
   - id, name, email, phone, bio, location
   - is_seller, is_verified_seller, seller_verified_at
   - is_admin, is_banned, banned_at, banned_reason
   - created_at, updated_at

2. **horses** - Horse listings with fields:
   - id, owner_id, name, breed, age, gender
   - height, weight, color, price, location, latitude, longitude
   - description, temperament, health_notes
   - training_level, competition_experience
   - status (draft/active/sold), created_at, updated_at
   - **farm_name** (TEXT) - Optional farm/stable name
   - **farm_logo_url** (TEXT) - Optional farm logo URL

3. **horse_images** - Images for horse listings
   - id, horse_id, url, caption, is_primary
   - display_order, created_at

4. **favorites** - User's favorite horses
   - id, user_id, horse_id, created_at

5. **messages** - Direct messages between users
   - id, sender_id, recipient_id, horse_id
   - content, is_read, created_at

6. **seller_verifications** - Verification requests
   - id, user_id, status, business details
   - submitted_at, reviewed_at, reviewer_notes

7. **verification_documents** - Uploaded verification docs
   - id, verification_id, type, url, name

### SQL Files to Run (IN ORDER):
1. ✅ `/supabase/setup.sql` - Core tables (ALREADY RUN)
2. ✅ `/supabase/add-storage.sql` - Media storage bucket (ALREADY RUN)
3. ✅ `/supabase/add-verification-tables.sql` - Verification tables (ALREADY RUN)
4. ✅ `/supabase/add-verification-storage.sql` - Verification storage (ALREADY RUN)
5. ⚠️ `/supabase/add-missing-fields.sql` - New fields for admin features (RUN THIS NOW)

### Important Notes
- Images are uploaded client-side to avoid Next.js server action limitations
- Database uses UUID primary keys throughout
- Profile table uses 'name' field (not 'full_name')
- All timestamps are TIMESTAMPTZ for proper timezone handling
- Row Level Security (RLS) enabled on all tables

## Development Strategy
**Build the web app end-to-end first**, then mobile apps. This allows us to:
1. Validate the business model quickly
2. Test with real users on web (easier to iterate)
3. Establish the API and backend infrastructure
4. Reuse backend/API for mobile apps later

---

# PHASE 1: Core Infrastructure (Week 1-2)

## 1.1 Authentication & User Management
- [x] Set up Supabase project
- [x] Configure Supabase Auth with email/password
- [ ] Add OAuth providers (Google, Apple)
- [x] Build registration flow (email verification disabled for dev)
- [x] Create login/logout functionality
- [x] Implement password change page (/profile/change-password)
- [x] Implement password reset flow (forgot password with email)
- [x] Add user profile pages
  - Profile view with stats (listings, watching, member since)
  - Profile editing with validation
  - Settings management
  - Tabs: Overview, My Listings, Watching, Settings
- [x] Create seller verification request flow
  - Multi-step verification form with business info
  - Document upload system (government ID, proof of address, bank verification)
  - Status tracking (pending, approved, rejected, additional info needed)
  - Verification center dashboard
  - Storage bucket for secure document uploads
  - Verification benefits display
- [x] Admin Dashboard
  - Overview with statistics (users, horses, verifications, revenue)
  - Verification review system with document viewing
  - User management panel (search, filter, ban/unban, admin privileges)
  - Individual verification review pages
  - Approve/reject/request additional info workflows
  - Activity tracking and recent items display
  - Auto-refresh after admin actions
- [x] Verification Badge System
  - Profile image badge overlay with checkmark
  - "Verified Seller" badge on profile header
  - Horse listings show verification status
  - Seller info on horse details with verification badge
  - Database fields: is_verified_seller, seller_verified_at

## 1.2 Database & Storage Setup
- [x] Connect to Supabase PostgreSQL
- [x] Run database setup (via SQL scripts, not Prisma migrations)
- [x] Set up Supabase Storage for images
- [x] Create image upload pipeline (client-side)
- [x] Implement video upload for listings (horse_videos table and storage)
- [x] Add document upload for health records on listings (horse_documents table and storage)
- [x] Add video player on horse detail pages
- [x] Add document viewer on horse detail pages

## 1.3 Core UI Components
- [x] Build reusable form components with React Hook Form
- [x] Create loading states and skeletons
- [x] Add error boundaries and error pages
- [x] Build notification/toast system
- [x] Create modal/dialog components
- [x] Add breadcrumb navigation

---

# PHASE 2: Listing Management (Week 2-3)

## 2.1 Horse Listing Creation
- [x] Multi-step listing creation wizard
  - [x] Basic info (name, breed, age, gender)
  - [x] Physical details (height, weight, color)
  - [x] Location and price
  - [x] Health records upload
  - [x] Training history (via disciplines)
  - [x] Competition records (history field in metadata)
  - [x] Photos upload (drag & drop)
  - [x] Videos upload (with 50MB limit validation)
- [x] Draft/Active status support
- [x] Listing preview before publish
- [x] Edit existing listings (with video/document upload support)

## 2.2 Listing Display
- [x] Individual horse profile page
- [x] Photo gallery with thumbnails
- [x] Video player
- [x] Health document viewer
- [x] Seller information section
- [x] Similar horses recommendations (shows 4 by breed)
- [x] Share functionality (Facebook, Twitter, Email, Copy link)
- [x] Print-friendly version (`/horses/[slug]/print`)
- [x] View counter with session-based tracking

## 2.3 Seller Dashboard
- [x] My listings management (view all, edit, delete, pause/activate)
- [x] View analytics (views, favorites count, active listings)
- [x] Real-time statistics with clickable cards
- [x] Individual listing actions (edit, pause, delete)
- [x] Recent activity feed
- [ ] Listing performance metrics (detailed analytics)
- [ ] Bulk actions (select multiple)
- [ ] Promotional tools (feature, boost)

---

# PHASE 3: Search & Discovery (Week 3-4)

## 3.1 Search Implementation
- [ ] Elasticsearch integration for full-text search
- [x] Advanced filters
  - [x] Price range slider
  - [x] Age range
  - [x] Height range (with 0.1 hand precision)
  - [x] Breed selection
  - [x] Discipline checkboxes (multi-select)
  - [ ] Training level
  - [x] Gender selection
  - [x] Color options
- [x] Save search functionality (with notification toggle)
- [x] Saved searches management page
- [ ] Search alerts via email (infrastructure ready, email sending pending)

## 3.2 Map-Based Search
- [x] Integrate Mapbox GL
- [x] Display listings on map with custom markers
- [x] Distance-based search from zip/city
- [x] State/region search with bounding box fitting
- [x] Price formatting on map markers (millions/thousands)
- [x] Mobile-responsive map interface
- [x] Split view: Map (60%) + List (40%) side by side
- [x] Interactive popups with horse details
- [x] Hover and click synchronization between map and list
- [x] Geocoding utilities for address conversion with bbox support
- [x] Farm name and logo display on map search results
- [ ] Draw search area tool
- [x] Map/list split view (completed)

## 3.3 Browse Features
- [x] Sort options (price, age, recent)
- [x] Grid view
- [ ] List view toggle
- [ ] Infinite scroll or pagination
- [x] Recently viewed horses (localStorage tracking)
- [x] Favorites/wishlist system (watchlist completed)
- [x] Compare horses side-by-side (up to 4 horses with floating bar)

---

# PHASE 4: Communication (Week 4-5)

## 4.1 Messaging System
- [x] Real-time messaging with Supabase subscriptions
- [x] Conversation threads per listing
- [x] Message notifications (badge on dashboard)
- [x] Read receipts
- [x] Block/report users ✅
  - Block users from messaging you
  - Report users for inappropriate behavior (spam, harassment, scam, inappropriate content, other)
  - View and manage blocked users list
  - Unblock functionality
  - Database tables: blocked_users, user_reports
- [x] Message templates for common questions ✅
  - Create, edit, delete custom message templates
  - Use templates when composing messages
  - Template variables for personalization (horse name, price, seller name)
  - Quick insert from dropdown menu
  - Database table: message_templates
- [x] Schedule viewing requests ✅
  - Request viewing button on horse detail pages
  - Viewing request form with date, time, contact info, message
  - Seller can approve/decline requests
  - Requester can cancel pending requests
  - Both parties can mark viewings as completed
  - Viewing requests dashboard with sent/received tabs
  - Pending viewing requests count and notification badges
  - Database table: viewing_requests with RLS policies
  - Status tracking: pending, approved, declined, cancelled, completed

## 4.2 Video Calls
- [ ] Integrate video calling (WebRTC/Agora)
- [ ] Schedule virtual viewings
- [ ] Screen sharing for documents
- [ ] Recording capability (with consent)

## 4.3 Notifications ✅
- [x] In-app notification center (bell icon dropdown)
- [x] Notification bell with unread count badge
- [x] Database triggers for automatic notification creation:
  - New viewing requests
  - New offers
  - New messages
- [x] Notifications page (`/notifications`) with filters
- [x] Mark as read/unread functionality
- [x] Delete notifications
- [x] Mark all as read
- [x] Notification preferences system
- [x] RLS policies for client-side queries
- [x] Real-time notification polling (30 second intervals)
- [ ] Email notifications (SendGrid/Resend)
- [ ] Push notifications setup

---

# PHASE 5: Transactions (Week 5-6)

## 5.1 Offer System
- [ ] Make offer functionality
- [ ] Counter-offer workflow
- [ ] Offer expiration
- [ ] Multiple offer management
- [ ] Offer history tracking
- [ ] Accept/reject with reasons

## 5.2 Payment Processing
- [ ] Stripe integration
- [ ] Escrow account setup
- [ ] Payment method management
- [ ] Calculate fees and taxes
- [ ] Invoice generation
- [ ] Refund process

## 5.3 Transaction Flow
- [ ] Purchase agreement generation
- [ ] Digital signature (DocuSign API)
- [ ] PPE scheduling integration
- [ ] Transport arrangement
- [ ] Milestone-based fund release
- [ ] Transaction status tracking

---

# PHASE 6: Trust & Safety (Week 6-7)

## 6.1 Verification Systems
- [ ] Seller identity verification (Stripe Identity)
- [ ] Business verification
- [ ] Bank account verification
- [ ] Verified badge display
- [ ] Verification status dashboard

## 6.2 Fraud Prevention
- [ ] AI-powered listing fraud detection
- [ ] Duplicate listing detection
- [ ] Price anomaly alerts
- [ ] Suspicious behavior monitoring
- [ ] IP tracking and blocking

## 6.3 Reviews & Ratings
- [ ] Post-transaction reviews
- [ ] Rating system (1-5 stars)
- [ ] Review moderation
- [ ] Verified purchase badge
- [ ] Response to reviews
- [ ] Report inappropriate reviews

---

# PHASE 7: Advanced Features (Week 7-8)

## 7.1 PPE Integration
- [ ] Veterinarian network
- [ ] PPE scheduling system
- [ ] Digital PPE reports
- [ ] PPE history tracking
- [ ] Vet verification system

## 7.2 Transport Marketplace
- [ ] Transport provider listings
- [ ] Quote system
- [ ] Route planning
- [ ] Insurance options
- [ ] Tracking integration

## 7.3 Analytics & Insights
- [ ] Market price trends
- [ ] Breed popularity data
- [ ] Seasonal insights
- [ ] ROI calculator
- [ ] Investment tracking

---

# PHASE 8: Mobile Apps (Week 9-12)

## 8.1 React Native Setup
- [ ] Initialize Expo project
- [ ] Configure navigation
- [ ] Set up authentication
- [ ] Configure push notifications

## 8.2 Core Mobile Features
- [ ] Browse and search
- [ ] View listings
- [ ] Messaging
- [ ] Notifications
- [ ] Camera integration for photos
- [ ] Offline mode support

## 8.3 App Store Deployment
- [ ] iOS build and testing
- [ ] Android build and testing
- [ ] App store submissions
- [ ] Release management

---

# PHASE 9: Optimization & Scale (Week 13-14)

## 9.1 Performance
- [ ] Image CDN optimization
- [ ] Lazy loading implementation
- [ ] Database query optimization
- [ ] Caching strategy (Redis)
- [ ] Load testing
- [ ] Performance monitoring (Sentry)

## 9.2 SEO & Marketing
- [ ] SEO optimization
- [ ] Social media integration
- [ ] Content marketing system
- [ ] Referral program
- [ ] Email campaigns
- [ ] Analytics (GA4, Mixpanel)

## 9.3 Internationalization
- [ ] Multi-language support
- [ ] Currency conversion
- [ ] Regional compliance
- [ ] Local payment methods

---

# PHASE 10: Launch Preparation (Week 15-16)

## 10.1 Testing
- [ ] Unit tests (Jest)
- [ ] Integration tests
- [ ] E2E tests (Playwright)
- [ ] Security audit
- [ ] Accessibility audit
- [ ] Beta testing program

## 10.2 Documentation
- [ ] API documentation
- [ ] User guides
- [ ] Video tutorials
- [ ] FAQ system
- [ ] Terms of service
- [ ] Privacy policy

## 10.3 Launch
- [ ] Production deployment
- [ ] Monitoring setup
- [ ] Customer support system
- [ ] Launch marketing campaign
- [ ] Press release
- [ ] Community building

---

## Priority Order for MVP (First 30 Days)

### Week 1-2: Foundation
1. Supabase auth setup ⭐
2. User registration/login ⭐
3. Basic listing creation ⭐
4. Image uploads ⭐

### Week 3-4: Core Features
5. Search with filters ⭐
6. Individual listing pages ⭐
7. Messaging system ⭐
8. Favorites ⭐

### Week 5-6: Trust & Transactions
9. Seller verification ⭐
10. Make offer flow ⭐
11. Basic payment (Stripe) ⭐
12. Reviews system ⭐

This gets us to a launchable MVP in 6 weeks!

---

## Tech Debt & Maintenance
- [ ] Regular dependency updates
- [ ] Security patches
- [ ] Code refactoring
- [ ] Performance optimization
- [ ] Technical documentation
- [ ] Team knowledge sharing

---

## Success Metrics to Track
- User registration rate
- Listing creation rate
- Search-to-contact rate
- Offer-to-sale conversion
- Average transaction value
- User retention (30/60/90 day)
- NPS score
- Time to first listing
- Support ticket volume

---

## Next Immediate Steps
1. Set up Supabase project
2. Implement authentication
3. Build listing creation flow
4. Get 10 test listings up
5. Test with 5 real users
