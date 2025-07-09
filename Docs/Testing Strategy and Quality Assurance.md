# Kitchen Pantry CRM - Testing Strategy and Quality Assurance

**Document Version:** 1.0  
**Author:** Manus AI  
**Date:** January 2025  
**System:** Kitchen Pantry CRM MVP  

## Executive Summary

The Kitchen Pantry CRM testing strategy implements a comprehensive quality assurance framework designed to ensure reliability, performance, and user satisfaction for food service industry professionals. The testing approach emphasizes automated testing, continuous integration, and user-centric validation while maintaining rapid development velocity essential for MVP delivery.

The quality assurance framework encompasses multiple testing levels including unit testing, integration testing, end-to-end testing, and user acceptance testing. Each testing level includes specific tools, methodologies, and success criteria aligned with business requirements and technical specifications.

The testing strategy prioritizes critical user workflows, data integrity, security validation, and cross-platform compatibility. All testing procedures include automated execution, comprehensive reporting, and continuous improvement processes essential for maintaining high-quality software delivery throughout the development lifecycle.

## Testing Framework Architecture

### Multi-Level Testing Pyramid

The Kitchen Pantry CRM testing strategy follows the testing pyramid methodology, emphasizing fast, reliable unit tests at the base with progressively fewer but more comprehensive tests at higher levels. This approach ensures comprehensive coverage while maintaining efficient test execution and maintenance.

**Unit Testing (Foundation Level):** Individual component and function testing with high coverage and fast execution. Unit tests validate business logic, data transformations, utility functions, and component behavior in isolation. The unit testing layer provides immediate feedback during development and serves as documentation for expected behavior.

**Integration Testing (Middle Level):** Component interaction testing including API endpoints, database operations, and service integrations. Integration tests validate data flow between components, external service communication, and system boundary behavior. This level ensures components work correctly together while maintaining reasonable execution time.

**End-to-End Testing (Top Level):** Complete user workflow testing from frontend interactions through backend processing to database storage. E2E tests validate critical business processes, user journeys, and system reliability under realistic conditions. This level provides confidence in overall system functionality and user experience.

**Manual Testing (Validation Level):** Human validation of user experience, accessibility, and edge cases that automated tests cannot effectively cover. Manual testing includes usability validation, exploratory testing, and acceptance criteria verification by domain experts.

### Testing Technology Stack

The testing framework leverages modern testing tools optimized for Vue.js, Node.js, and TypeScript development while providing comprehensive coverage and maintainable test suites.

**Frontend Testing Stack:**
- **Vitest:** Primary testing framework for Vue.js components with native TypeScript support and fast execution
- **Vue Testing Library:** Component testing utilities emphasizing user-centric testing approaches
- **Playwright:** End-to-end testing framework with cross-browser support and reliable test execution
- **MSW (Mock Service Worker):** API mocking for isolated frontend testing without backend dependencies

**Backend Testing Stack:**
- **Jest:** Comprehensive testing framework for Node.js with extensive mocking capabilities
- **Supertest:** HTTP assertion library for API endpoint testing with request/response validation
- **Testcontainers:** Docker-based integration testing with real database instances
- **Faker.js:** Test data generation for realistic testing scenarios

**Database Testing:**
- **PostgreSQL Test Database:** Isolated test database instances for integration testing
- **Database Fixtures:** Predefined test data sets for consistent testing scenarios
- **Migration Testing:** Database schema change validation and rollback testing

## Unit Testing Implementation

### Frontend Component Testing

Vue.js component testing emphasizes user interaction patterns and component behavior validation using Vue Testing Library principles. Component tests focus on user-visible behavior rather than implementation details.

