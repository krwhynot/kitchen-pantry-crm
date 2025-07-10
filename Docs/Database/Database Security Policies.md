# Database Security Policies

**Row Level Security (RLS) implementation for multi-tenant data isolation and role-based access control.**

## RLS Overview

**PostgreSQL Row Level Security** ensures users can only access data within their authorized scope, primarily based on organization membership and role permissions.

### Security Principles

- **Organization-based isolation** prevents cross-tenant data access
- **Role-based permissions** with hierarchical access levels
- **Automatic policy enforcement** for all database queries
- **Consistent security** regardless of application-level implementation

---

## Organization Access Policies

**Control access to organization data based on user assignments and roles.**

### Organizations Table Policy

```sql
-- Enable RLS on organizations table
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Users can view organizations they're assigned to or if they're admin/manager
CREATE POLICY "Users can view assigned organizations" ON organizations
    FOR SELECT USING (
        assigned_user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- Users can update organizations they're assigned to
CREATE POLICY "Users can update assigned organizations" ON organizations
    FOR UPDATE USING (
        assigned_user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- Only admins and managers can create organizations
CREATE POLICY "Admins and managers can create organizations" ON organizations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );
```

### Key Features

- **Assignment-based access** for sales representatives
- **Hierarchical permissions** for managers and admins
- **Create restrictions** limited to admin/manager roles
- **Update permissions** based on assignment or role

---

## Contact Access Policies

**Inherit organization access permissions for contact data.**

### Contacts Table Policy

```sql
-- Enable RLS on contacts table
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Users can view contacts in accessible organizations
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

-- Users can modify contacts in accessible organizations
CREATE POLICY "Users can modify contacts in accessible organizations" ON contacts
    FOR ALL USING (
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

### Key Features

- **Inherited access** from parent organization
- **Consistent permissions** across organization hierarchy
- **Full CRUD access** for authorized users
- **Manager override** for cross-organization access

---

## Interaction Access Policies

**Control access to interaction history and activity data.**

### Interactions Table Policy

```sql
-- Enable RLS on interactions table
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

-- Users can view interactions they created or in accessible organizations
CREATE POLICY "Users can view accessible interactions" ON interactions
    FOR SELECT USING (
        user_id = auth.uid() OR
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

-- Users can create interactions for accessible organizations
CREATE POLICY "Users can create interactions for accessible organizations" ON interactions
    FOR INSERT WITH CHECK (
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

-- Users can only update their own interactions
CREATE POLICY "Users can update their own interactions" ON interactions
    FOR UPDATE USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );
```

### Key Features

- **Creator access** for interaction owners
- **Organization-based access** for team visibility
- **Update restrictions** to interaction creators
- **Manager oversight** for team management

---

## Opportunity Access Policies

**Secure sales pipeline data with appropriate access controls.**

### Opportunities Table Policy

```sql
-- Enable RLS on opportunities table
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Users can view opportunities they own or in accessible organizations
CREATE POLICY "Users can view accessible opportunities" ON opportunities
    FOR SELECT USING (
        user_id = auth.uid() OR
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

-- Users can create opportunities for accessible organizations
CREATE POLICY "Users can create opportunities for accessible organizations" ON opportunities
    FOR INSERT WITH CHECK (
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

-- Users can update opportunities they own
CREATE POLICY "Users can update owned opportunities" ON opportunities
    FOR UPDATE USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );
```

### Key Features

- **Ownership-based access** for opportunity creators
- **Organization alignment** with user assignments
- **Pipeline protection** preventing unauthorized modifications
- **Management visibility** for forecasting and coaching

---

## User Access Policies

**Control access to user profile and system data.**

### Users Table Policy

```sql
-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile and team members
CREATE POLICY "Users can view accessible user profiles" ON users
    FOR SELECT USING (
        id = auth.uid() OR
        manager_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (
        id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Only admins can create users
CREATE POLICY "Only admins can create users" ON users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );
```

### Key Features

- **Self-access** for profile management
- **Manager visibility** for team members
- **Admin control** for user creation
- **Profile protection** preventing unauthorized changes

---

## Role-Based Access Levels

**Hierarchical permission structure for different user types.**

### Admin Role

- **Full system access** across all organizations and data
- **User management** including creation, modification, deletion
- **System configuration** and security policy management
- **Complete audit trail** access and reporting capabilities

### Manager Role

- **Team access** to assigned organizations and teams
- **Team management** for direct reports and their data
- **Performance visibility** including metrics and forecasting
- **Limited user management** for team members only

### Sales Rep Role

- **Assigned organization access** with full CRUD permissions
- **Personal interaction history** and opportunity management
- **Contact management** within assigned organizations
- **No cross-organization access** or user management

### Read-Only Role

- **View-only access** to assigned data
- **No modification permissions** for any records
- **Reporting access** for assigned organizations
- **Integration account** support for external systems

---

## Security Helper Functions

**Utility functions for common security checks and operations.**

### Current User Role Function

```sql
-- Get current user's role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS VARCHAR(50) AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM users 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Organization Access Check

```sql
-- Check if user can access organization
CREATE OR REPLACE FUNCTION can_access_organization(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM organizations 
        WHERE id = org_id 
        AND (
            assigned_user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM users 
                WHERE id = auth.uid() 
                AND role IN ('admin', 'manager')
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Policy Testing

**Verification procedures for security policy effectiveness.**

### Test User Access

```sql
-- Test organization access for different roles
SELECT 
    o.name,
    o.assigned_user_id,
    u.role,
    CASE 
        WHEN o.assigned_user_id = auth.uid() THEN 'Direct Assignment'
        WHEN u.role IN ('admin', 'manager') THEN 'Role Access'
        ELSE 'No Access'
    END as access_type
FROM organizations o
JOIN users u ON u.id = auth.uid()
WHERE o.is_deleted = FALSE;
```

### Audit Policy Compliance

```sql
-- Verify RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('organizations', 'contacts', 'interactions', 'opportunities', 'users');
```

This comprehensive security framework ensures data isolation, role-based access control, and consistent policy enforcement across the Kitchen Pantry CRM system.

