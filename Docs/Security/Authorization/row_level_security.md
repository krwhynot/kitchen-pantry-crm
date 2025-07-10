# Row Level Security (RLS)

## Overview

Supabase PostgreSQL **Row Level Security** provides database-level access control that enforces data isolation regardless of application-level security measures.

## Database-Level Security Policies

### Organization-Based Isolation
RLS policies ensure users can only access organizations within their assigned scope or reporting hierarchy.

```sql
-- Organizations RLS Policy
CREATE POLICY "Users can access assigned organizations" ON organizations
  FOR ALL USING (
    -- User is assigned to the organization
    assigned_user_id = auth.uid() OR
    -- User is a manager of the assigned user
    EXISTS (
      SELECT 1 FROM users u1
      JOIN users u2 ON u2.manager_id = u1.id
      WHERE u1.id = auth.uid() 
      AND u2.id = assigned_user_id
    ) OR
    -- User has admin role
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );
```

### Contact Access Control
Contacts inherit organization-level access control through policy cascading.

```sql
-- Contacts RLS Policy
CREATE POLICY "Users can access contacts in accessible organizations" ON contacts
  FOR ALL USING (
    organization_id IN (
      SELECT id FROM organizations
      -- Organizations policy will be applied automatically
    )
  );
```

### Interaction Access Control
Interactions support multiple access patterns including creator access and organizational access.

```sql
-- Interactions RLS Policy
CREATE POLICY "Users can access their interactions and team interactions" ON interactions
  FOR ALL USING (
    -- User created the interaction
    user_id = auth.uid() OR
    -- User can access the related organization
    organization_id IN (
      SELECT id FROM organizations
      -- Organizations policy will be applied automatically
    ) OR
    -- User is a manager of the interaction creator
    EXISTS (
      SELECT 1 FROM users u1
      JOIN users u2 ON u2.manager_id = u1.id
      WHERE u1.id = auth.uid() 
      AND u2.id = interactions.user_id
    )
  );
```

## Dynamic Policy Evaluation

### Time-Based Access
Policies can include **time-based restrictions** for sensitive operations and temporary access grants.

### Data Sensitivity Levels
Different data types have varying sensitivity levels with corresponding access restrictions:
- **Financial data** - Enhanced protection
- **Personal information** - GDPR compliance
- **Competitive intelligence** - Restricted access

### Contextual Access Control
Policies evaluate user context including:
- **Location-based** restrictions
- **Device type** validation
- **Access pattern** analysis
- **Additional authentication** requirements

## Policy Performance Optimization

### Indexing Strategy
- **Composite indexes** on policy columns
- **Partial indexes** for common queries
- **Query plan analysis** for optimization

### Caching Mechanisms
- **Policy result caching** for frequently accessed data
- **User permission caching** to reduce database load
- **Invalidation strategies** for real-time updates

## Security Benefits

### Consistent Enforcement
- **Database-level** security that cannot be bypassed
- **Automatic application** to all queries
- **Protection against** application bugs
- **Consistent security** across all interfaces

### Audit and Compliance
- **Comprehensive logging** of all data access
- **Granular access tracking** for compliance
- **Policy violation detection** and alerting
- **Regulatory compliance** support