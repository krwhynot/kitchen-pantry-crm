# Unit Testing Implementation

## Overview

Unit testing focuses on testing individual components and functions in isolation. The Kitchen Pantry CRM emphasizes **user-centric testing approaches** for frontend components and **business logic validation** for backend services.

## Frontend Component Testing

### Vue.js Component Testing Strategy

Vue.js component testing emphasizes **user interaction patterns** and **component behavior validation** using Vue Testing Library principles. Tests focus on **user-visible behavior** rather than implementation details.

#### Button Component Example

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
```

#### DataTable Component Example

```typescript
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

### Component Testing Best Practices

#### Test Structure
- **Arrange**: Set up component props and environment
- **Act**: Trigger user interactions or state changes
- **Assert**: Verify expected behavior and output

#### User-Centric Queries
- **getByRole**: Find elements by their semantic role
- **getByLabelText**: Find form elements by their labels
- **getByText**: Find elements by their text content
- **getByTestId**: Find elements by test identifiers (last resort)

#### Event Testing
- **fireEvent**: Simulate user interactions
- **userEvent**: More realistic user behavior simulation
- **waitFor**: Handle asynchronous operations

## Backend Unit Testing

### Service Layer Testing

Backend unit testing focuses on **business logic validation**, **API endpoint behavior**, and **service integration patterns**. Tests emphasize **data validation**, **error handling**, and **security compliance**.

#### Organization Service Example

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
})
```

### Middleware Testing

#### Validation Middleware Example

```typescript
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

## Utility and Helper Testing

### Validation Service Testing

Utility functions and helper modules require **comprehensive testing** to ensure reliability across the application. These tests focus on **edge cases**, **error handling**, and **performance characteristics**.

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

## Testing Best Practices

### Test Organization
- **Descriptive names**: Clear test descriptions explaining expected behavior
- **Logical grouping**: Related tests grouped in describe blocks
- **Setup and teardown**: Consistent test environment preparation

### Mocking Strategy
- **Mock external dependencies**: Isolate units under test
- **Mock at boundaries**: Mock service calls and database operations
- **Realistic mocks**: Mocks that reflect actual behavior

### Error Testing
- **Expected errors**: Test error conditions and edge cases
- **Error messages**: Verify error messages are helpful and actionable
- **Error handling**: Ensure errors are handled gracefully

### Performance Considerations
- **Fast execution**: Unit tests should run quickly
- **Isolated tests**: Tests should not depend on each other
- **Resource cleanup**: Clean up resources after tests complete

---

This unit testing implementation provides comprehensive coverage of frontend components, backend services, and utility functions while maintaining fast execution and reliable results.