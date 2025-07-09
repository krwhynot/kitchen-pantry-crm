# Kitchen Pantry CRM - MCP Development Guide

## Overview

This document provides comprehensive guidance for using Model Context Protocol (MCP) tools with Supabase for Kitchen Pantry CRM development. The MCP integration enhances developer productivity by providing AI-assisted database management, schema development, and query optimization.

## ⚠️ Security Notice

**DEVELOPMENT ONLY**: This MCP setup is configured for development environments only. It includes security restrictions that prevent production access and limit operations to safe development activities.

## Quick Start

### 1. Initial Setup

```bash
# Navigate to project root
cd /home/krwhynot/Projects/KitchenPantry

# Run MCP development setup
./supabase/scripts/mcp-dev-setup.sh

# Source environment variables
source .env.development
```

### 2. Verify Setup

```bash
# Check Supabase status
supabase status

# Test MCP connection (using Claude Code)
# The MCP tools should now be available in your Claude Code session
```

## MCP Features and Capabilities

### Schema Management

The MCP integration provides enhanced schema management capabilities:

- **Interactive Schema Exploration**: Ask questions about your database structure
- **Migration Assistance**: Get help creating and validating migrations
- **Relationship Analysis**: Understand table relationships and dependencies
- **Constraint Validation**: Ensure data integrity with proper constraints

### Query Optimization

- **Performance Analysis**: Identify slow queries and optimization opportunities
- **Index Recommendations**: Get suggestions for improving query performance
- **Query Explanation**: Understand how your queries are executed
- **Best Practices**: Learn PostgreSQL and Supabase best practices

### Data Generation

- **Realistic Test Data**: Generate meaningful test data that respects relationships
- **Volume Control**: Create datasets of various sizes for testing
- **Referential Integrity**: Maintain proper foreign key relationships
- **Business Context**: Generate data relevant to food service industry

### Development Workflows

- **Migration Creation**: Create migrations with proper up/down scripts
- **Schema Validation**: Ensure schema changes are safe and reversible
- **Data Seeding**: Populate development database with test data
- **Testing Support**: Set up isolated test environments

## Common MCP Workflows

### 1. Schema Development

```bash
# Generate a new migration
supabase migration new add_customer_preferences

# Use MCP to help design the schema
# Ask: "Help me create a customer preferences table with fields for dietary restrictions, preferred suppliers, and communication preferences"

# Apply the migration
supabase db reset
```

### 2. Query Optimization

```bash
# Use MCP to analyze slow queries
# Ask: "Analyze this query and suggest optimizations: SELECT * FROM opportunities o JOIN contacts c ON o.contact_id = c.id WHERE o.stage = 'negotiation'"

# Get index recommendations
# Ask: "What indexes should I create for the opportunities table to improve query performance?"
```

### 3. Data Generation

```bash
# Generate test data
# Ask: "Generate 50 realistic organizations for a food service CRM, including restaurants, catering companies, and distributors"

# Create relationship-aware data
# Ask: "Generate contacts for these organizations with appropriate titles and roles for the food service industry"
```

### 4. Testing Support

```bash
# Set up test environment
# Ask: "Help me create a test data setup for integration testing of the opportunity management system"

# Clean up test data
# Ask: "Create a cleanup script to remove test data while preserving referential integrity"
```

## MCP Configuration

### Environment Variables

```bash
# Database connection for MCP
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# MCP security settings
MCP_ENVIRONMENT=development
MCP_SECURITY_LEVEL=development_only

# Feature flags
MCP_SCHEMA_MANAGEMENT=true
MCP_QUERY_ASSISTANCE=true
MCP_DATA_GENERATION=true
MCP_TESTING_SUPPORT=true
```

### Configuration File

The MCP configuration is defined in `supabase/mcp-config.json`:

```json
{
  "environment": "development",
  "security": {
    "access_level": "development_only",
    "restrictions": {
      "production_access": false,
      "write_operations": true,
      "schema_modifications": true
    }
  },
  "database": {
    "connection": {
      "host": "127.0.0.1",
      "port": 54322,
      "database": "postgres"
    }
  }
}
```

## Best Practices

### 1. Security Guidelines

- **Never use MCP in production**: Always verify environment is development
- **Review generated code**: Always review SQL and schema changes before applying
- **Use version control**: Commit all schema changes and migrations
- **Test thoroughly**: Validate all MCP-generated code and data

### 2. Development Workflow

- **Start with schema questions**: Use MCP to understand existing schema
- **Iterative development**: Make small, incremental changes
- **Document decisions**: Keep track of schema design decisions
- **Test migrations**: Always test up and down migrations

### 3. Data Management

- **Realistic test data**: Generate data that reflects real business scenarios
- **Maintain relationships**: Ensure foreign key constraints are respected
- **Clean up regularly**: Remove unnecessary test data
- **Backup important data**: Use `supabase db dump` for important datasets

## Available MCP Commands

### Schema Operations

```bash
# Analyze current schema
# Ask: "Show me the current database schema and explain the relationships"

# Generate migration
# Ask: "Create a migration to add an audit log table for tracking changes"

# Validate schema changes
# Ask: "Review this migration for potential issues: [paste migration content]"
```

### Query Operations

```bash
# Optimize query
# Ask: "Optimize this query: [paste query]"

# Explain query plan
# Ask: "Explain the execution plan for this query: [paste query]"

# Suggest indexes
# Ask: "What indexes would improve performance for the contacts table?"
```

### Data Operations

```bash
# Generate test data
# Ask: "Generate 100 realistic food service organizations with proper industry classifications"

# Create seed data
# Ask: "Create seed data for user roles and permissions"

# Clean up data
# Ask: "Create a script to clean up test data older than 30 days"
```

## Troubleshooting

### Common Issues

1. **MCP not responding**: Check that Supabase is running with `supabase status`
2. **Database connection errors**: Verify DATABASE_URL is correct
3. **Permission denied**: Ensure MCP_SECURITY_LEVEL is set to development_only
4. **Migration failures**: Check for syntax errors and constraint violations

### Debugging Steps

```bash
# Check Supabase status
supabase status

# View logs
supabase logs

# Reset database
supabase db reset

# Check MCP configuration
cat supabase/mcp-config.json
```

## Integration with Development Tools

### VS Code Integration

The MCP tools integrate with VS Code for enhanced development experience:

- **Database schema exploration**
- **Query assistance and completion**
- **Migration file generation**
- **Real-time query analysis**

### Testing Framework Integration

MCP works with the project's testing frameworks:

- **Jest**: Generate test data and database utilities
- **Playwright**: Create E2E test scenarios with realistic data
- **Vitest**: Support frontend testing with mock data

## Resources

### Documentation

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [MCP Specification](https://modelcontextprotocol.io/)

### Support

- **Project Issues**: Report issues in the GitHub repository
- **Supabase Support**: [Supabase Support](https://supabase.com/support)
- **MCP Community**: Check the MCP documentation and community resources

## Conclusion

The MCP integration with Supabase provides powerful AI-assisted development capabilities while maintaining security and safety through development-only access restrictions. Use these tools to accelerate your development workflow, improve code quality, and gain deeper insights into your database design and performance.

Remember: Always review and test MCP-generated code before applying it to your database, and never use these tools in production environments.