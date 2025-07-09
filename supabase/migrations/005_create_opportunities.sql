-- Create opportunities table
CREATE TABLE IF NOT EXISTS opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    value DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (value >= 0),
    stage VARCHAR(50) NOT NULL CHECK (stage IN ('lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
    probability INTEGER NOT NULL DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
    expected_close_date TIMESTAMP WITH TIME ZONE,
    actual_close_date TIMESTAMP WITH TIME ZONE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_opportunities_organization_id ON opportunities(organization_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_contact_id ON opportunities(contact_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_user_id ON opportunities(user_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_opportunities_expected_close_date ON opportunities(expected_close_date);
CREATE INDEX IF NOT EXISTS idx_opportunities_actual_close_date ON opportunities(actual_close_date);
CREATE INDEX IF NOT EXISTS idx_opportunities_value ON opportunities(value);
CREATE INDEX IF NOT EXISTS idx_opportunities_deleted_at ON opportunities(deleted_at);

-- Create updated_at trigger
CREATE TRIGGER update_opportunities_updated_at
    BEFORE UPDATE ON opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for users in same organization" ON opportunities
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users 
            WHERE organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
        )
        AND deleted_at IS NULL
    );

CREATE POLICY "Enable insert for authenticated users" ON opportunities
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
    );

CREATE POLICY "Enable update for opportunity owner" ON opportunities
    FOR UPDATE USING (
        user_id = auth.uid()
    ) WITH CHECK (true);

CREATE POLICY "Enable delete for opportunity owner" ON opportunities
    FOR DELETE USING (
        user_id = auth.uid()
    );