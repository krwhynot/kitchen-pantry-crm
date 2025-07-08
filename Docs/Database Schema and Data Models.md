# Kitchen Pantry CRM - Database Schema and Data Models

**Document Version:** 1.0  
**Author:** Manus AI  
**Date:** January 2025  
**System:** Kitchen Pantry CRM MVP  

## Executive Summary

The Kitchen Pantry CRM database schema is designed specifically for food service industry workflows, emphasizing relationship management between organizations, contacts, and sales interactions. Built on PostgreSQL through Supabase, the schema leverages advanced features including Row Level Security (RLS), real-time subscriptions, and automatic API generation while maintaining ACID compliance and referential integrity.

The data model follows normalized relational design principles with strategic denormalization for performance optimization. The schema supports multi-tenant architecture through organization-based data isolation, comprehensive audit trails, and soft deletion patterns for data preservation. All tables include standard metadata fields for tracking creation, modification, and deletion events.

## Core Entity Relationships

### Primary Entity Hierarchy

The Kitchen Pantry CRM data model centers around four primary entities that reflect real-world food service business relationships:

**Organizations** serve as the top-level entity representing restaurants, food service companies, distributors, and other business entities. Organizations contain multiple contacts and serve as the primary tenant boundary for data isolation. Each organization includes industry classification, priority levels, and business relationship status.

**Contacts** represent individual people within organizations, including decision makers, purchasing managers, chefs, and other stakeholders. Contacts maintain relationships with their parent organization while supporting role-based permissions and communication preferences. The contact model includes detailed profile information, communication history, and relationship strength indicators.

**Interactions** capture all communication and engagement activities between CRM users and contacts. This includes phone calls, emails, meetings, site visits, and other touchpoints. Interactions link users to contacts and organizations, providing comprehensive activity tracking with outcomes, follow-up requirements, and performance metrics.

**Opportunities** represent potential sales or business development prospects within organizations. Opportunities track pipeline progression, value estimates, probability assessments, and competitive information. Each opportunity connects to specific contacts and includes detailed sales process tracking.

### Supporting Entity Structure

**Users** represent CRM system users including sales representatives, managers, and administrators. Users are authenticated through Supabase Auth with additional profile information stored in the users table. User records include role assignments, territory management, and performance tracking capabilities.

**Products** maintain catalog information for items sold or promoted through the CRM system. Products include detailed specifications, pricing information, availability status, and category classifications relevant to food service operations.

**Interaction_Types** provide standardized categorization for different communication methods and activities. This lookup table ensures consistent interaction classification while supporting custom interaction types for specific business needs.

**Priority_Levels** define standardized priority classifications (A, B, C, D) used throughout the system for organizations, contacts, and opportunities. Priority levels include visual indicators, escalation rules, and automated workflow triggers.

## Detailed Table Specifications

### Organizations Table

```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    industry_segment VARCHAR(100),
    priority_level VARCHAR(1) CHECK (priority_level IN ('A', 'B', 'C', 'D')),
    business_type VARCHAR(50),
    annual_revenue DECIMAL(15,2),
    employee_count INTEGER,
    website_url VARCHAR(500),
    primary_phone VARCHAR(20),
    primary_email VARCHAR(255),
    billing_address JSONB,
    shipping_address JSONB,
    tax_id VARCHAR(50),
    payment_terms VARCHAR(100),
    credit_limit DECIMAL(15,2),
    account_status VARCHAR(20) DEFAULT 'active',
    territory_id UUID,
    assigned_user_id UUID REFERENCES users(id),
    last_interaction_date TIMESTAMP WITH TIME ZONE,
    next_follow_up_date TIMESTAMP WITH TIME ZONE,
    relationship_strength INTEGER CHECK (relationship_strength BETWEEN 1 AND 10),
    notes TEXT,
    tags TEXT[],
    custom_fields JSONB,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);
```

The organizations table serves as the central hub for all business relationship data. The industry_segment field supports food service categorization including Fine Dining, Fast Food, Healthcare, Education, and Corporate Catering. Priority levels use a simple A-D classification system with A representing highest priority accounts requiring immediate attention.

Address information is stored as JSONB to support flexible address formats across different regions while maintaining queryability. The billing_address and shipping_address fields can contain street address, city, state, postal code, and country information in a structured format.

