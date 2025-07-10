# Database Indexes and Performance

**Strategic indexing and performance optimization for Kitchen Pantry CRM database operations.**

## Indexing Strategy Overview

**Optimized for common CRM query patterns while minimizing storage overhead and maintenance complexity.**

### Design Principles

- **Query pattern optimization** for frequent CRM operations
- **Partial indexing** excluding soft-deleted records
- **Composite indexes** for multi-column filtering
- **Full-text search** using PostgreSQL trigram indexes

---

## Primary Lookup Indexes

**Essential indexes for core entity access patterns.**

### User-Based Data Access

```sql
-- Organizations assigned to users
CREATE INDEX idx_organizations_assigned_user 
ON organizations(assigned_user_id) 
WHERE is_deleted = FALSE;

-- Contacts within organizations
CREATE INDEX idx_contacts_organization 
ON contacts(organization_id) 
WHERE is_deleted = FALSE;

-- User's interactions
CREATE INDEX idx_interactions_user 
ON interactions(user_id) 
WHERE is_deleted = FALSE;

-- User's opportunities
CREATE INDEX idx_opportunities_user 
ON opportunities(user_id) 
WHERE is_deleted = FALSE;
```

### Key Features

- **Partial indexes** exclude soft-deleted records
- **User-centric access** for user-assigned queries
- **Foreign key optimization** for join operations
- **WHERE clause support** for filtered queries

---

## Date-Based Query Indexes

**Optimized for time-based filtering and sorting operations.**

### Interaction History Indexes

```sql
-- Recent interactions by contact
CREATE INDEX idx_interactions_contact_date 
ON interactions(contact_id, interaction_date DESC) 
WHERE is_deleted = FALSE;

-- User interactions by date
CREATE INDEX idx_interactions_date_user 
ON interactions(interaction_date DESC, user_id) 
WHERE is_deleted = FALSE;

-- Follow-up interactions
CREATE INDEX idx_interactions_follow_up 
ON interactions(follow_up_date) 
WHERE follow_up_required = TRUE AND is_deleted = FALSE;
```

### Opportunity Timeline Indexes

```sql
-- Opportunities by close date
CREATE INDEX idx_opportunities_close_date 
ON opportunities(estimated_close_date) 
WHERE is_deleted = FALSE 
AND stage NOT IN ('closed-won', 'closed-lost');

-- Recently created opportunities
CREATE INDEX idx_opportunities_created 
ON opportunities(created_at DESC) 
WHERE is_deleted = FALSE;

-- Opportunity stage progression
CREATE INDEX idx_opportunities_stage_date 
ON opportunities(stage, updated_at DESC) 
WHERE is_deleted = FALSE;
```

### Key Features

- **Descending date order** for recent-first queries
- **Composite indexes** combining entity + date
- **Active record filtering** excluding closed opportunities
- **Follow-up optimization** for task management

---

## Search and Filtering Indexes

**Support for advanced search functionality and complex filtering.**

### Full-Text Search Indexes

```sql
-- Enable trigram extension for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Organization name search
CREATE INDEX idx_organizations_name_trgm 
ON organizations USING gin(name gin_trgm_ops);

-- Contact name search
CREATE INDEX idx_contacts_full_name_trgm 
ON contacts USING gin(full_name gin_trgm_ops);

-- Opportunity name search
CREATE INDEX idx_opportunities_name_trgm 
ON opportunities USING gin(opportunity_name gin_trgm_ops);
```

### Business Logic Indexes

```sql
-- Priority and industry filtering
CREATE INDEX idx_organizations_priority_segment 
ON organizations(priority_level, industry_segment) 
WHERE is_deleted = FALSE;

-- Contact authority and influence
CREATE INDEX idx_contacts_authority_influence 
ON contacts(authority_level DESC, influence_score DESC) 
WHERE is_deleted = FALSE;

-- Opportunity stage and probability
CREATE INDEX idx_opportunities_stage_probability 
ON opportunities(stage, probability DESC) 
WHERE is_deleted = FALSE;
```

### Key Features

- **Trigram indexes** enable fuzzy text matching
- **Multi-column filtering** for business criteria
- **Autocomplete support** for user interfaces
- **Performance optimization** for complex WHERE clauses

---

## Follow-Up and Task Indexes

**Optimized for CRM workflow and task management queries.**

### Follow-Up Management

```sql
-- Contact follow-ups
CREATE INDEX idx_contacts_follow_up 
ON contacts(next_follow_up_date) 
WHERE next_follow_up_date IS NOT NULL AND is_deleted = FALSE;

-- Interaction follow-ups
CREATE INDEX idx_interactions_follow_up_user 
ON interactions(follow_up_date, user_id) 
WHERE follow_up_required = TRUE AND is_deleted = FALSE;

-- Overdue follow-ups
CREATE INDEX idx_overdue_follow_ups 
ON contacts(next_follow_up_date, assigned_user_id) 
WHERE next_follow_up_date < NOW() AND is_deleted = FALSE;
```

### Activity Tracking

