-- Create interactions table
CREATE TABLE IF NOT EXISTS interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('email', 'call', 'meeting', 'note')),
    subject VARCHAR(255) NOT NULL,
    content TEXT,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_interactions_contact_id ON interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_interactions_organization_id ON interactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON interactions(type);
CREATE INDEX IF NOT EXISTS idx_interactions_scheduled_at ON interactions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_interactions_completed_at ON interactions(completed_at);
CREATE INDEX IF NOT EXISTS idx_interactions_created_at ON interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_interactions_deleted_at ON interactions(deleted_at);

-- Create updated_at trigger
CREATE TRIGGER update_interactions_updated_at
    BEFORE UPDATE ON interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for users in same organization" ON interactions
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users 
            WHERE organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
        )
        AND deleted_at IS NULL
    );

CREATE POLICY "Enable insert for authenticated users" ON interactions
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
    );

CREATE POLICY "Enable update for interaction owner" ON interactions
    FOR UPDATE USING (
        user_id = auth.uid()
    ) WITH CHECK (true);

CREATE POLICY "Enable delete for interaction owner" ON interactions
    FOR DELETE USING (
        user_id = auth.uid()
    );