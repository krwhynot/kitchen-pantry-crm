import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { Request, Response, NextFunction } from 'express'
import { authenticateToken, requireRole, requireAdmin, requireManagerOrAdmin, requireAnyRole, optionalAuth, AuthenticatedRequest } from '../auth'
import { supabase } from '../../config/database'
import { AppError } from '../errorHandler'

// Mock the database config
jest.mock('../../config/database', () => ({
  supabase: {
    auth: {
      getUser: jest.fn()
    },
    from: jest.fn()
  }
}))

// Mock the error handler
jest.mock('../errorHandler', () => ({
  AppError: jest.fn().mockImplementation((message: string, statusCode: number) => {
    const error = new Error(message) as any
    error.statusCode = statusCode
    return error
  })
}))

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>
  let mockResponse: Partial<Response>
  let mockNext: NextFunction
  let mockSupabaseFrom: any

  beforeEach(() => {
    mockRequest = {
      headers: {}
    }
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    mockNext = jest.fn()

    mockSupabaseFrom = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn()
    }

    jest.mocked(supabase.from).mockReturnValue(mockSupabaseFrom)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('authenticateToken', () => {
    it('should authenticate user with valid token', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com'
      }
      const mockUserData = {
        id: 'user123',
        email: 'test@example.com',
        role: 'admin',
        organization_id: 'org123'
      }

      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      }

      jest.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabaseFrom.single.mockResolvedValue({
        data: mockUserData,
        error: null
      })

      await authenticateToken(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      )

      expect(supabase.auth.getUser).toHaveBeenCalledWith('valid-token')
      expect(supabase.from).toHaveBeenCalledWith('users')
      expect(mockSupabaseFrom.select).toHaveBeenCalledWith('id, email, first_name, last_name, role, organization_id')
      expect(mockSupabaseFrom.eq).toHaveBeenCalledWith('id', 'user123')
      expect(mockRequest.user).toEqual({
        id: 'user123',
        email: 'test@example.com',
        role: 'admin',
        organizationId: 'org123'
      })
      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should fail when no authorization header', async () => {
      mockRequest.headers = {}

      await authenticateToken(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Access token is required',
          statusCode: 401
        })
      )
    })

    it('should fail when authorization header is malformed', async () => {
      mockRequest.headers = {
        authorization: 'InvalidHeader'
      }

      await authenticateToken(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Access token is required',
          statusCode: 401
        })
      )
    })

    it('should fail when token is invalid', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      }

      jest.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: new Error('Invalid token')
      })

      await authenticateToken(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid or expired token',
          statusCode: 401
        })
      )
    })

    it('should fail when user not found in database', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com'
      }

      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      }

      jest.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabaseFrom.single.mockResolvedValue({
        data: null,
        error: new Error('User not found')
      })

      await authenticateToken(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not found in system',
          statusCode: 401
        })
      )
    })

    it('should handle unexpected errors', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      }

      jest.mocked(supabase.auth.getUser).mockRejectedValue(new Error('Unexpected error'))

      await authenticateToken(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication failed',
          statusCode: 401
        })
      )
    })
  })

  describe('requireRole', () => {
    it('should allow access for user with required role', () => {
      mockRequest.user = {
        id: 'user123',
        email: 'test@example.com',
        role: 'admin',
        organizationId: 'org123'
      }

      const middleware = requireRole(['admin', 'manager'])
      
      middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should deny access for user without required role', () => {
      mockRequest.user = {
        id: 'user123',
        email: 'test@example.com',
        role: 'sales_rep',
        organizationId: 'org123'
      }

      const middleware = requireRole(['admin', 'manager'])
      
      expect(() => {
        middleware(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          mockNext
        )
      }).toThrow('Insufficient permissions')
    })

    it('should fail when user is not authenticated', () => {
      mockRequest.user = undefined

      const middleware = requireRole(['admin'])
      
      expect(() => {
        middleware(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          mockNext
        )
      }).toThrow('User not authenticated')
    })

    it('should work with single role', () => {
      mockRequest.user = {
        id: 'user123',
        email: 'test@example.com',
        role: 'admin',
        organizationId: 'org123'
      }

      const middleware = requireRole(['admin'])
      
      middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should work with multiple roles', () => {
      mockRequest.user = {
        id: 'user123',
        email: 'test@example.com',
        role: 'manager',
        organizationId: 'org123'
      }

      const middleware = requireRole(['admin', 'manager', 'sales_rep'])
      
      middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith()
    })
  })

  describe('requireAdmin', () => {
    it('should allow access for admin user', () => {
      mockRequest.user = {
        id: 'user123',
        email: 'test@example.com',
        role: 'admin',
        organizationId: 'org123'
      }

      requireAdmin(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should deny access for non-admin user', () => {
      mockRequest.user = {
        id: 'user123',
        email: 'test@example.com',
        role: 'manager',
        organizationId: 'org123'
      }

      expect(() => {
        requireAdmin(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          mockNext
        )
      }).toThrow('Insufficient permissions')
    })
  })

  describe('requireManagerOrAdmin', () => {
    it('should allow access for admin user', () => {
      mockRequest.user = {
        id: 'user123',
        email: 'test@example.com',
        role: 'admin',
        organizationId: 'org123'
      }

      requireManagerOrAdmin(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should allow access for manager user', () => {
      mockRequest.user = {
        id: 'user123',
        email: 'test@example.com',
        role: 'manager',
        organizationId: 'org123'
      }

      requireManagerOrAdmin(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should deny access for sales_rep user', () => {
      mockRequest.user = {
        id: 'user123',
        email: 'test@example.com',
        role: 'sales_rep',
        organizationId: 'org123'
      }

      expect(() => {
        requireManagerOrAdmin(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          mockNext
        )
      }).toThrow('Insufficient permissions')
    })
  })

  describe('requireAnyRole', () => {
    it('should allow access for any valid role', () => {
      const roles = ['sales_rep', 'manager', 'admin']
      
      roles.forEach(role => {
        mockRequest.user = {
          id: 'user123',
          email: 'test@example.com',
          role: role,
          organizationId: 'org123'
        }

        requireAnyRole(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          mockNext
        )

        expect(mockNext).toHaveBeenCalledWith()
        jest.clearAllMocks()
      })
    })

    it('should deny access for invalid role', () => {
      mockRequest.user = {
        id: 'user123',
        email: 'test@example.com',
        role: 'invalid_role',
        organizationId: 'org123'
      }

      expect(() => {
        requireAnyRole(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          mockNext
        )
      }).toThrow('Insufficient permissions')
    })
  })

  describe('optionalAuth', () => {
    it('should proceed without authentication when no token provided', async () => {
      mockRequest.headers = {}

      await optionalAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith()
      expect(mockRequest.user).toBeUndefined()
    })

    it('should authenticate user when valid token provided', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com'
      }
      const mockUserData = {
        id: 'user123',
        email: 'test@example.com',
        role: 'admin',
        organization_id: 'org123'
      }

      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      }

      jest.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabaseFrom.single.mockResolvedValue({
        data: mockUserData,
        error: null
      })

      await optionalAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      )

      expect(mockRequest.user).toEqual({
        id: 'user123',
        email: 'test@example.com',
        role: 'admin',
        organizationId: 'org123'
      })
      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should proceed without authentication when invalid token provided', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      }

      jest.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: new Error('Invalid token')
      })

      await optionalAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith()
      expect(mockRequest.user).toBeUndefined()
    })

    it('should proceed without authentication when user not found in database', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com'
      }

      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      }

      jest.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabaseFrom.single.mockResolvedValue({
        data: null,
        error: new Error('User not found')
      })

      await optionalAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith()
      expect(mockRequest.user).toBeUndefined()
    })

    it('should handle unexpected errors gracefully', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      }

      jest.mocked(supabase.auth.getUser).mockRejectedValue(new Error('Unexpected error'))

      await optionalAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith()
      expect(mockRequest.user).toBeUndefined()
    })
  })
})