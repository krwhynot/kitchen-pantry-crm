-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'sales_rep')),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

-- Create updated_at trigger
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for users in same organization" ON users
    FOR SELECT USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
        AND deleted_at IS NULL
    );

CREATE POLICY "Enable insert for authenticated users" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for users in same organization" ON users
    FOR UPDATE USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    ) WITH CHECK (true);

CREATE POLICY "Enable delete for users in same organization" ON users
    FOR DELETE USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    );