```typescript
// components/atoms/Button/Button.test.ts
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/vue'
import Button from './Button.vue'

describe('Button Component', () => {
  it('renders with correct text content', () => {
    render(Button, {
      slots: {
        default: 'Click me'
      }
    })
    
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('applies correct variant classes', () => {
    render(Button, {
      props: {
        variant: 'primary',
        size: 'lg'
      },
      slots: {
        default: 'Primary Button'
      }
    })
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-primary', 'min-h-[52px]')
  })

  it('emits click event when clicked', async () => {
    const { emitted } = render(Button, {
      slots: {
        default: 'Click me'
      }
    })
    
    const button = screen.getByRole('button')
    await fireEvent.click(button)
    
    expect(emitted().click).toHaveLength(1)
  })

  it('is disabled when loading prop is true', () => {
    render(Button, {
      props: {
        loading: true
      },
      slots: {
        default: 'Loading Button'
      }
    })
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('shows loading spinner when loading', () => {
    render(Button, {
      props: {
        loading: true
      },
      slots: {
        default: 'Loading Button'
      }
    })
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('meets accessibility requirements', () => {
    render(Button, {
      props: {
        ariaLabel: 'Custom button label'
      },
      slots: {
        default: 'Accessible Button'
      }
    })
    
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Custom button label')
  })

  it('supports keyboard navigation', async () => {
    const { emitted } = render(Button, {
      slots: {
        default: 'Keyboard Button'
      }
    })
    
    const button = screen.getByRole('button')
    button.focus()
    
    await fireEvent.keyDown(button, { key: 'Enter' })
    expect(emitted().click).toHaveLength(1)
    
    await fireEvent.keyDown(button, { key: ' ' })
    expect(emitted().click).toHaveLength(2)
  })
})

// components/organisms/DataTable/DataTable.test.ts
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen, waitFor } from '@testing-library/vue'
import DataTable from './DataTable.vue'

const mockData = [
  {
    id: '1',
    name: 'Gourmet Bistro',
    industry_segment: 'Fine Dining',
    priority_level: 'A'
  },
  {
    id: '2',
    name: 'Fast Food Chain',
    industry_segment: 'Fast Food',
    priority_level: 'B'
  }
]

const mockColumns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'industry_segment', label: 'Industry', sortable: false },
  { key: 'priority_level', label: 'Priority', sortable: true }
]

describe('DataTable Component', () => {
  it('renders table with correct data', () => {
    render(DataTable, {
      props: {
        title: 'Organizations',
        data: mockData,
        columns: mockColumns
      }
    })
    
    expect(screen.getByText('Organizations')).toBeInTheDocument()
    expect(screen.getByText('Gourmet Bistro')).toBeInTheDocument()
    expect(screen.getByText('Fast Food Chain')).toBeInTheDocument()
  })

  it('handles sorting when column header is clicked', async () => {
    const { emitted } = render(DataTable, {
      props: {
        title: 'Organizations',
        data: mockData,
        columns: mockColumns
      }
    })
    
    const nameHeader = screen.getByText('Name')
    await fireEvent.click(nameHeader)
    
    expect(emitted().sort).toHaveLength(1)
    expect(emitted().sort[0]).toEqual(['name', 'asc'])
  })

  it('shows loading state correctly', () => {
    render(DataTable, {
      props: {
        title: 'Organizations',
        data: [],
        columns: mockColumns,
        loading: true
      }
    })
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('displays empty state when no data', () => {
    render(DataTable, {
      props: {
        title: 'Organizations',
        data: [],
        columns: mockColumns,
        emptyTitle: 'No organizations found',
        emptyDescription: 'Create your first organization to get started'
      }
    })
    
    expect(screen.getByText('No organizations found')).toBeInTheDocument()
    expect(screen.getByText('Create your first organization to get started')).toBeInTheDocument()
  })

  it('handles row selection correctly', async () => {
    const { emitted } = render(DataTable, {
      props: {
        title: 'Organizations',
        data: mockData,
        columns: mockColumns,
        selectable: true
      }
    })
    
    const checkboxes = screen.getAllByRole('checkbox')
    const firstRowCheckbox = checkboxes[1] // Skip header checkbox
    
    await fireEvent.click(firstRowCheckbox)
    
    expect(emitted()['selection-change']).toHaveLength(1)
    expect(emitted()['selection-change'][0]).toEqual([['1']])
  })

  it('supports bulk actions when rows are selected', async () => {
    const bulkActions = [
      { key: 'delete', label: 'Delete', variant: 'danger' as const }
    ]
    
    const { emitted } = render(DataTable, {
      props: {
        title: 'Organizations',
        data: mockData,
        columns: mockColumns,
        selectable: true,
        bulkActions
      }
    })
    
    // Select a row first
    const checkboxes = screen.getAllByRole('checkbox')
    await fireEvent.click(checkboxes[1])
    
    // Click bulk action
    const deleteButton = screen.getByText('Delete')
    await fireEvent.click(deleteButton)
    
    expect(emitted()['bulk-action']).toHaveLength(1)
    expect(emitted()['bulk-action'][0][0]).toBe('delete')
  })
})
```

### Backend Unit Testing

Node.js backend unit testing focuses on business logic validation, API endpoint behavior, and service integration patterns. Backend tests emphasize data validation, error handling, and security compliance.

