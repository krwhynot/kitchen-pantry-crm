# Integration Testing

## Overview

Integration testing validates **component interactions**, **API endpoint behavior**, and **database operations** using real database instances and comprehensive test scenarios. This testing level ensures components work correctly together while maintaining reasonable execution time.

## API Integration Testing

### Test Setup and Configuration

API integration testing validates **endpoint behavior**, **request/response handling**, and **database interactions** with real database instances and authentication flows.

```typescript
// tests/integration/organizations.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../../src/app'
import { setupTestDatabase, cleanupTestDatabase, createTestUser } from '../helpers/database'

describe('Organizations API Integration', () => {
  let testUser: any
  let authToken: string

  beforeAll(async () => {
    await setupTestDatabase()
    testUser = await createTestUser({
      email: 'test@example.com',
      role: 'sales_rep'
    })
    authToken = testUser.token
  })

  afterAll(async () => {
    await cleanupTestDatabase()
  })

  beforeEach(async () => {
    // Clean up test data before each test
    await request(app)
      .delete('/api/v1/test/cleanup')
      .set('Authorization', `Bearer ${authToken}`)
  })
})
```

### GET Endpoint Testing

```typescript
describe('GET /api/v1/organizations', () => {
  it('returns paginated organizations for authenticated user', async () => {
    // Create test organizations
    const org1 = await request(app)
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Restaurant 1',
        industry_segment: 'Fine Dining',
        priority_level: 'A'
      })

    const org2 = await request(app)
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Restaurant 2',
        industry_segment: 'Fast Food',
        priority_level: 'B'
      })

    const response = await request(app)
      .get('/api/v1/organizations')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)

    expect(response.body.success).toBe(true)
    expect(response.body.data).toHaveLength(2)
    expect(response.body.meta.pagination.total).toBe(2)
    
    const orgNames = response.body.data.map((org: any) => org.name)
    expect(orgNames).toContain('Test Restaurant 1')
    expect(orgNames).toContain('Test Restaurant 2')
  })

  it('supports filtering by priority level', async () => {
    await request(app)
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'High Priority Restaurant',
        priority_level: 'A'
      })

    await request(app)
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Low Priority Restaurant',
        priority_level: 'C'
      })

    const response = await request(app)
      .get('/api/v1/organizations?priority_level=A')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)

    expect(response.body.data).toHaveLength(1)
    expect(response.body.data[0].name).toBe('High Priority Restaurant')
    expect(response.body.data[0].priority_level).toBe('A')
  })

  it('supports search functionality', async () => {
    await request(app)
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Italian Bistro',
        industry_segment: 'Fine Dining'
      })

    await request(app)
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Chinese Restaurant',
        industry_segment: 'Fast Food'
      })

    const response = await request(app)
      .get('/api/v1/organizations?search=italian')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)

    expect(response.body.data).toHaveLength(1)
    expect(response.body.data[0].name).toBe('Italian Bistro')
  })

  it('returns 401 for unauthenticated requests', async () => {
    await request(app)
      .get('/api/v1/organizations')
      .expect(401)
  })
})
```

### POST Endpoint Testing