```sql
-- Last interaction tracking
CREATE INDEX idx_organizations_last_interaction 
ON organizations(last_interaction_date DESC) 
WHERE is_deleted = FALSE;

-- Contact engagement tracking
CREATE INDEX idx_contacts_last_interaction 
ON contacts(last_interaction_date DESC) 
WHERE is_deleted = FALSE;

-- Stale account identification
CREATE INDEX idx_stale_accounts 
ON organizations(last_interaction_date ASC) 
WHERE last_interaction_date < (NOW() - INTERVAL '30 days') 
AND is_deleted = FALSE;
```

### Key Features

- **Task management optimization** for follow-up queries
- **Overdue identification** for workflow automation
- **Engagement tracking** for relationship management
- **Stale account detection** for re-engagement campaigns

---

## Performance Monitoring Indexes

**Support for system performance analysis and optimization.**

### Query Performance Tracking

```sql
-- Enable pg_stat_statements extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Create performance monitoring view
CREATE VIEW query_performance AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / 
    NULLIF(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
ORDER BY total_time DESC;
```

### Index Usage Analysis

```sql
-- Index usage monitoring
CREATE VIEW index_usage AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan,
    CASE 
        WHEN idx_scan = 0 THEN 'Unused'
        WHEN idx_scan < 100 THEN 'Low Usage'
        WHEN idx_scan < 1000 THEN 'Medium Usage'
        ELSE 'High Usage'
    END as usage_level
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Key Features

- **Query performance tracking** with execution statistics
- **Index effectiveness analysis** for optimization
- **Usage pattern identification** for maintenance
- **Performance bottleneck detection** for tuning

---

## Composite Index Strategies

**Multi-column indexes for complex query optimization.**

### Organization and Contact Indexes

```sql
-- Contact authority within organizations
CREATE INDEX idx_contacts_org_authority 
ON contacts(organization_id, authority_level DESC, is_decision_maker) 
WHERE is_deleted = FALSE;

-- Organization priority and assignment
CREATE INDEX idx_organizations_priority_user 
ON organizations(priority_level, assigned_user_id) 
WHERE is_deleted = FALSE;
```

### Sales Pipeline Indexes

```sql
-- Opportunity pipeline analysis
CREATE INDEX idx_opportunities_pipeline 
ON opportunities(user_id, stage, estimated_close_date) 
WHERE is_deleted = FALSE;

-- Revenue forecasting
CREATE INDEX idx_opportunities_forecast 
ON opportunities(estimated_close_date, probability DESC, estimated_value DESC) 
WHERE is_deleted = FALSE 
AND stage NOT IN ('closed-won', 'closed-lost');
```

### Key Features

- **Multi-column optimization** for complex queries
- **Sort order specification** for performance
- **Conditional indexing** with WHERE clauses
- **Pipeline analysis support** for reporting

---

## Index Maintenance

**Procedures for ongoing index optimization and maintenance.**

### Index Health Monitoring

```sql
-- Check index bloat
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Maintenance Procedures

```sql
-- Reindex procedure for maintenance
CREATE OR REPLACE FUNCTION reindex_crm_tables()
RETURNS VOID AS $$
BEGIN
    REINDEX TABLE organizations;
    REINDEX TABLE contacts;
    REINDEX TABLE interactions;
    REINDEX TABLE opportunities;
    REINDEX TABLE users;
END;
$$ LANGUAGE plpgsql;
```

### Performance Optimization

```sql
-- Analyze table statistics
CREATE OR REPLACE FUNCTION update_table_statistics()
RETURNS VOID AS $$
BEGIN
    ANALYZE organizations;
    ANALYZE contacts;
    ANALYZE interactions;
    ANALYZE opportunities;
    ANALYZE users;
END;
$$ LANGUAGE plpgsql;
```

### Key Features

- **Index bloat monitoring** for maintenance scheduling
- **Automated reindexing** for performance optimization
- **Statistics updates** for query planner optimization
- **Health check procedures** for system monitoring

---

## Query Optimization Guidelines

**Best practices for writing efficient queries against indexed tables.**

### Index-Friendly Query Patterns

```sql
-- Efficient organization lookup
SELECT * FROM organizations 
WHERE assigned_user_id = $1 
AND is_deleted = FALSE
ORDER BY priority_level, name;

-- Optimized interaction history
SELECT * FROM interactions 
WHERE contact_id = $1 
AND is_deleted = FALSE
ORDER BY interaction_date DESC
LIMIT 20;

-- Fast opportunity pipeline query
SELECT * FROM opportunities 
WHERE user_id = $1 
AND stage = $2 
AND is_deleted = FALSE
ORDER BY estimated_close_date;
```

### Performance Anti-Patterns

- **Avoid leading wildcards** in LIKE queries (`LIKE '%term'`)
- **Don't use functions** on indexed columns in WHERE clauses
- **Minimize OR conditions** that can't use indexes effectively
- **Avoid unnecessary JOINs** when single-table queries suffice

This comprehensive indexing strategy ensures optimal performance for Kitchen Pantry CRM operations while supporting scalability and maintainability requirements.