Financial information including annual_revenue, credit_limit, and payment_terms supports sales planning and risk management. The relationship_strength field provides a quantitative measure of business relationship quality on a 1-10 scale, enabling prioritization and resource allocation decisions.

### Contacts Table

```sql
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(255) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    job_title VARCHAR(150),
    department VARCHAR(100),
    is_primary_contact BOOLEAN DEFAULT FALSE,
    is_decision_maker BOOLEAN DEFAULT FALSE,
    authority_level INTEGER CHECK (authority_level BETWEEN 1 AND 5),
    email_primary VARCHAR(255),
    email_secondary VARCHAR(255),
    phone_primary VARCHAR(20),
    phone_secondary VARCHAR(20),
    mobile_phone VARCHAR(20),
    preferred_contact_method VARCHAR(20) DEFAULT 'email',
    preferred_contact_time VARCHAR(50),
    linkedin_url VARCHAR(500),
    birthday DATE,
    anniversary DATE,
    communication_preferences JSONB,
    interests TEXT[],
    dietary_restrictions TEXT[],
    last_interaction_date TIMESTAMP WITH TIME ZONE,
    next_follow_up_date TIMESTAMP WITH TIME ZONE,
    relationship_score INTEGER CHECK (relationship_score BETWEEN 1 AND 10),
    influence_score INTEGER CHECK (influence_score BETWEEN 1 AND 10),
    engagement_level VARCHAR(20) DEFAULT 'medium',
    notes TEXT,
    tags TEXT[],
    custom_fields JSONB,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);
```

The contacts table maintains detailed information about individuals within organizations, emphasizing relationship management and communication tracking. The full_name field is automatically generated from first_name and last_name using PostgreSQL's generated column feature, ensuring consistency while allowing flexible name handling.

Authority and influence scoring systems help sales representatives identify key decision makers and influencers within target organizations. The authority_level field ranks formal decision-making power while influence_score measures informal influence and relationship strength.

Communication preferences are stored as JSONB to support complex preference structures including preferred channels, timing, frequency, and content types. This flexibility accommodates diverse communication styles while enabling personalized outreach strategies.

### Interactions Table

```sql
CREATE TABLE interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    contact_id UUID REFERENCES contacts(id),
    user_id UUID NOT NULL REFERENCES users(id),
    interaction_type VARCHAR(50) NOT NULL,
    interaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    duration_minutes INTEGER,
    subject VARCHAR(255),
    description TEXT,
    outcome VARCHAR(100),
    outcome_details TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date TIMESTAMP WITH TIME ZONE,
    follow_up_notes TEXT,
    location VARCHAR(255),
    meeting_attendees TEXT[],
    documents_shared TEXT[],
    next_steps TEXT,
    sentiment_score INTEGER CHECK (sentiment_score BETWEEN 1 AND 5),
    opportunity_id UUID REFERENCES opportunities(id),
    parent_interaction_id UUID REFERENCES interactions(id),
    interaction_status VARCHAR(20) DEFAULT 'completed',
    priority_level VARCHAR(1) CHECK (priority_level IN ('A', 'B', 'C', 'D')),
    tags TEXT[],
    custom_fields JSONB,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);
```

The interactions table captures comprehensive activity tracking for all customer touchpoints. The interaction_type field supports standardized categories including CALL, EMAIL, MEETING, VISIT, DEMO, PROPOSAL, and FOLLOW_UP, with extensibility for custom interaction types.

Outcome tracking includes both categorical outcomes and detailed descriptions, enabling performance analysis and coaching opportunities. The sentiment_score field provides emotional context for interactions, helping identify relationship trends and potential issues.

Follow-up management is built into the interaction model with dedicated fields for follow-up requirements, dates, and notes. This structure supports automated workflow triggers and ensures no opportunities are missed due to inadequate follow-up.

### Opportunities Table

