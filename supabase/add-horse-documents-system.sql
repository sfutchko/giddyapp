-- Horse Documents & Records System
-- Run this SQL in Supabase SQL Editor

-- Create document categories enum type
CREATE TYPE document_category AS ENUM (
  'health_certificate',
  'vaccination_record',
  'coggins_test',
  'registration_papers',
  'pedigree',
  'competition_record',
  'training_record',
  'ppe_report',
  'insurance',
  'bill_of_sale',
  'other'
);

-- Create horse documents table
CREATE TABLE IF NOT EXISTS horse_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    horse_id UUID REFERENCES horses(id) ON DELETE CASCADE NOT NULL,
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

    -- Document info
    category document_category NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL, -- in bytes
    file_type TEXT NOT NULL, -- mime type

    -- Document metadata
    document_date DATE, -- date the document was issued/created
    expiration_date DATE, -- for certificates that expire
    issuing_authority TEXT, -- vet, organization, etc.

    -- Sharing and privacy
    is_public BOOLEAN DEFAULT false, -- visible to all buyers
    is_shared_with_buyers BOOLEAN DEFAULT false, -- shared only with serious buyers
    requires_approval BOOLEAN DEFAULT true, -- seller must approve view requests

    -- Verification
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    verification_notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create document access requests table
CREATE TABLE IF NOT EXISTS document_access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES horse_documents(id) ON DELETE CASCADE NOT NULL,
    requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    horse_id UUID REFERENCES horses(id) ON DELETE CASCADE NOT NULL,

    -- Request details
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired')),

    -- Access control
    access_granted_until TIMESTAMPTZ, -- temporary access expiration
    view_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMPTZ,

    -- Response
    responded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    responded_at TIMESTAMPTZ,
    response_message TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_document_requester UNIQUE (document_id, requester_id)
);

-- Create document views tracking table
CREATE TABLE IF NOT EXISTS document_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES horse_documents(id) ON DELETE CASCADE NOT NULL,
    viewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    horse_id UUID REFERENCES horses(id) ON DELETE CASCADE NOT NULL,

    -- View metadata
    ip_address INET,
    user_agent TEXT,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),

    -- Session tracking
    session_id TEXT,
    duration_seconds INTEGER -- how long document was viewed
);

-- Create document sharing links table (for temporary public access)
CREATE TABLE IF NOT EXISTS document_share_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES horse_documents(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

    -- Link details
    share_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    max_views INTEGER, -- optional view limit
    current_views INTEGER DEFAULT 0,

    -- Optional password protection
    password_hash TEXT,

    -- Status
    is_active BOOLEAN DEFAULT true,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_expiration CHECK (expires_at > created_at)
);

-- Create vaccination records table (specific structured data)
CREATE TABLE IF NOT EXISTS vaccination_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    horse_id UUID REFERENCES horses(id) ON DELETE CASCADE NOT NULL,
    document_id UUID REFERENCES horse_documents(id) ON DELETE SET NULL,

    -- Vaccination details
    vaccine_name TEXT NOT NULL,
    vaccine_type TEXT, -- EWT, Rabies, West Nile, etc.
    administered_date DATE NOT NULL,
    expiration_date DATE,
    next_due_date DATE,

    -- Administration details
    veterinarian_name TEXT,
    veterinarian_license TEXT,
    clinic_name TEXT,
    lot_number TEXT,

    -- Notes
    notes TEXT,
    adverse_reactions TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create competition records table (specific structured data)
