database_supabase_setup.md

file_name: 10_database_supabase_setup.md
title: Database Supabase Configuration and Setup
---
This section details the Supabase configuration for the database, covering project setup, schema management, and security configurations like Row Level Security (RLS) for data isolation.

## Database Deployment and Management

### Supabase Configuration and Setup

Supabase provides managed PostgreSQL with automatic scaling, backup management, and real-time capabilities. Database deployment includes schema management, security configuration, and performance optimization.

**Project Configuration:** Supabase project setup with appropriate resource allocation, security settings, and access controls. Project configuration includes database sizing, connection limits, and backup schedules.

**Schema Management:** Database schema deployment with migration scripts, version control, and rollback capabilities. Schema management includes table creation, index optimization, and constraint enforcement.

**Security Configuration:** Row Level Security (RLS) policy deployment with role-based access control and data isolation. Security configuration includes authentication integration, permission management, and audit logging.

```sql
-- migrations/001_initial_schema.sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types
CREATE TYPE priority_level AS ENUM ('A', 'B', 'C', 'D');
CREATE TYPE interaction_type AS ENUM ('CALL', 'EMAIL', 'MEETING', 'VISIT', 'DEMO', 'PROPOSAL');
CREATE TYPE opportunity_stage AS ENUM ('prospecting', 'qualification', 'proposal', 'negotiation', 'closed-won', 'closed-lost');

-- Create users table (extends auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  full_name VARCHAR(255) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  role VARCHAR(50) NOT NULL DEFAULT 'sales_rep',
  manager_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  industry_segment VARCHAR(100),
  priority_level priority_level DEFAULT 'C',
  assigned_user_id UUID REFERENCES users(id),
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX idx_organizations_assigned_user ON organizations(assigned_user_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_organizations_priority ON organizations(priority_level) WHERE is_deleted = FALSE;
CREATE INDEX idx_organizations_name_trgm ON organizations USING gin(name gin_trgm_ops);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view assigned organizations" ON organizations
  FOR SELECT USING (
    assigned_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- Create audit trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at 
  BEFORE UPDATE ON organizations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();