```typescript
// services/organizationService.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { OrganizationService } from './organizationService'
import { supabase } from '../config/supabase'

// Mock Supabase client
vi.mock('../config/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn()
    }
  }
}))

describe('OrganizationService', () => {
  let organizationService: OrganizationService
  let mockSupabaseFrom: any

  beforeEach(() => {
    organizationService = new OrganizationService()
    mockSupabaseFrom = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn()
    }
    
    vi.mocked(supabase.from).mockReturnValue(mockSupabaseFrom)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('getOrganizations', () => {
    it('returns paginated organizations with correct filters', async () => {
      const mockData = [
        {
          id: '1',
          name: 'Test Organization',
          priority_level: 'A',
          industry_segment: 'Fine Dining'
        }
      ]

      mockSupabaseFrom.single.mockResolvedValue({
        data: mockData,
        error: null,
        count: 1
      })

      const result = await organizationService.getOrganizations({
        page: 1,
        limit: 50,
        priority_level: 'A'
      })

      expect(supabase.from).toHaveBeenCalledWith('organizations')
      expect(mockSupabaseFrom.select).toHaveBeenCalled()
      expect(result.data).toEqual(mockData)
      expect(result.pagination.total).toBe(1)
    })

    it('handles database errors gracefully', async () => {
      mockSupabaseFrom.single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      })

      await expect(
        organizationService.getOrganizations({ page: 1, limit: 50 })
      ).rejects.toThrow('Database connection failed')
    })

    it('applies correct filters and sorting', async () => {
      mockSupabaseFrom.single.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      })

      await organizationService.getOrganizations({
        page: 1,
        limit: 25,
        search: 'restaurant',
        industry_segment: 'Fine Dining',
        priority_level: 'A',
        sort: 'name',
        order: 'desc'
      })

      expect(mockSupabaseFrom.order).toHaveBeenCalledWith('name', { ascending: false })
      expect(mockSupabaseFrom.range).toHaveBeenCalledWith(0, 24)
    })
  })

  describe('createOrganization', () => {
    it('creates organization with valid data', async () => {
      const organizationData = {
        name: 'New Restaurant',
        industry_segment: 'Fine Dining',
        priority_level: 'B' as const,
        primary_email: 'contact@newrestaurant.com'
      }

      const mockCreatedOrg = {
        id: '123',
        ...organizationData,
        created_at: new Date().toISOString()
      }

      mockSupabaseFrom.single.mockResolvedValue({
        data: mockCreatedOrg,
        error: null
      })

      const result = await organizationService.createOrganization(organizationData)

      expect(supabase.from).toHaveBeenCalledWith('organizations')
      expect(mockSupabaseFrom.insert).toHaveBeenCalledWith(
        expect.objectContaining(organizationData)
      )
      expect(result).toEqual(mockCreatedOrg)
    })

    it('validates required fields', async () => {
      const invalidData = {
        industry_segment: 'Fine Dining'
        // Missing required 'name' field
      }

      await expect(
        organizationService.createOrganization(invalidData as any)
      ).rejects.toThrow('Organization name is required')
    })

    it('validates email format', async () => {
      const invalidData = {
        name: 'Test Restaurant',
        primary_email: 'invalid-email'
      }

      await expect(
        organizationService.createOrganization(invalidData)
      ).rejects.toThrow('Invalid email format')
    })

    it('handles duplicate name errors', async () => {
      const organizationData = {
        name: 'Existing Restaurant',
        industry_segment: 'Fine Dining'
      }

      mockSupabaseFrom.single.mockResolvedValue({
        data: null,
        error: { 
          code: '23505', 
          message: 'duplicate key value violates unique constraint' 
        }
      })

      await expect(
        organizationService.createOrganization(organizationData)
      ).rejects.toThrow('Organization name already exists')
    })
  })

  describe('updateOrganization', () => {
    it('updates organization with valid data', async () => {
      const updateData = {
        name: 'Updated Restaurant Name',
        priority_level: 'A' as const
      }

      const mockUpdatedOrg = {
        id: '123',
        ...updateData,
        updated_at: new Date().toISOString()
      }

      mockSupabaseFrom.single.mockResolvedValue({
        data: mockUpdatedOrg,
        error: null
      })

      const result = await organizationService.updateOrganization('123', updateData)

      expect(mockSupabaseFrom.update).toHaveBeenCalledWith(
        expect.objectContaining(updateData)
      )
      expect(mockSupabaseFrom.eq).toHaveBeenCalledWith('id', '123')
      expect(result).toEqual(mockUpdatedOrg)
    })

    it('handles non-existent organization', async () => {
      mockSupabaseFrom.single.mockResolvedValue({
        data: null,
        error: null
      })

      await expect(
        organizationService.updateOrganization('non-existent', { name: 'Test' })
      ).rejects.toThrow('Organization not found')
    })
  })

  describe('deleteOrganization', () => {
    it('soft deletes organization', async () => {
      mockSupabaseFrom.single.mockResolvedValue({
        data: { id: '123', is_deleted: true },
        error: null
      })

      await organizationService.deleteOrganization('123')

      expect(mockSupabaseFrom.update).toHaveBeenCalledWith({
        is_deleted: true,
        updated_at: expect.any(String)
      })
      expect(mockSupabaseFrom.eq).toHaveBeenCalledWith('id', '123')
    })

    it('handles deletion of non-existent organization', async () => {
      mockSupabaseFrom.single.mockResolvedValue({
        data: null,
        error: null
      })

      await expect(
        organizationService.deleteOrganization('non-existent')
      ).rejects.toThrow('Organization not found')
    })
  })
})

// middleware/validation.test.ts
import { describe, it, expect, vi } from 'vitest'
import { Request, Response, NextFunction } from 'express'
import { validateOrganization } from './validation'

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    mockRequest = {}
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    }
    mockNext = vi.fn()
  })

  describe('validateOrganization', () => {
    it('passes validation with valid data', () => {
      mockRequest.body = {
        name: 'Valid Restaurant',
        industry_segment: 'Fine Dining',
        priority_level: 'A',
        primary_email: 'contact@restaurant.com',
        annual_revenue: 1000000
      }

      validateOrganization(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalled()
      expect(mockResponse.status).not.toHaveBeenCalled()
    })

    it('rejects invalid email format', () => {
      mockRequest.body = {
        name: 'Valid Restaurant',
        primary_email: 'invalid-email'
      }

      validateOrganization(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(422)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'primary_email',
            code: 'VALIDATION_ERROR'
          })
        ])
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('rejects invalid priority level', () => {
      mockRequest.body = {
        name: 'Valid Restaurant',
        priority_level: 'X' // Invalid priority level
      }

      validateOrganization(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(422)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'priority_level',
            code: 'VALIDATION_ERROR'
          })
        ])
      })
    })

    it('strips unknown fields', () => {
      mockRequest.body = {
        name: 'Valid Restaurant',
        unknown_field: 'should be removed',
        another_unknown: 123
      }

      validateOrganization(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockRequest.body).toEqual({
        name: 'Valid Restaurant'
      })
      expect(mockNext).toHaveBeenCalled()
    })
  })
})
```

### Utility and Helper Testing

Utility functions and helper modules require comprehensive testing to ensure reliability across the application. These tests focus on edge cases, error handling, and performance characteristics.