CREATE TABLE IF NOT EXISTS competition_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    horse_id UUID REFERENCES horses(id) ON DELETE CASCADE NOT NULL,
    document_id UUID REFERENCES horse_documents(id) ON DELETE SET NULL,

    -- Competition details
    competition_name TEXT NOT NULL,
    competition_date DATE NOT NULL,
    location TEXT,
    discipline TEXT, -- Dressage, Jumping, Western, etc.
    level TEXT, -- Beginner, Intermediate, Advanced, etc.

    -- Results
    placement INTEGER, -- 1st, 2nd, 3rd, etc.
    total_entries INTEGER,
    score TEXT,
    ribbon TEXT, -- Blue, Red, Yellow, etc.

    -- Additional info
    rider_name TEXT,
    judge_name TEXT,
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_horse_documents_horse ON horse_documents(horse_id);
CREATE INDEX IF NOT EXISTS idx_horse_documents_category ON horse_documents(category);
CREATE INDEX IF NOT EXISTS idx_horse_documents_uploaded_by ON horse_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_horse_documents_is_public ON horse_documents(is_public);
CREATE INDEX IF NOT EXISTS idx_horse_documents_created_at ON horse_documents(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_document_access_requests_document ON document_access_requests(document_id);
CREATE INDEX IF NOT EXISTS idx_document_access_requests_requester ON document_access_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_document_access_requests_status ON document_access_requests(status);
CREATE INDEX IF NOT EXISTS idx_document_access_requests_horse ON document_access_requests(horse_id);

CREATE INDEX IF NOT EXISTS idx_document_views_document ON document_views(document_id);
CREATE INDEX IF NOT EXISTS idx_document_views_viewer ON document_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_document_views_viewed_at ON document_views(viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_document_share_links_token ON document_share_links(share_token);
CREATE INDEX IF NOT EXISTS idx_document_share_links_document ON document_share_links(document_id);
CREATE INDEX IF NOT EXISTS idx_document_share_links_expires_at ON document_share_links(expires_at);

CREATE INDEX IF NOT EXISTS idx_vaccination_records_horse ON vaccination_records(horse_id);
CREATE INDEX IF NOT EXISTS idx_vaccination_records_next_due ON vaccination_records(next_due_date);

CREATE INDEX IF NOT EXISTS idx_competition_records_horse ON competition_records(horse_id);
CREATE INDEX IF NOT EXISTS idx_competition_records_date ON competition_records(competition_date DESC);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_horse_documents_updated_at BEFORE UPDATE ON horse_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_access_requests_updated_at BEFORE UPDATE ON document_access_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vaccination_records_updated_at BEFORE UPDATE ON vaccination_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competition_records_updated_at BEFORE UPDATE ON competition_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE horse_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccination_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for horse_documents

-- Anyone can view public documents
CREATE POLICY "Public documents are viewable by everyone"
    ON horse_documents FOR SELECT
    USING (is_public = true);

-- Horse owner can view all documents for their horses
CREATE POLICY "Horse owners can view their horse documents"
    ON horse_documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM horses
            WHERE horses.id = horse_documents.horse_id
            AND horses.seller_id = auth.uid()
        )
    );

-- Users with approved access can view documents
CREATE POLICY "Users with approved access can view documents"
    ON horse_documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM document_access_requests
            WHERE document_access_requests.document_id = horse_documents.id
            AND document_access_requests.requester_id = auth.uid()
            AND document_access_requests.status = 'approved'
            AND (
                document_access_requests.access_granted_until IS NULL
                OR document_access_requests.access_granted_until > NOW()
            )
        )
    );

-- Horse owners can create documents for their horses
CREATE POLICY "Horse owners can create documents for their horses"
    ON horse_documents FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM horses
            WHERE horses.id = horse_documents.horse_id
            AND horses.seller_id = auth.uid()
        )
    );

-- Horse owners can update their horse documents
CREATE POLICY "Horse owners can update their horse documents"
    ON horse_documents FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM horses
            WHERE horses.id = horse_documents.horse_id
            AND horses.seller_id = auth.uid()
        )
    );

-- Horse owners can delete their horse documents
CREATE POLICY "Horse owners can delete their horse documents"
    ON horse_documents FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM horses
            WHERE horses.id = horse_documents.horse_id
            AND horses.seller_id = auth.uid()
        )
    );

-- Admins can view all documents
CREATE POLICY "Admins can view all documents"
    ON horse_documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );

-- Admins can verify documents
CREATE POLICY "Admins can update documents for verification"
    ON horse_documents FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );

-- RLS Policies for document_access_requests

-- Users can view their own access requests
CREATE POLICY "Users can view their own access requests"
    ON document_access_requests FOR SELECT
    USING (auth.uid() = requester_id);

-- Horse owners can view access requests for their horses
CREATE POLICY "Horse owners can view access requests for their horses"
    ON document_access_requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM horses
            WHERE horses.id = document_access_requests.horse_id
            AND horses.seller_id = auth.uid()
        )
    );

-- Users can create access requests
CREATE POLICY "Users can create access requests"
    ON document_access_requests FOR INSERT
    WITH CHECK (auth.uid() = requester_id);

-- Horse owners can update access requests for their horses
CREATE POLICY "Horse owners can update access requests"
    ON document_access_requests FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM horses
            WHERE horses.id = document_access_requests.horse_id
            AND horses.seller_id = auth.uid()
        )
    );

-- RLS Policies for document_views

-- Users can view their own view history
CREATE POLICY "Users can view their own view history"
    ON document_views FOR SELECT
    USING (auth.uid() = viewer_id);

-- Horse owners can view document views for their horses
CREATE POLICY "Horse owners can view document views for their horses"
    ON document_views FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM horses
            WHERE horses.id = document_views.horse_id
            AND horses.seller_id = auth.uid()
        )
    );

-- Anyone can create view records (for tracking)
CREATE POLICY "Anyone can create view records"
    ON document_views FOR INSERT
    WITH CHECK (true);

-- RLS Policies for document_share_links

-- Document owner can view share links
CREATE POLICY "Document owners can view share links"
    ON document_share_links FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM horse_documents
            JOIN horses ON horses.id = horse_documents.horse_id
            WHERE horse_documents.id = document_share_links.document_id
            AND horses.seller_id = auth.uid()
        )
    );