```sql
CREATE TABLE opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    primary_contact_id UUID REFERENCES contacts(id),
    user_id UUID NOT NULL REFERENCES users(id),
    opportunity_name VARCHAR(255) NOT NULL,
    description TEXT,
    opportunity_type VARCHAR(50),
    stage VARCHAR(50) NOT NULL DEFAULT 'prospecting',
    probability INTEGER CHECK (probability BETWEEN 0 AND 100),
    estimated_value DECIMAL(15,2),
    estimated_close_date DATE,
    actual_close_date DATE,
    sales_cycle_days INTEGER,
    lead_source VARCHAR(100),
    competitor_info TEXT,
    decision_criteria TEXT,
    decision_timeline VARCHAR(100),
    budget_confirmed BOOLEAN DEFAULT FALSE,
    authority_confirmed BOOLEAN DEFAULT FALSE,
    need_confirmed BOOLEAN DEFAULT FALSE,
    timeline_confirmed BOOLEAN DEFAULT FALSE,
    proposal_submitted BOOLEAN DEFAULT FALSE,
    proposal_date DATE,
    contract_terms TEXT,
    win_loss_reason TEXT,
    lessons_learned TEXT,
    priority_level VARCHAR(1) CHECK (priority_level IN ('A', 'B', 'C', 'D')),
    tags TEXT[],
    custom_fields JSONB,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);
```

The opportunities table implements comprehensive sales pipeline management with detailed tracking of sales process progression. The stage field supports customizable sales stages including prospecting, qualification, proposal, negotiation, and closed-won/closed-lost.

BANT (Budget, Authority, Need, Timeline) qualification is tracked through dedicated boolean fields, providing clear visibility into opportunity qualification status. This information helps sales managers prioritize resources and forecast accuracy.

Competitive intelligence is captured through competitor_info and decision_criteria fields, enabling strategic positioning and win/loss analysis. The lessons_learned field supports continuous improvement by capturing insights from completed opportunities.

### Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    full_name VARCHAR(255) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    job_title VARCHAR(150),
    department VARCHAR(100),
    role VARCHAR(50) NOT NULL DEFAULT 'sales_rep',
    manager_id UUID REFERENCES users(id),
    territory_id UUID,
    phone VARCHAR(20),
    mobile_phone VARCHAR(20),
    office_location VARCHAR(255),
    hire_date DATE,
    employment_status VARCHAR(20) DEFAULT 'active',
    quota_annual DECIMAL(15,2),
    commission_rate DECIMAL(5,4),
    performance_metrics JSONB,
    preferences JSONB,
    avatar_url VARCHAR(500),
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

The users table extends Supabase Auth with CRM-specific profile information and role management. The id field references auth.users(id) to maintain consistency with Supabase authentication while adding business-specific attributes.

Role-based access control is implemented through the role field supporting values including admin, manager, sales_rep, and read_only. The manager_id field creates hierarchical relationships enabling territory management and reporting structures.

Performance tracking is supported through quota_annual, commission_rate, and performance_metrics fields. The performance_metrics JSONB field stores flexible performance data including sales targets, achievement percentages, and historical performance trends.

## Row Level Security (RLS) Implementation

### Organization-based Data Isolation

Row Level Security policies ensure users can only access data within their authorized scope, primarily based on organization membership and role permissions.

```sql
-- Organizations RLS Policy
CREATE POLICY "Users can view organizations in their territory" ON organizations
    FOR SELECT USING (
        assigned_user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- Contacts RLS Policy  
CREATE POLICY "Users can view contacts in accessible organizations" ON contacts
    FOR SELECT USING (
        organization_id IN (
            SELECT id FROM organizations 
            WHERE assigned_user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );
```

These policies ensure data isolation while supporting management oversight and administrative access. The policies are evaluated for every database query, providing consistent security enforcement regardless of application-level security measures.

### Role-based Access Control

Different user roles have varying levels of data access and modification permissions implemented through RLS policies:

**Admin Role:** Full access to all data across all organizations with complete CRUD permissions. Admins can modify system configuration, user roles, and access sensitive financial information.

**Manager Role:** Access to data within their territory or reporting hierarchy with full CRUD permissions for assigned users and organizations. Managers can view performance metrics and generate reports for their teams.

**Sales Rep Role:** Access limited to assigned organizations and contacts with full CRUD permissions for their data. Sales representatives cannot access other users' data or sensitive financial information.

**Read-only Role:** View-only access to assigned data without modification permissions. This role supports temporary access, reporting users, or integration accounts requiring data visibility without modification capabilities.

## Indexing Strategy

### Performance Optimization Indexes

Strategic indexing ensures optimal query performance for common CRM operations while minimizing storage overhead and maintenance complexity.

