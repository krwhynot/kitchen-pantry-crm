# Authentication Testing Utilities

This directory contains comprehensive testing utilities for authentication functionality in the Kitchen Pantry CRM system.

## Overview

The authentication testing utilities provide:

- **Test Data Creation**: Generate realistic test users, organizations, and authentication scenarios
- **Test Factories**: Create predefined test scenarios (basic, multi-user, multi-organization, role-based)
- **Mock Utilities**: Mock authentication middleware and create mock requests/responses
- **Test Assertions**: Common assertions for authentication testing
- **Cleanup Utilities**: Clean up test data after tests complete

## Files

### `auth-test-utils.ts`
Core utilities for creating test data and authentication scenarios.

**Key Functions:**
- `createTestUser()` - Creates a test user with authentication tokens
- `createTestOrganization()` - Creates a test organization
- `createTestUsers()` - Creates multiple test users with different roles
- `createAuthenticatedRequest()` - Creates mock request with authentication
- `authAssertions` - Common authentication assertions

### `auth-test-factory.ts`
Factory class for creating different authentication test scenarios.

**Key Features:**
- `createAuthScenario()` - Creates predefined test scenarios
- `createAuthFlowTestData()` - Creates data for authentication flow testing
- `createPermissionTestData()` - Creates data for permission testing
- `cleanup()` - Cleans up all created test data

### `auth-middleware-mocks.ts`
Mock utilities for testing authentication middleware.

**Key Features:**
- `mockAuthMiddleware()` - Mock successful authentication
- `mockAuthFailureMiddleware()` - Mock authentication failure
- `authMiddlewareTestHelpers` - Helper functions for testing middleware
- `authTestScenarios` - Common authentication test scenarios

## Usage Examples

### Basic Authentication Test

```typescript
import { AuthTestFactory, authAssertions } from '../utils/testing'

describe('Authentication', () => {
  let authFactory: AuthTestFactory

  beforeEach(() => {
    authFactory = new AuthTestFactory()
  })

  afterEach(async () => {
    await authFactory.cleanup()
  })

  it('should authenticate user successfully', async () => {
    const scenario = await authFactory.createBasicScenario()
    
    const response = await login(scenario.user.email, scenario.user.password)
    
    authAssertions.expectAuthSuccess(response)
  })
})
```

### Role-Based Authorization Test

```typescript
import { AuthTestFactory, authMiddlewareTestHelpers } from '../utils/testing'
import { requireAdmin } from '../../middleware/auth'

describe('Role-Based Authorization', () => {
  let authFactory: AuthTestFactory

  beforeEach(() => {
    authFactory = new AuthTestFactory()
  })

  afterEach(async () => {
    await authFactory.cleanup()
  })

  it('should allow admin access', async () => {
    const scenario = await authFactory.createRoleBasedScenario()
    
    await authMiddlewareTestHelpers.testRoleAuthorization(
      requireAdmin,
      scenario.admins[0],
      true // expect success
    )
  })

  it('should deny non-admin access', async () => {
    const scenario = await authFactory.createRoleBasedScenario()
    
    await authMiddlewareTestHelpers.testRoleAuthorization(
      requireAdmin,
      scenario.salesReps[0],
      false // expect failure
    )
  })
})
```

### Multi-Organization Test

```typescript
import { AuthTestFactory } from '../utils/testing'

describe('Multi-Organization', () => {
  let authFactory: AuthTestFactory

  beforeEach(() => {
    authFactory = new AuthTestFactory()
  })

  afterEach(async () => {
    await authFactory.cleanup()
  })

  it('should isolate data between organizations', async () => {
    const scenario = await authFactory.createMultiOrgScenario()
    
    const orgAUser = scenario.orgA.users.admin
    const orgBUser = scenario.orgB.users.admin
    
    // Test that users can only access their own organization's data
    // ... test implementation
  })
})
```

### Authentication Flow Test

