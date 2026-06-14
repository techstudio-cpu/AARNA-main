-- Migration: Client Management & Quotation Versioning
-- Created: 2026-04-15

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    alternate_phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    company_name VARCHAR(255),
    gst_number VARCHAR(20),
    customer_type VARCHAR(20) DEFAULT 'residential', -- residential, commercial, industrial
    source VARCHAR(50), -- referral, walk-in, website, social_media, etc.
    notes TEXT,
    tags TEXT[], -- array of tags
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    is_active BOOLEAN DEFAULT true
);

-- Create index on client code
CREATE INDEX IF NOT EXISTS idx_clients_code ON clients(client_code);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(customer_type);

-- Quotation Versions table (for tracking revisions)
CREATE TABLE IF NOT EXISTS quotation_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    version_label VARCHAR(50), -- e.g., "Draft", "Final", "Revision 1"
    data JSONB NOT NULL, -- Full quotation data snapshot
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    change_summary TEXT, -- Brief description of changes
    is_major_revision BOOLEAN DEFAULT false,
    UNIQUE(quotation_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_quotation_versions_quotation_id ON quotation_versions(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_versions_number ON quotation_versions(version_number);

-- Client-Quotation linking table (many-to-many)
CREATE TABLE IF NOT EXISTS client_quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    relationship_type VARCHAR(20) DEFAULT 'primary', -- primary, secondary, reference
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(client_id, quotation_id)
);

CREATE INDEX IF NOT EXISTS idx_client_quotations_client ON client_quotations(client_id);
CREATE INDEX IF NOT EXISTS idx_client_quotations_quotation ON client_quotations(quotation_id);

-- Quotation Approval Tracking
CREATE TABLE IF NOT EXISTS quotation_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    version_id UUID REFERENCES quotation_versions(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, rejected, revision_requested
    approved_by UUID, -- client user if they have login, or admin
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    revision_notes TEXT,
    client_signature TEXT, -- base64 signature or URL
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quotation_approvals_quotation ON quotation_approvals(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_approvals_status ON quotation_approvals(status);

-- Client Interactions/Activity log
CREATE TABLE IF NOT EXISTS client_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- call, email, meeting, quotation_sent, etc.
    description TEXT,
    performed_by UUID,
    quotation_id UUID REFERENCES quotations(id),
    follow_up_date DATE,
    follow_up_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_client_activities_client ON client_activities(client_id);
CREATE INDEX IF NOT EXISTS idx_client_activities_type ON client_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_client_activities_follow_up ON client_activities(follow_up_date);

-- Insert sample clients
INSERT INTO clients (client_code, name, email, phone, city, state, customer_type, source, address) VALUES
('CLI-001', 'Rameshwar Sharma', 'rameshwar@example.com', '9876543210', 'Satna', 'Madhya Pradesh', 'residential', 'walk-in', '123 Main Street, Near Bus Stand'),
('CLI-002', 'Prateek Industries Ltd', 'contact@prateek.com', '9876543211', 'Indore', 'Madhya Pradesh', 'industrial', 'referral', '45 Industrial Area, Phase 2'),
('CLI-003', 'Metro Commercial Complex', 'admin@metrocomplex.com', '9876543212', 'Bhopal', 'Madhya Pradesh', 'commercial', 'website', '78 MG Road, Commercial Center'),
('CLI-004', 'Suresh Patel', 'suresh.patel@example.com', '9876543213', 'Jabalpur', 'Madhya Pradesh', 'residential', 'social_media', '89 Patel Colony'),
('CLI-005', 'Green Earth Foundation', 'info@greenearth.org', '9876543214', 'Gwalior', 'Madhya Pradesh', 'commercial', 'referral', '12 NGO Lane, Green Campus')
ON CONFLICT (client_code) DO NOTHING;

-- Add trigger for updated_at on clients
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add trigger for updated_at on quotation_approvals
DROP TRIGGER IF EXISTS update_quotation_approvals_updated_at ON quotation_approvals;
CREATE TRIGGER update_quotation_approvals_updated_at
    BEFORE UPDATE ON quotation_approvals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