```typescript
// utils/validation.test.ts
import { describe, it, expect } from 'vitest'
import { ValidationService } from './validation'

describe('ValidationService', () => {
  describe('email validation', () => {
    it('validates correct email formats', () => {
      const validEmails = [
        'user@example.com',
        'test.email+tag@domain.co.uk',
        'user123@test-domain.com'
      ]

      validEmails.forEach(email => {
        expect(ValidationService.email(email)).toBe(true)
      })
    })

    it('rejects invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        'user..double.dot@domain.com'
      ]

      invalidEmails.forEach(email => {
        expect(ValidationService.email(email)).toBe(false)
      })
    })
  })

  describe('phone validation', () => {
    it('validates international phone formats', () => {
      const validPhones = [
        '+1234567890',
        '+44 20 7946 0958',
        '+33 1 42 86 83 26',
        '1234567890'
      ]

      validPhones.forEach(phone => {
        expect(ValidationService.phone(phone)).toBe(true)
      })
    })

    it('rejects invalid phone formats', () => {
      const invalidPhones = [
        '123',
        '+',
        'abc123',
        '++1234567890'
      ]

      invalidPhones.forEach(phone => {
        expect(ValidationService.phone(phone)).toBe(false)
      })
    })
  })

  describe('password validation', () => {
    it('validates strong passwords', () => {
      const strongPasswords = [
        'StrongPass123!',
        'MySecure@Password1',
        'Complex#Pass99'
      ]

      strongPasswords.forEach(password => {
        const result = ValidationService.validatePassword(password)
        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })
    })

    it('identifies weak password issues', () => {
      const weakPassword = 'weak'
      const result = ValidationService.validatePassword(weakPassword)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must be at least 8 characters long')
      expect(result.errors).toContain('Password must contain at least one uppercase letter')
      expect(result.errors).toContain('Password must contain at least one number')
      expect(result.errors).toContain('Password must contain at least one special character')
    })
  })

  describe('business email validation', () => {
    it('accepts business email domains', () => {
      const businessEmails = [
        'user@company.com',
        'contact@restaurant.biz',
        'info@foodservice.org'
      ]

      businessEmails.forEach(email => {
        expect(ValidationService.validateBusinessEmail(email)).toBe(true)
      })
    })

    it('rejects free email providers', () => {
      const freeEmails = [
        'user@gmail.com',
        'test@yahoo.com',
        'contact@hotmail.com',
        'info@outlook.com'
      ]

      freeEmails.forEach(email => {
        expect(ValidationService.validateBusinessEmail(email)).toBe(false)
      })
    })
  })

  describe('input sanitization', () => {
    it('removes dangerous characters', () => {
      const dangerousInput = '<script>alert("xss")</script>Hello'
      const sanitized = ValidationService.sanitizeInput(dangerousInput)
      
      expect(sanitized).toBe('scriptalert(xss)/scriptHello')
      expect(sanitized).not.toContain('<')
      expect(sanitized).not.toContain('>')
    })

    it('limits input length', () => {
      const longInput = 'a'.repeat(2000)
      const sanitized = ValidationService.sanitizeInput(longInput)
      
      expect(sanitized.length).toBe(1000)
    })

    it('trims whitespace', () => {
      const input = '  hello world  '
      const sanitized = ValidationService.sanitizeInput(input)
      
      expect(sanitized).toBe('hello world')
    })
  })
})
```

## Integration Testing Implementation

### API Integration Testing