```typescript
describe('POST /api/v1/organizations', () => {
  it('creates organization with valid data', async () => {
    const organizationData = {
      name: 'New Restaurant',
      industry_segment: 'Fine Dining',
      priority_level: 'A',
      primary_email: 'contact@newrestaurant.com',
      primary_phone: '+1234567890',
      annual_revenue: 1000000
    }

    const response = await request(app)
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ${authToken}`)
      .send(organizationData)
      .expect(201)

    expect(response.body.success).toBe(true)
    expect(response.body.data.name).toBe(organizationData.name)
    expect(response.body.data.industry_segment).toBe(organizationData.industry_segment)
    expect(response.body.data.assigned_user_id).toBe(testUser.id)
    expect(response.body.data.id).toBeDefined()
    expect(response.body.data.created_at).toBeDefined()
  })

  it('validates required fields', async () => {
    const response = await request(app)
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        industry_segment: 'Fine Dining'
        // Missing required 'name' field
      })
      .expect(422)

    expect(response.body.success).toBe(false)
    expect(response.body.errors).toContainEqual(
      expect.objectContaining({
        field: 'name',
        code: 'VALIDATION_ERROR'
      })
    )
  })

  it('validates email format', async () => {
    const response = await request(app)
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Restaurant',
        primary_email: 'invalid-email'
      })
      .expect(422)

    expect(response.body.errors).toContainEqual(
      expect.objectContaining({
        field: 'primary_email',
        code: 'VALIDATION_ERROR'
      })
    )
  })

  it('prevents duplicate organization names', async () => {
    const organizationData = {
      name: 'Unique Restaurant Name',
      industry_segment: 'Fine Dining'
    }

    // Create first organization
    await request(app)
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ${authToken}`)
      .send(organizationData)
      .expect(201)

    // Attempt to create duplicate
    const response = await request(app)
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ${authToken}`)
      .send(organizationData)
      .expect(409)

    expect(response.body.success).toBe(false)
    expect(response.body.errors[0].code).toBe('DUPLICATE_RESOURCE')
  })
})
```

### PUT/PATCH Endpoint Testing

```typescript
describe('PUT /api/v1/organizations/:id', () => {
  it('updates organization with valid data', async () => {
    // Create organization
    const createResponse = await request(app)
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Original Name',
        industry_segment: 'Fine Dining',
        priority_level: 'B'
      })

    const organizationId = createResponse.body.data.id

    // Update organization
    const updateData = {
      name: 'Updated Name',
      priority_level: 'A'
    }

    const response = await request(app)
      .put(`/api/v1/organizations/${organizationId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData)
      .expect(200)

    expect(response.body.success).toBe(true)
    expect(response.body.data.name).toBe('Updated Name')
    expect(response.body.data.priority_level).toBe('A')
    expect(response.body.data.industry_segment).toBe('Fine Dining') // Unchanged
    expect(response.body.data.updated_at).toBeDefined()
  })

  it('returns 404 for non-existent organization', async () => {
    const response = await request(app)
      .put('/api/v1/organizations/non-existent-id')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Updated Name' })
      .expect(404)

    expect(response.body.success).toBe(false)
    expect(response.body.errors[0].code).toBe('RESOURCE_NOT_FOUND')
  })

  it('prevents unauthorized updates', async () => {
    const otherUser = await createTestUser({
      email: 'other@example.com',
      role: 'sales_rep'
    })

    // Create organization with other user
    const createResponse = await request(app)
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ${otherUser.token}`)
      .send({
        name: 'Other User Organization',
        assigned_user_id: otherUser.id
      })

    const organizationId = createResponse.body.data.id

    // Attempt to update with original user (should fail)
    await request(app)
      .put(`/api/v1/organizations/${organizationId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Unauthorized Update' })
      .expect(403)
  })
})
```

### DELETE Endpoint Testing

```typescript
describe('DELETE /api/v1/organizations/:id', () => {
  it('soft deletes organization', async () => {
    // Create organization
    const createResponse = await request(app)
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'To Be Deleted',
        industry_segment: 'Fine Dining'
      })

    const organizationId = createResponse.body.data.id

    // Delete organization
    await request(app)
      .delete(`/api/v1/organizations/${organizationId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(204)

    // Verify organization is not returned in list
    const listResponse = await request(app)
      .get('/api/v1/organizations')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)

    const orgNames = listResponse.body.data.map((org: any) => org.name)
    expect(orgNames).not.toContain('To Be Deleted')

    // Verify organization still exists in database but marked as deleted
    // (This would require direct database query in real implementation)
  })
})
```

## Database Integration Testing

### Database Constraint Testing

Database integration testing validates **data persistence**, **constraint enforcement**, and **transaction handling** using real PostgreSQL instances.

```typescript
// tests/integration/database.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { supabase } from '../../src/config/supabase'
import { setupTestDatabase, cleanupTestDatabase } from '../helpers/database'