```sql
-- Primary lookup indexes
CREATE INDEX idx_organizations_assigned_user ON organizations(assigned_user_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_contacts_organization ON contacts(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_interactions_contact_date ON interactions(contact_id, interaction_date DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_opportunities_user_stage ON opportunities(user_id, stage) WHERE is_deleted = FALSE;

-- Search and filtering indexes
CREATE INDEX idx_organizations_name_trgm ON organizations USING gin(name gin_trgm_ops);
CREATE INDEX idx_contacts_full_name_trgm ON contacts USING gin(full_name gin_trgm_ops);
CREATE INDEX idx_organizations_priority_segment ON organizations(priority_level, industry_segment) WHERE is_deleted = FALSE;

-- Date-based query indexes
CREATE INDEX idx_interactions_date_user ON interactions(interaction_date DESC, user_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_opportunities_close_date ON opportunities(estimated_close_date) WHERE is_deleted = FALSE AND stage NOT IN ('closed-won', 'closed-lost');

-- Follow-up and task indexes
CREATE INDEX idx_contacts_follow_up ON contacts(next_follow_up_date) WHERE next_follow_up_date IS NOT NULL AND is_deleted = FALSE;
CREATE INDEX idx_interactions_follow_up ON interactions(follow_up_date) WHERE follow_up_required = TRUE AND is_deleted = FALSE;
```

The indexing strategy prioritizes common query patterns including user-based data access, organization lookups, interaction history retrieval, and follow-up task management. Partial indexes on is_deleted = FALSE reduce index size and improve performance by excluding soft-deleted records.

Full-text search capabilities are implemented using PostgreSQL's trigram indexes (gin_trgm_ops) for fuzzy matching on names and descriptions. These indexes support autocomplete functionality and flexible search experiences.

## Data Validation and Constraints

### Business Rule Enforcement

Database constraints enforce critical business rules at the data layer, ensuring data integrity regardless of application-level validation:

```sql
-- Priority level validation
ALTER TABLE organizations ADD CONSTRAINT chk_priority_level 
    CHECK (priority_level IN ('A', 'B', 'C', 'D'));

-- Relationship scoring constraints
ALTER TABLE contacts ADD CONSTRAINT chk_relationship_score 
    CHECK (relationship_score BETWEEN 1 AND 10);

-- Opportunity probability validation
ALTER TABLE opportunities ADD CONSTRAINT chk_probability 
    CHECK (probability BETWEEN 0 AND 100);

-- Email format validation
ALTER TABLE contacts ADD CONSTRAINT chk_email_format 
    CHECK (email_primary ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Phone number format validation
ALTER TABLE contacts ADD CONSTRAINT chk_phone_format 
    CHECK (phone_primary ~ '^\+?[1-9]\d{1,14}$');
```

These constraints prevent invalid data entry while providing clear error messages for application developers. The constraints are enforced at the database level, ensuring consistency even if multiple applications access the same data.

### Referential Integrity

Foreign key constraints maintain referential integrity across related tables while supporting appropriate cascade behaviors:

```sql
-- Organization to contact relationship
ALTER TABLE contacts ADD CONSTRAINT fk_contacts_organization 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- User assignment relationships
ALTER TABLE organizations ADD CONSTRAINT fk_organizations_user 
    FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Interaction relationships
ALTER TABLE interactions ADD CONSTRAINT fk_interactions_organization 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE interactions ADD CONSTRAINT fk_interactions_contact 
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;

-- Opportunity relationships
ALTER TABLE opportunities ADD CONSTRAINT fk_opportunities_organization 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
```

Cascade behaviors are carefully chosen to maintain data integrity while preventing accidental data loss. Organization deletion cascades to related contacts and interactions, while user deletion sets assigned_user_id to NULL to preserve historical data.

## Audit Trail Implementation

### Automatic Timestamp Management

Database triggers automatically maintain audit trail information for all critical tables:

```sql
-- Trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all main tables
CREATE TRIGGER update_organizations_updated_at 
    BEFORE UPDATE ON organizations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at 
    BEFORE UPDATE ON contacts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interactions_updated_at 
    BEFORE UPDATE ON interactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at 
    BEFORE UPDATE ON opportunities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

These triggers ensure consistent audit trail maintenance without requiring application-level implementation. The triggers automatically populate updated_at timestamps and updated_by user references for every record modification.

### Change History Tracking

For critical data changes, a separate audit log table captures detailed change history:

```sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    user_id UUID REFERENCES users(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values, user_id)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, to_jsonb(OLD), auth.uid());
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(OLD), to_jsonb(NEW), auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, record_id, action, new_values, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(NEW), auth.uid());
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

