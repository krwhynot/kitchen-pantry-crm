import { Request, Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../../middleware/auth'
import { TestUser } from './auth-test-utils'

/**
 * Mock authentication middleware for testing
 */
export const mockAuthMiddleware = (user: TestUser) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId
    }
    next()
  }
}

/**
 * Mock authentication middleware that simulates authentication failure
 */
export const mockAuthFailureMiddleware = (errorMessage: string = 'Authentication failed') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const error = new Error(errorMessage)
    ;(error as any).status = 401
    next(error)
  }
}

/**
 * Mock authentication middleware that simulates missing token
 */
export const mockMissingTokenMiddleware = () => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const error = new Error('Access token is required')
    ;(error as any).status = 401
    next(error)
  }
}

/**
 * Mock authentication middleware that simulates expired token
 */
export const mockExpiredTokenMiddleware = () => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const error = new Error('Token has expired')
    ;(error as any).status = 401
    next(error)
  }
}

/**
 * Mock role-based middleware for testing
 */
export const mockRoleMiddleware = (allowedRoles: string[], userRole: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!allowedRoles.includes(userRole)) {
      const error = new Error('Insufficient permissions')
      ;(error as any).status = 403
      return next(error)
    }
    next()
  }
}

/**
 * Mock optional authentication middleware
 */
export const mockOptionalAuthMiddleware = (user?: TestUser) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId
      }
    }
    next()
  }
}

/**
 * Creates a mock request with authentication headers
 */
export const createMockRequestWithAuth = (
  user: TestUser,
  overrides: Partial<Request> = {}
): AuthenticatedRequest => {
  return {
    headers: {
      authorization: `Bearer ${user.accessToken}`,
      'content-type': 'application/json',
      ...overrides.headers
    },
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId
    },
    body: {},
    params: {},
    query: {},
    method: 'GET',
    url: '/',
    ...overrides
  } as AuthenticatedRequest
}

/**
 * Creates a mock request without authentication
 */
export const createMockRequestWithoutAuth = (
  overrides: Partial<Request> = {}
): Request => {
  return {
    headers: {
      'content-type': 'application/json',
      ...overrides.headers
    },
    body: {},
    params: {},
    query: {},
    method: 'GET',
    url: '/',
    ...overrides
  } as Request
}

/**
 * Creates a mock request with invalid authentication
 */
export const createMockRequestWithInvalidAuth = (
  overrides: Partial<Request> = {}
): Request => {
  return {
    headers: {
      authorization: 'Bearer invalid-token',
      'content-type': 'application/json',
      ...overrides.headers
    },
    body: {},
    params: {},
    query: {},
    method: 'GET',
    url: '/',
    ...overrides
  } as Request
}

/**
 * Authentication middleware test helpers
 */
export const authMiddlewareTestHelpers = {
  /**
   * Tests that middleware properly authenticates a valid user
   */
  testValidAuthentication: async (
    middleware: Function,
    user: TestUser,
    expectedUser?: Partial<TestUser>
  ) => {
    const req = createMockRequestWithAuth(user)
    const res = {} as Response
    const next = jest.fn()

    await middleware(req, res, next)

    expect(next).toHaveBeenCalledWith()
    expect(req.user).toBeDefined()
    expect(req.user!.id).toBe(expectedUser?.id || user.id)
    expect(req.user!.email).toBe(expectedUser?.email || user.email)
    expect(req.user!.role).toBe(expectedUser?.role || user.role)
  },

  /**
   * Tests that middleware properly rejects invalid authentication
   */
  testInvalidAuthentication: async (
    middleware: Function,
    expectedError: string = 'Authentication failed'
  ) => {
    const req = createMockRequestWithInvalidAuth()
    const res = {} as Response
    const next = jest.fn()

    await middleware(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining(expectedError)
    }))
    expect(req.user).toBeUndefined()
  },

  /**
   * Tests that middleware properly handles missing authentication
   */
  testMissingAuthentication: async (
    middleware: Function,
    expectedError: string = 'Access token is required'
  ) => {
    const req = createMockRequestWithoutAuth()
    const res = {} as Response
    const next = jest.fn()

    await middleware(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining(expectedError)
    }))
    expect(req.user).toBeUndefined()
  },

  /**
   * Tests role-based authorization
   */
  testRoleAuthorization: async (
    middleware: Function,
    user: TestUser,
    expectedSuccess: boolean
  ) => {
    const req = createMockRequestWithAuth(user)
    const res = {} as Response
    const next = jest.fn()

    await middleware(req, res, next)

    if (expectedSuccess) {
      expect(next).toHaveBeenCalledWith()
    } else {
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Insufficient permissions')
      }))
    }
  }
}

/**
 * Common authentication test scenarios
 */
export const authTestScenarios = {
  validAuthentication: {
    description: 'Valid authentication with proper token',
    setup: (user: TestUser) => createMockRequestWithAuth(user),
    expectSuccess: true
  },

  invalidToken: {
    description: 'Invalid authentication token',
    setup: () => createMockRequestWithInvalidAuth(),
    expectSuccess: false,
    expectedError: 'Invalid or expired token'
  },

  missingToken: {
    description: 'Missing authentication token',
    setup: () => createMockRequestWithoutAuth(),
    expectSuccess: false,
    expectedError: 'Access token is required'
  },

  expiredToken: {
    description: 'Expired authentication token',
    setup: () => createMockRequestWithInvalidAuth({
      headers: { authorization: 'Bearer expired-token' }
    }),
    expectSuccess: false,
    expectedError: 'Token has expired'
  },

  malformedToken: {
    description: 'Malformed authentication token',
    setup: () => createMockRequestWithoutAuth({
      headers: { authorization: 'InvalidFormat' }
    }),
    expectSuccess: false,
    expectedError: 'Access token is required'
  }
}

/**
 * Role-based authorization test scenarios
 */
export const roleTestScenarios = {
  adminAccess: {
    description: 'Admin role access',
    allowedRoles: ['admin'],
    testRoles: {
      admin: { expectSuccess: true },
      manager: { expectSuccess: false },
      sales_rep: { expectSuccess: false }
    }
  },

  managerOrAdminAccess: {
    description: 'Manager or Admin role access',
    allowedRoles: ['manager', 'admin'],
    testRoles: {
      admin: { expectSuccess: true },
      manager: { expectSuccess: true },
      sales_rep: { expectSuccess: false }
    }
  },

  anyRoleAccess: {
    description: 'Any authenticated role access',
    allowedRoles: ['admin', 'manager', 'sales_rep'],
    testRoles: {
      admin: { expectSuccess: true },
      manager: { expectSuccess: true },
      sales_rep: { expectSuccess: true }
    }
  }
}