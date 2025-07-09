import { Response } from 'express'
import { 
  authenticateToken, 
  requireRole, 
  requireAdmin, 
  requireManagerOrAdmin, 
  requireAnyRole, 
  optionalAuth 
} from '../../middleware/auth'
import { AuthTestFactory } from '../../utils/testing/auth-test-factory'
import { 
  createMockResponse, 
  createMockNext, 
  cleanupAllTestData
} from '../../utils/testing/auth-test-utils'
import { 
  createMockRequestWithAuth, 
  createMockRequestWithInvalidAuth, 
  createMockRequestWithoutAuth,
  authMiddlewareTestHelpers,
  roleTestScenarios
} from '../../utils/testing/auth-middleware-mocks'

describe('Authentication Middleware', () => {
  let authFactory: AuthTestFactory
  let mockResponse: Response
  let mockNext: jest.MockedFunction<any>

  beforeEach(() => {
    authFactory = new AuthTestFactory()
    mockResponse = createMockResponse()
    mockNext = createMockNext()
  })

  afterEach(async () => {
    await authFactory.cleanup()
  })

  afterAll(async () => {
    await cleanupAllTestData()
  })

  describe('authenticateToken', () => {
    it('should authenticate valid token successfully', async () => {
      const scenario = await authFactory.createBasicScenario()
      
      await authMiddlewareTestHelpers.testValidAuthentication(
        authenticateToken,
        scenario.user
      )
    })

    it('should reject invalid token', async () => {
      await authMiddlewareTestHelpers.testInvalidAuthentication(
        authenticateToken,
        'Invalid or expired token'
      )
    })

    it('should reject missing token', async () => {
      await authMiddlewareTestHelpers.testMissingAuthentication(
        authenticateToken,
        'Access token is required'
      )
    })

    it('should reject malformed authorization header', async () => {
      const req = createMockRequestWithoutAuth({
        headers: { authorization: 'InvalidFormat' }
      })

      await authenticateToken(req, mockResponse, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Access token is required'
      }))
    })

    it('should handle authentication errors gracefully', async () => {
      const req = createMockRequestWithInvalidAuth({
        headers: { authorization: 'Bearer expired-or-invalid-token' }
      })

      await authenticateToken(req, mockResponse, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Invalid or expired token')
      }))
    })
  })

  describe('requireRole', () => {
    it('should allow access for users with correct role', async () => {
      const scenario = await authFactory.createRoleBasedScenario()
      
      const adminOnlyMiddleware = requireRole(['admin'])
      const req = createMockRequestWithAuth(scenario.admins[0])

      await adminOnlyMiddleware(req, mockResponse, mockNext)

      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should deny access for users with incorrect role', async () => {
      const scenario = await authFactory.createRoleBasedScenario()
      
      const adminOnlyMiddleware = requireRole(['admin'])
      const req = createMockRequestWithAuth(scenario.salesReps[0])

      await adminOnlyMiddleware(req, mockResponse, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Insufficient permissions'
      }))
    })

    it('should deny access for unauthenticated users', async () => {
      const adminOnlyMiddleware = requireRole(['admin'])
      const req = createMockRequestWithoutAuth()

      await adminOnlyMiddleware(req, mockResponse, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'User not authenticated'
      }))
    })
  })

  describe('requireAdmin', () => {
    it('should allow access for admin users', async () => {
      const scenario = await authFactory.createRoleBasedScenario()
      
      const req = createMockRequestWithAuth(scenario.admins[0])
      await requireAdmin(req, mockResponse, mockNext)

      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should deny access for non-admin users', async () => {
      const scenario = await authFactory.createRoleBasedScenario()
      
      const req = createMockRequestWithAuth(scenario.managers[0])
      await requireAdmin(req, mockResponse, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Insufficient permissions'
      }))
    })
  })

  describe('requireManagerOrAdmin', () => {
    it('should allow access for admin users', async () => {
      const scenario = await authFactory.createRoleBasedScenario()
      
      const req = createMockRequestWithAuth(scenario.admins[0])
      await requireManagerOrAdmin(req, mockResponse, mockNext)

      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should allow access for manager users', async () => {
      const scenario = await authFactory.createRoleBasedScenario()
      
      const req = createMockRequestWithAuth(scenario.managers[0])
      await requireManagerOrAdmin(req, mockResponse, mockNext)

      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should deny access for sales rep users', async () => {
      const scenario = await authFactory.createRoleBasedScenario()
      
      const req = createMockRequestWithAuth(scenario.salesReps[0])
      await requireManagerOrAdmin(req, mockResponse, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Insufficient permissions'
      }))
    })
  })

  describe('requireAnyRole', () => {
    it('should allow access for any authenticated user', async () => {
      const scenario = await authFactory.createRoleBasedScenario()
      
      // Test all roles
      for (const user of scenario.users) {
        const req = createMockRequestWithAuth(user)
        const next = createMockNext()
        
        await requireAnyRole(req, mockResponse, next)
        expect(next).toHaveBeenCalledWith()
      }
    })

    it('should deny access for unauthenticated users', async () => {
      const req = createMockRequestWithoutAuth()
      await requireAnyRole(req, mockResponse, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'User not authenticated'
      }))
    })
  })

  describe('optionalAuth', () => {
    it('should authenticate user if valid token provided', async () => {
      const scenario = await authFactory.createBasicScenario()
      
      const req = createMockRequestWithAuth(scenario.user)
      await optionalAuth(req, mockResponse, mockNext)

      expect(mockNext).toHaveBeenCalledWith()
      expect(req.user).toBeDefined()
      expect(req.user!.id).toBe(scenario.user.id)
    })

    it('should continue without authentication if no token provided', async () => {
      const req = createMockRequestWithoutAuth()
      await optionalAuth(req, mockResponse, mockNext)

      expect(mockNext).toHaveBeenCalledWith()
      expect(req.user).toBeUndefined()
    })

    it('should continue without authentication if invalid token provided', async () => {
      const req = createMockRequestWithInvalidAuth()
      await optionalAuth(req, mockResponse, mockNext)

      expect(mockNext).toHaveBeenCalledWith()
      expect(req.user).toBeUndefined()
    })
  })

  describe('Role-based Authorization Scenarios', () => {
    it('should test admin-only access scenarios', async () => {
      const scenario = await authFactory.createRoleBasedScenario()
      const testScenario = roleTestScenarios.adminAccess

      for (const [role, expectation] of Object.entries(testScenario.testRoles)) {
        const user = scenario.roleGroups[role as keyof typeof scenario.roleGroups][0]
        
        await authMiddlewareTestHelpers.testRoleAuthorization(
          requireRole(testScenario.allowedRoles),
          user,
          expectation.expectSuccess
        )
      }
    })

    it('should test manager-or-admin access scenarios', async () => {
      const scenario = await authFactory.createRoleBasedScenario()
      const testScenario = roleTestScenarios.managerOrAdminAccess

      for (const [role, expectation] of Object.entries(testScenario.testRoles)) {
        const user = scenario.roleGroups[role as keyof typeof scenario.roleGroups][0]
        
        await authMiddlewareTestHelpers.testRoleAuthorization(
          requireRole(testScenario.allowedRoles),
          user,
          expectation.expectSuccess
        )
      }
    })

    it('should test any-role access scenarios', async () => {
      const scenario = await authFactory.createRoleBasedScenario()
      const testScenario = roleTestScenarios.anyRoleAccess

      for (const [role, expectation] of Object.entries(testScenario.testRoles)) {
        const user = scenario.roleGroups[role as keyof typeof scenario.roleGroups][0]
        
        await authMiddlewareTestHelpers.testRoleAuthorization(
          requireRole(testScenario.allowedRoles),
          user,
          expectation.expectSuccess
        )
      }
    })
  })

  describe('Cross-organization Access', () => {
    it('should allow users from different organizations to authenticate', async () => {
      const scenario = await authFactory.createMultiOrgScenario()
      
      // Test users from different organizations
      const userFromOrgA = scenario.orgA.users.admin
      const userFromOrgB = scenario.orgB.users.admin
      
      const reqA = createMockRequestWithAuth(userFromOrgA)
      const reqB = createMockRequestWithAuth(userFromOrgB)
      
      const nextA = createMockNext()
      const nextB = createMockNext()
      
      await authenticateToken(reqA, mockResponse, nextA)
      await authenticateToken(reqB, mockResponse, nextB)
      
      expect(nextA).toHaveBeenCalledWith()
      expect(nextB).toHaveBeenCalledWith()
      expect(reqA.user!.organizationId).toBe(userFromOrgA.organizationId)
      expect(reqB.user!.organizationId).toBe(userFromOrgB.organizationId)
    })
  })

  describe('Middleware Chain Integration', () => {
    it('should work correctly in middleware chain', async () => {
      const scenario = await authFactory.createBasicScenario()
      
      const req = createMockRequestWithAuth(scenario.user)
      const next1 = createMockNext()
      const next2 = createMockNext()
      
      // First middleware: authenticate
      await authenticateToken(req, mockResponse, next1)
      expect(next1).toHaveBeenCalledWith()
      expect(req.user).toBeDefined()
      
      // Second middleware: require role
      await requireAnyRole(req, mockResponse, next2)
      expect(next2).toHaveBeenCalledWith()
    })

    it('should fail early in middleware chain with invalid auth', async () => {
      const req = createMockRequestWithInvalidAuth()
      const next1 = createMockNext()
      const next2 = createMockNext()
      
      // First middleware: authenticate (should fail)
      await authenticateToken(req, mockResponse, next1)
      expect(next1).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Invalid or expired token')
      }))
      
      // Second middleware should not be called in real scenario
      // but we can test it would fail due to missing user
      await requireAnyRole(req, mockResponse, next2)
      expect(next2).toHaveBeenCalledWith(expect.objectContaining({
        message: 'User not authenticated'
      }))
    })
  })
})