-- Document owner can create share links
CREATE POLICY "Document owners can create share links"
    ON document_share_links FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM horse_documents
            JOIN horses ON horses.id = horse_documents.horse_id
            WHERE horse_documents.id = document_share_links.document_id
            AND horses.seller_id = auth.uid()
        )
    );

-- Document owner can update share links
CREATE POLICY "Document owners can update share links"
    ON document_share_links FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM horse_documents
            JOIN horses ON horses.id = horse_documents.horse_id
            WHERE horse_documents.id = document_share_links.document_id
            AND horses.seller_id = auth.uid()
        )
    );

-- RLS Policies for vaccination_records

-- Public if linked to public document
CREATE POLICY "Vaccination records viewable if document is public"
    ON vaccination_records FOR SELECT
    USING (
        document_id IS NULL
        OR EXISTS (
            SELECT 1 FROM horse_documents
            WHERE horse_documents.id = vaccination_records.document_id
            AND horse_documents.is_public = true
        )
    );

-- Horse owner can view all vaccination records
CREATE POLICY "Horse owners can view vaccination records"
    ON vaccination_records FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM horses
            WHERE horses.id = vaccination_records.horse_id
            AND horses.seller_id = auth.uid()
        )
    );

-- Horse owner can create vaccination records
CREATE POLICY "Horse owners can create vaccination records"
    ON vaccination_records FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM horses
            WHERE horses.id = vaccination_records.horse_id
            AND horses.seller_id = auth.uid()
        )
    );

-- Horse owner can update vaccination records
CREATE POLICY "Horse owners can update vaccination records"
    ON vaccination_records FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM horses
            WHERE horses.id = vaccination_records.horse_id
            AND horses.seller_id = auth.uid()
        )
    );

-- Horse owner can delete vaccination records
CREATE POLICY "Horse owners can delete vaccination records"
    ON vaccination_records FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM horses
            WHERE horses.id = vaccination_records.horse_id
            AND horses.seller_id = auth.uid()
        )
    );

-- RLS Policies for competition_records

-- Public if linked to public document
CREATE POLICY "Competition records viewable if document is public"
    ON competition_records FOR SELECT
    USING (
        document_id IS NULL
        OR EXISTS (
            SELECT 1 FROM horse_documents
            WHERE horse_documents.id = competition_records.document_id
            AND horse_documents.is_public = true
        )
    );

-- Horse owner can view all competition records
CREATE POLICY "Horse owners can view competition records"
    ON competition_records FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM horses
            WHERE horses.id = competition_records.horse_id
            AND horses.seller_id = auth.uid()
        )
    );

-- Horse owner can create competition records
CREATE POLICY "Horse owners can create competition records"
    ON competition_records FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM horses
            WHERE horses.id = competition_records.horse_id
            AND horses.seller_id = auth.uid()
        )
    );

-- Horse owner can update competition records
CREATE POLICY "Horse owners can update competition records"
    ON competition_records FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM horses
            WHERE horses.id = competition_records.horse_id
            AND horses.seller_id = auth.uid()
        )
    );

-- Horse owner can delete competition records
CREATE POLICY "Horse owners can delete competition records"
    ON competition_records FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM horses
            WHERE horses.id = competition_records.horse_id
            AND horses.seller_id = auth.uid()
        )
    );

-- Function to automatically track document views
CREATE OR REPLACE FUNCTION log_document_view(
    p_document_id UUID,
    p_viewer_id UUID,
    p_session_id TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO document_views (document_id, viewer_id, horse_id, session_id)
    SELECT
        p_document_id,
        p_viewer_id,
        horse_documents.horse_id,
        p_session_id
    FROM horse_documents
    WHERE horse_documents.id = p_document_id;

    -- Update access request view count if applicable
    UPDATE document_access_requests
    SET
        view_count = view_count + 1,
        last_viewed_at = NOW()
    WHERE document_id = p_document_id
    AND requester_id = p_viewer_id
    AND status = 'approved';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expire old access requests
CREATE OR REPLACE FUNCTION expire_old_access_requests()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE document_access_requests
    SET status = 'expired'
    WHERE status = 'approved'
    AND access_granted_until IS NOT NULL
    AND access_granted_until < NOW();

    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get document stats for a horse
CREATE OR REPLACE FUNCTION get_horse_document_stats(p_horse_id UUID)
RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT json_build_object(
            'total_documents', COUNT(*),
            'public_documents', COUNT(*) FILTER (WHERE is_public = true),
            'categories', json_object_agg(
                category,
                COUNT(*)
            )
        )
        FROM horse_documents
        WHERE horse_id = p_horse_id
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE horse_documents IS 'Documents and records for horses including health certificates, registration papers, etc.';
COMMENT ON TABLE document_access_requests IS 'Requests from buyers to access private horse documents';
COMMENT ON TABLE document_views IS 'Tracking who viewed which documents and when';
COMMENT ON TABLE document_share_links IS 'Temporary shareable links for documents';
COMMENT ON TABLE vaccination_records IS 'Structured vaccination history for horses';
COMMENT ON TABLE competition_records IS 'Structured competition history and achievements';
