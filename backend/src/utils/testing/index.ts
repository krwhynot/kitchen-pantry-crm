/**
 * Authentication Testing Utilities
 * 
 * This module provides comprehensive testing utilities for authentication
 * functionality in the Kitchen Pantry CRM system.
 */

// Core authentication testing utilities
export * from './auth-test-utils'

// Authentication test factory for creating test scenarios
export * from './auth-test-factory'

// Authentication middleware mocks and test helpers
export * from './auth-middleware-mocks'

// Re-export commonly used testing utilities
export {
  TestUser,
  TestOrganization,
  createTestUser,
  createTestOrganization,
  createTestUsers,
  createAuthenticatedRequest,
  createMockResponse,
  createMockNext,
  authAssertions,
  cleanupAllTestData
} from './auth-test-utils'

export {
  AuthTestFactory
} from './auth-test-factory'

export {
  mockAuthMiddleware,
  mockAuthFailureMiddleware,
  authMiddlewareTestHelpers,
  authTestScenarios,
  roleTestScenarios
} from './auth-middleware-mocks'