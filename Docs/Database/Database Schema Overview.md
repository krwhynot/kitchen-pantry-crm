# Database Schema Overview

**Kitchen Pantry CRM database architecture optimized for food service industry workflows.**

## Architecture Summary

The Kitchen Pantry CRM uses **PostgreSQL** through **Supabase** with advanced features including Row Level Security (RLS), real-time subscriptions, and automatic API generation.

### Core Design Principles

- **Normalized relational design** with strategic denormalization for performance
- **Multi-tenant architecture** through organization-based data isolation  
- **Comprehensive audit trails** with soft deletion patterns
- **ACID compliance** and referential integrity enforcement

### Technology Stack

- **Database:** PostgreSQL 15+ via Supabase
- **Authentication:** Supabase Auth with JWT tokens
- **Real-time:** Supabase real-time subscriptions
- **API:** Auto-generated REST and GraphQL APIs
- **Security:** Row Level Security (RLS) policies

## Entity Relationship Overview

### Primary Entities

**Organizations** → **Contacts** → **Interactions** → **Opportunities**

```
Organizations (1:N) Contacts
    ↓                ↓
Opportunities (N:1) Interactions
    ↓                ↓
Products (N:N)    Users (1:N)
```

### Core Entity Purposes

- **Organizations:** Business entities (restaurants, distributors, suppliers)
- **Contacts:** Individual people within organizations
- **Interactions:** Communication activities and touchpoints
- **Opportunities:** Sales prospects and pipeline management
- **Users:** CRM system users (sales reps, managers, admins)
- **Products:** Catalog items for food service operations

## File Organization

The database documentation is split into focused modules:

1. **Database_schema_overview.md** - This overview file
2. **Core_entities.md** - Primary table definitions and relationships
3. **Supporting_entities.md** - Lookup tables and reference data
4. **Security_policies.md** - RLS policies and access control
5. **Indexes_performance.md** - Indexing strategy and optimization
6. **Audit_migration.md** - Audit trails and data migration

## Key Features

### Multi-Tenant Security
- **Organization-based isolation** prevents cross-tenant data access
- **Role-based permissions** (admin, manager, sales_rep, read_only)
- **Automatic policy enforcement** through PostgreSQL RLS

### Performance Optimization
- **Strategic indexing** for common query patterns
- **Partial indexes** excluding soft-deleted records
- **Full-text search** using trigram indexes
- **Query performance monitoring** with pg_stat_statements

### Data Integrity
- **Foreign key constraints** with appropriate cascade behaviors
- **Check constraints** for business rule enforcement
- **Automatic timestamps** via database triggers
- **Comprehensive validation** at database level

### Audit and Compliance
- **Complete change tracking** with before/after values
- **User attribution** for all data modifications
- **Soft deletion** preserving historical data
- **Excel migration support** for data imports

## Development Integration

### Supabase Features Used
- **Auto-generated APIs** from table schemas
- **Real-time subscriptions** for live data updates
- **Built-in authentication** with user management
- **Edge functions** for custom business logic

### TypeScript Integration
- **Type generation** from database schema
- **Compile-time safety** for database operations
- **IntelliSense support** for queries and mutations

This modular approach ensures optimal Claude Code AI parsing while maintaining comprehensive database documentation coverage.