```typescript
import { AuthTestFactory } from '../utils/testing'

describe('Authentication Flow', () => {
  let authFactory: AuthTestFactory

  beforeEach(() => {
    authFactory = new AuthTestFactory()
  })

  afterEach(async () => {
    await authFactory.cleanup()
  })

  it('should complete full authentication flow', async () => {
    const testData = await authFactory.createAuthFlowTestData()
    
    // Test registration
    const registerResponse = await register(testData.validRegistrationData)
    expect(registerResponse.status).toBe('success')
    
    // Test login
    const loginResponse = await login(testData.credentials.validLogin)
    expect(loginResponse.status).toBe('success')
    
    // Test logout
    const logoutResponse = await logout(loginResponse.data.session.access_token)
    expect(logoutResponse.status).toBe('success')
  })
})
```

## Test Scenarios

### Basic Scenario
- One organization
- One user (sales_rep role)
- Basic authentication testing

### Multi-User Scenario
- One organization
- Multiple users with different roles (admin, manager, sales_rep)
- Role-based authorization testing

### Multi-Organization Scenario
- Multiple organizations
- Users in each organization
- Multi-tenant testing

### Role-Based Scenario
- One organization
- Multiple users for each role
- Comprehensive role-based testing

## Test Data Management

### Automatic Cleanup
All test factories automatically clean up created data:

```typescript
afterEach(async () => {
  await authFactory.cleanup()
})
```

### Manual Cleanup
For comprehensive cleanup:

```typescript
import { cleanupAllTestData } from '../utils/testing'

afterAll(async () => {
  await cleanupAllTestData()
})
```

## Best Practices

### 1. Use Factories
Always use the `AuthTestFactory` to create test data:

```typescript
// Good
const authFactory = new AuthTestFactory()
const scenario = await authFactory.createBasicScenario()

// Avoid
const user = await createTestUser({ /* manual config */ })
```

### 2. Clean Up After Tests
Always clean up test data:

```typescript
afterEach(async () => {
  await authFactory.cleanup()
})
```

### 3. Use Appropriate Scenarios
Choose the right scenario for your test:

```typescript
// For basic authentication tests
const scenario = await authFactory.createBasicScenario()

// For role-based authorization tests
const scenario = await authFactory.createRoleBasedScenario()

// For multi-tenant tests
const scenario = await authFactory.createMultiOrgScenario()
```

### 4. Use Test Assertions
Use the provided assertions for consistent testing:

```typescript
import { authAssertions } from '../utils/testing'

// Test successful authentication
authAssertions.expectAuthSuccess(response)

// Test valid user object
authAssertions.expectValidUser(user)

// Test valid token
authAssertions.expectValidToken(token)
```

### 5. Mock Middleware Properly
Use the middleware test helpers for consistent testing:

```typescript
import { authMiddlewareTestHelpers } from '../utils/testing'

await authMiddlewareTestHelpers.testValidAuthentication(middleware, user)
await authMiddlewareTestHelpers.testInvalidAuthentication(middleware)
await authMiddlewareTestHelpers.testRoleAuthorization(middleware, user, expectSuccess)
```

## Security Considerations

### Test Environment Only
These utilities are designed for testing only:

- Never use in production
- Include safety checks to prevent production usage
- Use mock data that doesn't expose real information

### Data Isolation
Test data is isolated:

- Uses unique identifiers to prevent conflicts
- Cleans up after each test
- Does not interfere with real application data

### Authentication Testing
Test authentication securely:

- Use proper mock tokens
- Test both success and failure scenarios
- Validate security headers and responses

## Troubleshooting

### Common Issues

1. **Test Data Not Cleaning Up**
   - Ensure `authFactory.cleanup()` is called in `afterEach`
   - Check for database connection issues

2. **Authentication Failures**
   - Verify mock tokens are properly configured
   - Check that test users are created with valid credentials

3. **Role Authorization Issues**
   - Ensure test users have correct roles assigned
   - Verify role-based middleware is working correctly

### Debug Mode
Enable debug logging in tests:

```typescript
process.env.LOG_LEVEL = 'debug'
```

## Contributing

When adding new authentication testing utilities:

1. Follow the existing patterns and conventions
2. Add comprehensive documentation
3. Include usage examples
4. Add proper error handling
5. Ensure cleanup functionality works correctly
6. Write tests for the test utilities themselves