describe('Database Integration', () => {
  beforeAll(async () => {
    await setupTestDatabase()
  })

  afterAll(async () => {
    await cleanupTestDatabase()
  })

  beforeEach(async () => {
    // Clean up test data
    await supabase.from('interactions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('contacts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('organizations').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  })

  describe('Organizations table', () => {
    it('enforces unique organization names', async () => {
      const orgData = {
        name: 'Unique Restaurant',
        industry_segment: 'Fine Dining'
      }

      // First insert should succeed
      const { error: firstError } = await supabase
        .from('organizations')
        .insert(orgData)

      expect(firstError).toBeNull()

      // Second insert with same name should fail
      const { error: secondError } = await supabase
        .from('organizations')
        .insert(orgData)

      expect(secondError).toBeDefined()
      expect(secondError?.code).toBe('23505') // Unique constraint violation
    })

    it('validates priority level constraints', async () => {
      const { error } = await supabase
        .from('organizations')
        .insert({
          name: 'Test Restaurant',
          priority_level: 'X' // Invalid priority level
        })

      expect(error).toBeDefined()
      expect(error?.code).toBe('23514') // Check constraint violation
    })

    it('automatically sets timestamps', async () => {
      const { data, error } = await supabase
        .from('organizations')
        .insert({
          name: 'Timestamp Test Restaurant'
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data.created_at).toBeDefined()
      expect(data.updated_at).toBeDefined()
      expect(new Date(data.created_at)).toBeInstanceOf(Date)
    })

    it('updates timestamp on modification', async () => {
      // Create organization
      const { data: created, error: createError } = await supabase
        .from('organizations')
        .insert({
          name: 'Update Test Restaurant'
        })
        .select()
        .single()

      expect(createError).toBeNull()
      const originalUpdatedAt = created.updated_at

      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100))

      // Update organization
      const { data: updated, error: updateError } = await supabase
        .from('organizations')
        .update({ name: 'Updated Restaurant Name' })
        .eq('id', created.id)
        .select()
        .single()

      expect(updateError).toBeNull()
      expect(updated.updated_at).not.toBe(originalUpdatedAt)
      expect(new Date(updated.updated_at) > new Date(originalUpdatedAt)).toBe(true)
    })
  })

  describe('Contacts table', () => {
    it('enforces foreign key constraints', async () => {
      const { error } = await supabase
        .from('contacts')
        .insert({
          organization_id: '00000000-0000-0000-0000-000000000001', // Non-existent org
          first_name: 'John',
          last_name: 'Doe',
          email_primary: 'john@example.com'
        })

      expect(error).toBeDefined()
      expect(error?.code).toBe('23503') // Foreign key constraint violation
    })

    it('generates full name automatically', async () => {
      // Create organization first
      const { data: org } = await supabase
        .from('organizations')
        .insert({ name: 'Test Organization' })
        .select()
        .single()

      const { data: contact, error } = await supabase
        .from('contacts')
        .insert({
          organization_id: org.id,
          first_name: 'John',
          last_name: 'Doe',
          email_primary: 'john@example.com'
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(contact.full_name).toBe('John Doe')
    })

    it('validates email format', async () => {
      const { data: org } = await supabase
        .from('organizations')
        .insert({ name: 'Test Organization' })
        .select()
        .single()

      const { error } = await supabase
        .from('contacts')
        .insert({
          organization_id: org.id,
          first_name: 'John',
          last_name: 'Doe',
          email_primary: 'invalid-email'
        })

      expect(error).toBeDefined()
      expect(error?.code).toBe('23514') // Check constraint violation
    })
  })

  describe('Audit logging', () => {
    it('records data changes in audit log', async () => {
      // Create organization
      const { data: org } = await supabase
        .from('organizations')
        .insert({
          name: 'Audit Test Restaurant'
        })
        .select()
        .single()

      // Check audit log
      const { data: auditLogs } = await supabase
        .from('audit_log')
        .select('*')
        .eq('table_name', 'organizations')
        .eq('record_id', org.id)
        .eq('action', 'INSERT')

      expect(auditLogs).toHaveLength(1)
      expect(auditLogs[0].new_values).toMatchObject({
        name: 'Audit Test Restaurant'
      })
    })
  })
})
```

## MCP-Enhanced Development Testing

### AI-Assisted Testing Integration

The Kitchen Pantry CRM development environment includes **Supabase MCP (Model Context Protocol)** integration to enhance testing capabilities and streamline database testing workflows during development phases.

#### MCP Testing Capabilities

- **AI-assisted test data generation** based on database schema
- **Real-time query analysis** and optimization during testing
- **Interactive database exploration** for test scenario validation
- **Automated test database setup** and teardown
- **Schema-driven test case generation** and validation

#### MCP Development Testing Example

```typescript
// tests/development/mcp-assisted.test.ts
import { describe, it, expect } from 'vitest'
import { mcpClient } from '../helpers/mcp-client'

describe('MCP-Assisted Development Testing', () => {
  it('generates realistic test data using MCP', async () => {
    // Use MCP to generate test data based on schema
    const testOrganizations = await mcpClient.generateTestData('organizations', {
      count: 10,
      constraints: {
        industry_segment: ['Fine Dining', 'Fast Food', 'Catering'],
        priority_level: ['A', 'B', 'C']
      }
    })

    expect(testOrganizations).toHaveLength(10)
    expect(testOrganizations[0]).toHaveProperty('name')
    expect(testOrganizations[0]).toHaveProperty('industry_segment')
    expect(['A', 'B', 'C']).toContain(testOrganizations[0].priority_level)
  })

  it('validates database schema using MCP analysis', async () => {
    // Use MCP to analyze schema consistency
    const schemaAnalysis = await mcpClient.analyzeSchema('organizations')
    
    expect(schemaAnalysis.constraints.unique).toContain('name')
    expect(schemaAnalysis.constraints.required).toContain('name')
    expect(schemaAnalysis.relationships).toHaveProperty('contacts')
  })

  it('optimizes test queries using MCP suggestions', async () => {
    // Use MCP to analyze and optimize test queries
    const queryPlan = await mcpClient.analyzeQuery(`
      SELECT o.*, COUNT(c.id) as contact_count
      FROM organizations o
      LEFT JOIN contacts c ON o.id = c.organization_id
      WHERE o.priority_level = 'A'
      GROUP BY o.id
    `)

    expect(queryPlan.performance.estimated_cost).toBeLessThan(100)
    expect(queryPlan.suggestions).toContain('Consider adding index on priority_level')
  })
})
```

#### MCP Development Utilities

```typescript
// tests/helpers/mcp-client.ts
interface MCPClient {
  generateTestData(table: string, options: GenerationOptions): Promise<any[]>
  analyzeSchema(table: string): Promise<SchemaAnalysis>
  analyzeQuery(sql: string): Promise<QueryAnalysis>
  seedDatabase(scenario: string): Promise<void>
  cleanupTestData(): Promise<void>
}

interface GenerationOptions {
  count: number
  constraints?: Record<string, any>
  relationships?: boolean
}

interface SchemaAnalysis {
  constraints: {
    unique: string[]
    required: string[]
    foreign_keys: string[]
  }
  relationships: Record<string, any>
  indexes: string[]
}

interface QueryAnalysis {
  performance: {
    estimated_cost: number
    execution_time: number
  }
  suggestions: string[]
  optimization_opportunities: string[]
}

class SupabaseMCPClient implements MCPClient {
  async generateTestData(table: string, options: GenerationOptions): Promise<any[]> {
    // Implementation uses MCP to generate realistic test data
    // This is a development-only feature
    return []
  }

  async analyzeSchema(table: string): Promise<SchemaAnalysis> {
    // Implementation uses MCP to analyze database schema
    return {
      constraints: { unique: [], required: [], foreign_keys: [] },
      relationships: {},
      indexes: []
    }
  }

  async analyzeQuery(sql: string): Promise<QueryAnalysis> {
    // Implementation uses MCP to analyze query performance
    return {
      performance: { estimated_cost: 0, execution_time: 0 },
      suggestions: [],
      optimization_opportunities: []
    }
  }

  async seedDatabase(scenario: string): Promise<void> {
    // Implementation uses MCP to seed database with scenario data
  }

  async cleanupTestData(): Promise<void> {
    // Implementation uses MCP to clean up test data
  }
}

export const mcpClient = new SupabaseMCPClient()
```

### MCP Security and Limitations

#### Development-Only Security
- **MCP testing utilities** are configured exclusively for development environments
- **Restricted access controls** prevent production system access
- **Security separation** between development and production environments

#### Enhanced Development Features
- **Real-time database performance monitoring** during tests
- **AI-powered test scenario generation** based on business requirements
- **Automated test data cleanup** and database state management
- **Interactive debugging** with database query analysis
- **Schema migration testing** with rollback validation

## Test Data Management

### Database Setup and Teardown

```typescript
// tests/helpers/database.ts
import { supabase } from '../../src/config/supabase'

export async function setupTestDatabase() {
  // Run database migrations
  await runMigrations()
  
  // Create test user accounts
  await createTestUsers()
  
  // Set up test data fixtures
  await setupTestFixtures()
}

export async function cleanupTestDatabase() {
  // Clean up test data
  await cleanupTestData()
  
  // Remove test users
  await cleanupTestUsers()
  
  // Reset database state
  await resetDatabaseState()
}

export async function createTestUser(userData: any) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: userData.email,
    password: 'testpassword123',
    user_metadata: {
      role: userData.role,
      full_name: userData.full_name || 'Test User'
    }
  })

  if (error) throw error

  // Generate JWT token for testing
  const token = await generateTestToken(data.user.id)
  
  return {
    id: data.user.id,
    email: data.user.email,
    role: userData.role,
    token
  }
}

async function generateTestToken(userId: string): Promise<string> {
  // Implementation to generate JWT token for testing
  return 'test-jwt-token'
}
```

### Integration Test Best Practices

#### Test Isolation
- **Clean database state** before each test
- **Independent test execution** without dependencies
- **Consistent test environment** across runs

#### Error Handling
- **Database constraint testing** for data validation
- **API error response validation** for proper error handling
- **Authentication and authorization testing** for security

#### Performance Considerations
- **Selective test execution** during development
- **Parallel test execution** where possible
- **Database connection management** for efficient resource usage

---

This integration testing approach ensures reliable component interactions, proper database behavior, and comprehensive API validation while maintaining development efficiency and test reliability.