This comprehensive audit system captures all data changes with full before/after values, enabling detailed change tracking, compliance reporting, and data recovery capabilities.

## Data Migration and Seeding

### Initial Data Setup

The database includes seed data for common lookup values and system configuration:

```sql
-- Priority levels seed data
INSERT INTO priority_levels (level, name, description, color_code) VALUES
('A', 'Critical', 'Highest priority accounts requiring immediate attention', '#ef4444'),
('B', 'High', 'Important accounts with significant potential', '#f59e0b'),
('C', 'Medium', 'Standard accounts with regular follow-up', '#10b981'),
('D', 'Low', 'Maintenance accounts with minimal activity', '#6b7280');

-- Industry segments seed data
INSERT INTO industry_segments (name, description) VALUES
('Fine Dining', 'High-end restaurants and culinary establishments'),
('Fast Food', 'Quick service restaurants and chains'),
('Healthcare', 'Hospitals, nursing homes, and medical facilities'),
('Education', 'Schools, universities, and educational institutions'),
('Corporate Catering', 'Office buildings and corporate dining'),
('Hospitality', 'Hotels, resorts, and event venues');

-- Interaction types seed data
INSERT INTO interaction_types (name, description, icon, color) VALUES
('CALL', 'Phone conversation', 'phone', '#3b82f6'),
('EMAIL', 'Email communication', 'mail', '#10b981'),
('MEETING', 'In-person or virtual meeting', 'users', '#f59e0b'),
('VISIT', 'Site visit or facility tour', 'map-pin', '#ef4444'),
('DEMO', 'Product demonstration', 'play', '#8b5cf6'),
('PROPOSAL', 'Proposal submission', 'document', '#06b6d4');
```

This seed data provides consistent reference values across all system installations while supporting customization for specific business needs.

### Excel Migration Support

The schema includes temporary tables and procedures to support Excel data migration:

```sql
-- Temporary staging table for Excel imports
CREATE TABLE excel_import_staging (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_batch_id UUID NOT NULL,
    source_row_number INTEGER,
    raw_data JSONB,
    mapped_data JSONB,
    validation_errors TEXT[],
    import_status VARCHAR(20) DEFAULT 'pending',
    target_table VARCHAR(50),
    target_record_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migration validation function
CREATE OR REPLACE FUNCTION validate_excel_import(batch_id UUID)
RETURNS TABLE (
    row_number INTEGER,
    errors TEXT[],
    warnings TEXT[]
) AS $$
BEGIN
    -- Validation logic for Excel import data
    -- Returns validation results for each row
END;
$$ LANGUAGE plpgsql;
```

The Excel migration system supports batch processing, validation, error handling, and rollback capabilities essential for large-scale data imports from existing CRM systems.

## Performance Monitoring

### Query Performance Tracking

Built-in PostgreSQL extensions provide comprehensive query performance monitoring:

```sql
-- Enable query statistics
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Create performance monitoring view
CREATE VIEW query_performance AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
ORDER BY total_time DESC;

-- Index usage monitoring
CREATE VIEW index_usage AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

These monitoring views provide insights into query performance, index effectiveness, and optimization opportunities essential for maintaining system performance as data volume grows.

## Conclusion

The Kitchen Pantry CRM database schema provides a comprehensive foundation for food service industry relationship management while maintaining flexibility for future enhancements. The normalized design ensures data integrity while strategic denormalization supports performance requirements.

Row Level Security implementation provides robust multi-tenant data isolation with role-based access control. The comprehensive audit trail system ensures compliance and data governance requirements are met while supporting operational transparency.

The indexing strategy balances query performance with storage efficiency, supporting common CRM operations while enabling complex reporting and analytics. Data validation constraints enforce business rules at the database level, ensuring consistency regardless of application-level implementations.

This schema serves as the authoritative data model for all Kitchen Pantry CRM development activities, providing clear specifications for API development, frontend integration, and system extensions.