API integration testing validates endpoint behavior, request/response handling, and database interactions using real database instances and comprehensive test scenarios.

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

    it('respects user territory restrictions', async () => {
      // Create another user with different territory
      const otherUser = await createTestUser({
        email: 'other@example.com',
        role: 'sales_rep'
      })

      // Create organization assigned to other user
      await request(app)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${otherUser.token}`)
        .send({
          name: 'Other User Restaurant',
          assigned_user_id: otherUser.id
        })

      // Original user should not see other user's organization
      const response = await request(app)
        .get('/api/v1/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      const orgNames = response.body.data.map((org: any) => org.name)
      expect(orgNames).not.toContain('Other User Restaurant')
    })
  })

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
})
```

### Database Integration Testing

Database integration testing validates data persistence, constraint enforcement, and transaction handling using real PostgreSQL instances.

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

  describe('Row Level Security', () => {
    it('enforces organization access restrictions', async () => {
      // This test would require setting up RLS policies and user contexts
      // Implementation depends on Supabase RLS configuration
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

### MCP-Enhanced Development Testing

The Kitchen Pantry CRM development environment includes Supabase MCP (Model Context Protocol) integration to enhance testing capabilities and streamline database testing workflows during development phases.

**MCP Testing Capabilities:**
- AI-assisted test data generation based on database schema
- Real-time query analysis and optimization during testing
- Interactive database exploration for test scenario validation
- Automated test database setup and teardown
- Schema-driven test case generation and validation

**Development Testing Workflow:**
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

**MCP Development Utilities:**
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

**Development-Only Security:**
MCP testing utilities are configured exclusively for development environments with restricted access controls. Production and staging environments do not include MCP integration, ensuring security separation between development and production systems.

**Enhanced Development Features:**
- Real-time database performance monitoring during tests
- AI-powered test scenario generation based on business requirements
- Automated test data cleanup and database state management
- Interactive debugging with database query analysis
- Schema migration testing with rollback validation

## End-to-End Testing Implementation

### User Journey Testing

End-to-end testing validates complete user workflows from frontend interactions through backend processing to database storage, ensuring the entire system works cohesively.

```typescript
// tests/e2e/organization-management.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Organization Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'testpassword123')
    await page.click('[data-testid="login-button"]')
    
    // Wait for dashboard to load
    await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible()
  })

  test('creates new organization successfully', async ({ page }) => {
    // Navigate to organizations page
    await page.click('[data-testid="nav-organizations"]')
    await expect(page.locator('[data-testid="organizations-title"]')).toBeVisible()

    // Click create organization button
    await page.click('[data-testid="create-organization-button"]')
    await expect(page.locator('[data-testid="organization-form"]')).toBeVisible()

    // Fill organization form
    await page.fill('[data-testid="organization-name"]', 'E2E Test Restaurant')
    await page.selectOption('[data-testid="industry-segment"]', 'Fine Dining')
    await page.selectOption('[data-testid="priority-level"]', 'A')
    await page.fill('[data-testid="primary-email"]', 'contact@e2etest.com')
    await page.fill('[data-testid="primary-phone"]', '+1234567890')
    await page.fill('[data-testid="annual-revenue"]', '1000000')

    // Submit form
    await page.click('[data-testid="save-organization-button"]')

    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Organization created successfully')

    // Verify organization appears in list
    await expect(page.locator('[data-testid="organization-list"]')).toContainText('E2E Test Restaurant')
    
    // Verify organization details
    await page.click('[data-testid="organization-row"]:has-text("E2E Test Restaurant")')
    await expect(page.locator('[data-testid="organization-detail-name"]')).toContainText('E2E Test Restaurant')
    await expect(page.locator('[data-testid="organization-detail-industry"]')).toContainText('Fine Dining')
    await expect(page.locator('[data-testid="organization-detail-priority"]')).toContainText('A')
  })

  test('validates form fields correctly', async ({ page }) => {
    await page.click('[data-testid="nav-organizations"]')
    await page.click('[data-testid="create-organization-button"]')

    // Submit empty form
    await page.click('[data-testid="save-organization-button"]')

    // Verify validation errors
    await expect(page.locator('[data-testid="name-error"]')).toContainText('Organization name is required')

    // Fill invalid email
    await page.fill('[data-testid="organization-name"]', 'Test Restaurant')
    await page.fill('[data-testid="primary-email"]', 'invalid-email')
    await page.click('[data-testid="save-organization-button"]')

    await expect(page.locator('[data-testid="email-error"]')).toContainText('Invalid email format')

    // Fix email and verify form submits
    await page.fill('[data-testid="primary-email"]', 'valid@email.com')
    await page.click('[data-testid="save-organization-button"]')

    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  })

  test('searches and filters organizations', async ({ page }) => {
    // Create test organizations first
    await createTestOrganization(page, 'Italian Bistro', 'Fine Dining', 'A')
    await createTestOrganization(page, 'Fast Burger', 'Fast Food', 'B')
    await createTestOrganization(page, 'Healthcare Catering', 'Healthcare', 'C')

    await page.goto('/organizations')

    // Test search functionality
    await page.fill('[data-testid="search-input"]', 'italian')
    await page.waitForTimeout(500) // Wait for debounced search

    await expect(page.locator('[data-testid="organization-list"]')).toContainText('Italian Bistro')
    await expect(page.locator('[data-testid="organization-list"]')).not.toContainText('Fast Burger')

    // Clear search
    await page.fill('[data-testid="search-input"]', '')
    await page.waitForTimeout(500)

    // Test priority filter
    await page.selectOption('[data-testid="priority-filter"]', 'A')
    await expect(page.locator('[data-testid="organization-list"]')).toContainText('Italian Bistro')
    await expect(page.locator('[data-testid="organization-list"]')).not.toContainText('Fast Burger')

    // Test industry filter
    await page.selectOption('[data-testid="priority-filter"]', '') // Clear priority filter
    await page.selectOption('[data-testid="industry-filter"]', 'Fast Food')
    await expect(page.locator('[data-testid="organization-list"]')).toContainText('Fast Burger')
    await expect(page.locator('[data-testid="organization-list"]')).not.toContainText('Italian Bistro')
  })

  test('updates organization information', async ({ page }) => {
    // Create test organization
    await createTestOrganization(page, 'Original Name', 'Fine Dining', 'B')

    await page.goto('/organizations')
    await page.click('[data-testid="organization-row"]:has-text("Original Name")')

    // Click edit button
    await page.click('[data-testid="edit-organization-button"]')
    await expect(page.locator('[data-testid="organization-form"]')).toBeVisible()

    // Update organization details
    await page.fill('[data-testid="organization-name"]', 'Updated Restaurant Name')
    await page.selectOption('[data-testid="priority-level"]', 'A')
    await page.fill('[data-testid="notes"]', 'Updated notes for this organization')

    // Save changes
    await page.click('[data-testid="save-organization-button"]')

    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Organization updated successfully')

    // Verify updated information
    await expect(page.locator('[data-testid="organization-detail-name"]')).toContainText('Updated Restaurant Name')
    await expect(page.locator('[data-testid="organization-detail-priority"]')).toContainText('A')
    await expect(page.locator('[data-testid="organization-detail-notes"]')).toContainText('Updated notes for this organization')
  })

  test('deletes organization with confirmation', async ({ page }) => {
    // Create test organization
    await createTestOrganization(page, 'To Be Deleted', 'Fine Dining', 'C')

    await page.goto('/organizations')
    await page.click('[data-testid="organization-row"]:has-text("To Be Deleted")')

    // Click delete button
    await page.click('[data-testid="delete-organization-button"]')

    // Verify confirmation dialog
    await expect(page.locator('[data-testid="confirmation-dialog"]')).toBeVisible()
    await expect(page.locator('[data-testid="confirmation-message"]')).toContainText('Are you sure you want to delete')

    // Cancel deletion
    await page.click('[data-testid="cancel-button"]')
    await expect(page.locator('[data-testid="confirmation-dialog"]')).not.toBeVisible()

    // Try deletion again and confirm
    await page.click('[data-testid="delete-organization-button"]')
    await page.click('[data-testid="confirm-button"]')

    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Organization deleted successfully')

    // Verify organization is removed from list
    await page.goto('/organizations')
    await expect(page.locator('[data-testid="organization-list"]')).not.toContainText('To Be Deleted')
  })

  test('handles network errors gracefully', async ({ page }) => {
    // Intercept API calls and simulate network error
    await page.route('**/api/v1/organizations', route => {
      route.abort('failed')
    })

    await page.goto('/organizations')

    // Verify error message is displayed
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Failed to load organizations')
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()

    // Remove network interception
    await page.unroute('**/api/v1/organizations')

    // Click retry button
    await page.click('[data-testid="retry-button"]')

    // Verify organizations load successfully
    await expect(page.locator('[data-testid="organizations-title"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).not.toBeVisible()
  })
})

// Helper function to create test organization
async function createTestOrganization(page: any, name: string, industry: string, priority: string) {
  await page.goto('/organizations')
  await page.click('[data-testid="create-organization-button"]')
  await page.fill('[data-testid="organization-name"]', name)
  await page.selectOption('[data-testid="industry-segment"]', industry)
  await page.selectOption('[data-testid="priority-level"]', priority)
  await page.click('[data-testid="save-organization-button"]')
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
}
```

### Cross-Browser and Device Testing

Cross-browser and device testing ensures consistent functionality across different platforms and screen sizes essential for food service professionals using various devices.

```typescript
// tests/e2e/cross-browser.spec.ts
import { test, expect, devices } from '@playwright/test'

// Test on different browsers
const browsers = ['chromium', 'firefox', 'webkit']

browsers.forEach(browserName => {
  test.describe(`${browserName} Browser Tests`, () => {
    test.use({ 
      ...devices['Desktop Chrome'],
      browserName: browserName as any
    })

    test('dashboard loads correctly', async ({ page }) => {
      await page.goto('/login')
      await page.fill('[data-testid="email-input"]', 'test@example.com')
      await page.fill('[data-testid="password-input"]', 'testpassword123')
      await page.click('[data-testid="login-button"]')

      await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible()
      await expect(page.locator('[data-testid="kpi-cards"]')).toBeVisible()
      await expect(page.locator('[data-testid="recent-activities"]')).toBeVisible()
    })

    test('navigation works correctly', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Test navigation to different sections
      await page.click('[data-testid="nav-organizations"]')
      await expect(page).toHaveURL(/.*\/organizations/)
      
      await page.click('[data-testid="nav-contacts"]')
      await expect(page).toHaveURL(/.*\/contacts/)
      
      await page.click('[data-testid="nav-interactions"]')
      await expect(page).toHaveURL(/.*\/interactions/)
    })
  })
})

// Test on different devices
const deviceTests = [
  { name: 'Desktop', device: devices['Desktop Chrome'] },
  { name: 'Tablet', device: devices['iPad Pro'] },
  { name: 'Mobile', device: devices['iPhone 12'] }
]

deviceTests.forEach(({ name, device }) => {
  test.describe(`${name} Device Tests`, () => {
    test.use(device)

    test('responsive layout works correctly', async ({ page }) => {
      await page.goto('/dashboard')

      if (name === 'Mobile') {
        // Mobile should show hamburger menu
        await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
        await expect(page.locator('[data-testid="desktop-sidebar"]')).not.toBeVisible()
        
        // Test mobile menu functionality
        await page.click('[data-testid="mobile-menu-button"]')
        await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
        
        await page.click('[data-testid="mobile-nav-organizations"]')
        await expect(page).toHaveURL(/.*\/organizations/)
      } else {
        // Desktop and tablet should show sidebar
        await expect(page.locator('[data-testid="desktop-sidebar"]')).toBeVisible()
        await expect(page.locator('[data-testid="mobile-menu-button"]')).not.toBeVisible()
      }
    })

    test('touch interactions work correctly', async ({ page }) => {
      if (name !== 'Desktop') {
        await page.goto('/organizations')
        
        // Test touch-friendly button sizes
        const createButton = page.locator('[data-testid="create-organization-button"]')
        const buttonBox = await createButton.boundingBox()
        
        // Verify minimum touch target size (44px)
        expect(buttonBox?.height).toBeGreaterThanOrEqual(44)
        
        // Test swipe gestures (if implemented)
        // This would depend on specific swipe gesture implementation
      }
    })

    test('forms work correctly on device', async ({ page }) => {
      await page.goto('/organizations')
      await page.click('[data-testid="create-organization-button"]')

      // Test form input on different devices
      await page.fill('[data-testid="organization-name"]', 'Device Test Restaurant')
      await page.selectOption('[data-testid="industry-segment"]', 'Fine Dining')
      
      if (name === 'Mobile') {
        // Mobile keyboards might affect viewport
        await page.waitForTimeout(500)
      }
      
      await page.click('[data-testid="save-organization-button"]')
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    })
  })
})
```

## Performance Testing

### Load Testing Implementation

Performance testing validates system behavior under various load conditions, ensuring the Kitchen Pantry CRM can handle expected user volumes and data processing requirements.

```typescript
// tests/performance/load-test.ts
import { check, sleep } from 'k6'
import http from 'k6/http'
import { Rate, Trend } from 'k6/metrics'

// Custom metrics
const errorRate = new Rate('errors')
const responseTime = new Trend('response_time')

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 20 }, // Stay at 20 users
    { duration: '2m', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate must be below 10%
    errors: ['rate<0.1'],
  },
}

const BASE_URL = 'https://api.kitchenpantry.com'
let authToken: string

export function setup() {
  // Login to get auth token
  const loginResponse = http.post(`${BASE_URL}/auth/login`, {
    email: 'loadtest@example.com',
    password: 'loadtestpassword123'
  })
  
  const token = loginResponse.json('access_token')
  return { authToken: token }
}

export default function(data: any) {
  authToken = data.authToken
  
  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  }

  // Test scenario: Browse organizations
  testGetOrganizations(headers)
  sleep(1)

  // Test scenario: Create organization
  testCreateOrganization(headers)
  sleep(1)

  // Test scenario: Search functionality
  testSearchOrganizations(headers)
  sleep(1)

  // Test scenario: Get organization details
  testGetOrganizationDetails(headers)
  sleep(1)
}

function testGetOrganizations(headers: any) {
  const response = http.get(`${BASE_URL}/api/v1/organizations?page=1&limit=50`, { headers })
  
  const success = check(response, {
    'organizations list status is 200': (r) => r.status === 200,
    'organizations list response time < 500ms': (r) => r.timings.duration < 500,
    'organizations list has data': (r) => {
      const body = r.json() as any
      return body.success === true && Array.isArray(body.data)
    }
  })

  errorRate.add(!success)
  responseTime.add(response.timings.duration)
}

function testCreateOrganization(headers: any) {
  const organizationData = {
    name: `Load Test Restaurant ${Math.random().toString(36).substr(2, 9)}`,
    industry_segment: 'Fine Dining',
    priority_level: 'B',
    primary_email: `loadtest${Math.random().toString(36).substr(2, 5)}@example.com`
  }

  const response = http.post(`${BASE_URL}/api/v1/organizations`, JSON.stringify(organizationData), { headers })
  
  const success = check(response, {
    'create organization status is 201': (r) => r.status === 201,
    'create organization response time < 1000ms': (r) => r.timings.duration < 1000,
    'create organization returns ID': (r) => {
      const body = r.json() as any
      return body.success === true && body.data.id
    }
  })

  errorRate.add(!success)
  responseTime.add(response.timings.duration)
}

function testSearchOrganizations(headers: any) {
  const searchTerms = ['restaurant', 'bistro', 'cafe', 'dining', 'food']
  const searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)]
  
  const response = http.get(`${BASE_URL}/api/v1/organizations?search=${searchTerm}`, { headers })
  
  const success = check(response, {
    'search organizations status is 200': (r) => r.status === 200,
    'search organizations response time < 800ms': (r) => r.timings.duration < 800,
    'search organizations returns results': (r) => {
      const body = r.json() as any
      return body.success === true && Array.isArray(body.data)
    }
  })

  errorRate.add(!success)
  responseTime.add(response.timings.duration)
}

function testGetOrganizationDetails(headers: any) {
  // First get list of organizations to get a valid ID
  const listResponse = http.get(`${BASE_URL}/api/v1/organizations?limit=1`, { headers })
  
  if (listResponse.status === 200) {
    const body = listResponse.json() as any
    if (body.data && body.data.length > 0) {
      const organizationId = body.data[0].id
      
      const detailResponse = http.get(`${BASE_URL}/api/v1/organizations/${organizationId}`, { headers })
      
      const success = check(detailResponse, {
        'organization detail status is 200': (r) => r.status === 200,
        'organization detail response time < 600ms': (r) => r.timings.duration < 600,
        'organization detail has complete data': (r) => {
          const detailBody = r.json() as any
          return detailBody.success === true && 
                 detailBody.data.id === organizationId &&
                 detailBody.data.contacts !== undefined
        }
      })

      errorRate.add(!success)
      responseTime.add(detailResponse.timings.duration)
    }
  }
}

export function teardown(data: any) {
  // Cleanup test data if needed
  console.log('Load test completed')
}
```

### Frontend Performance Testing

Frontend performance testing validates client-side performance including bundle sizes, loading times, and runtime performance.

```typescript
// tests/performance/lighthouse.test.ts
import { test, expect } from '@playwright/test'
import { playAudit } from 'playwright-lighthouse'

test.describe('Lighthouse Performance Tests', () => {
  test('dashboard page meets performance standards', async ({ page, browserName }) => {
    // Skip webkit for lighthouse tests
    test.skip(browserName === 'webkit', 'Lighthouse not supported on webkit')

    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'testpassword123')
    await page.click('[data-testid="login-button"]')
    
    await page.waitForSelector('[data-testid="dashboard-title"]')

    await playAudit({
      page,
      thresholds: {
        performance: 80,
        accessibility: 90,
        'best-practices': 80,
        seo: 80,
        pwa: 80
      },
      port: 9222
    })
  })

  test('organizations page loads efficiently', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Lighthouse not supported on webkit')

    await page.goto('/organizations')

    await playAudit({
      page,
      thresholds: {
        performance: 75,
        accessibility: 90,
        'best-practices': 80
      },
      port: 9222
    })
  })
})

// Bundle size analysis
test.describe('Bundle Size Tests', () => {
  test('main bundle size is within limits', async ({ page }) => {
    // Navigate to app and analyze network requests
    const responses: any[] = []
    
    page.on('response', response => {
      if (response.url().includes('.js') || response.url().includes('.css')) {
        responses.push({
          url: response.url(),
          size: response.headers()['content-length']
        })
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Analyze bundle sizes
    const jsFiles = responses.filter(r => r.url.includes('.js'))
    const cssFiles = responses.filter(r => r.url.includes('.css'))

    const totalJsSize = jsFiles.reduce((sum, file) => sum + parseInt(file.size || '0'), 0)
    const totalCssSize = cssFiles.reduce((sum, file) => sum + parseInt(file.size || '0'), 0)

    // Assert bundle size limits
    expect(totalJsSize).toBeLessThan(500 * 1024) // 500KB limit for JS
    expect(totalCssSize).toBeLessThan(100 * 1024) // 100KB limit for CSS

    console.log(`Total JS size: ${totalJsSize / 1024}KB`)
    console.log(`Total CSS size: ${totalCssSize / 1024}KB`)
  })
})
```

## Quality Assurance Processes

### Code Quality Standards

The Kitchen Pantry CRM implements comprehensive code quality standards with automated enforcement and continuous monitoring.

**Linting and Formatting:** ESLint and Prettier enforce consistent code style and identify potential issues. Linting rules include TypeScript-specific rules, Vue.js best practices, and accessibility guidelines.

**Code Coverage Requirements:** Minimum 80% code coverage for unit tests with higher requirements for critical business logic. Coverage reports include branch coverage, function coverage, and line coverage metrics.

**Code Review Process:** All code changes require peer review with specific checklists for security, performance, and maintainability. Code reviews include automated checks for test coverage, linting compliance, and security vulnerabilities.

```json
// .eslintrc.json
{
  "extends": [
    "@vue/typescript/recommended",
    "@vue/prettier",
    "plugin:vue/vue3-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:jsx-a11y/recommended"
  ],
  "rules": {
    "vue/component-name-in-template-casing": ["error", "PascalCase"],
    "vue/require-default-prop": "error",
    "vue/require-prop-types": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "jsx-a11y/click-events-have-key-events": "error",
    "jsx-a11y/no-static-element-interactions": "error"
  },
  "overrides": [
    {
      "files": ["**/*.test.ts", "**/*.spec.ts"],
      "rules": {
        "@typescript-eslint/no-explicit-any": "off"
      }
    }
  ]
}
```

### Continuous Integration Pipeline

The CI/CD pipeline includes comprehensive quality gates with automated testing, security scanning, and deployment validation.

```yaml
# .github/workflows/quality-assurance.yml
name: Quality Assurance

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  code-quality:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run type checking
      run: npm run type-check
    
    - name: Check code formatting
      run: npm run format:check

  unit-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm run test:unit -- --coverage
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
    
    - name: Check coverage thresholds
      run: npm run test:coverage-check

  integration-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run database migrations
      run: npm run migrate:test
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Playwright
      run: npx playwright install --with-deps
    
    - name: Build application
      run: npm run build
    
    - name: Start application
      run: npm run preview &
      
    - name: Wait for application
      run: npx wait-on http://localhost:4173
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: playwright-report
        path: playwright-report/

  security-scan:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Run security audit
      run: npm audit --audit-level high
    
    - name: Run dependency vulnerability scan
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  performance-tests:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Run Lighthouse CI
      run: npm run lighthouse:ci
    
    - name: Run load tests
      run: npm run test:load
```

### Manual Testing Procedures

Manual testing procedures complement automated testing with human validation of user experience, accessibility, and edge cases.

**Usability Testing:** Regular usability testing sessions with food service industry professionals validate user workflows and identify improvement opportunities. Usability testing includes task completion rates, error rates, and user satisfaction metrics.

**Accessibility Testing:** Manual accessibility testing with screen readers, keyboard navigation, and assistive technologies ensures compliance with WCAG guidelines. Accessibility testing includes color contrast validation, focus management, and semantic markup verification.

**Exploratory Testing:** Structured exploratory testing sessions identify edge cases and unexpected behaviors not covered by automated tests. Exploratory testing includes boundary value testing, negative testing, and integration scenario validation.

## Conclusion

The Kitchen Pantry CRM testing strategy provides comprehensive quality assurance through multiple testing levels, automated execution, and continuous improvement processes. The multi-level testing pyramid ensures efficient test execution while maintaining thorough coverage of critical functionality.

The testing framework emphasizes user-centric validation, performance optimization, and security compliance essential for food service industry applications. Comprehensive integration testing validates system behavior while end-to-end testing ensures complete user workflow functionality.

This testing strategy serves as the foundation for maintaining high-quality software delivery throughout the Kitchen Pantry CRM development lifecycle, providing confidence in system reliability and user satisfaction essential for successful CRM operations in the food service industry.

