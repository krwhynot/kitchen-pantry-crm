import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { Request, Response, NextFunction } from 'express'
import { z, ZodError } from 'zod'
import { validateRequest } from '../validation'
import { AppError } from '../errorHandler'

// Mock the dependencies
jest.mock('../errorHandler', () => ({
  AppError: jest.fn().mockImplementation((message: string, statusCode: number) => {
    const error = new Error(message) as any
    error.statusCode = statusCode
    return error
  })
}))

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    mockRequest = {
      body: {},
      query: {},
      params: {}
    }

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    mockNext = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('validateRequest', () => {
    describe('body validation', () => {
      it('should validate request body successfully', () => {
        const bodySchema = z.object({
          name: z.string().min(1),
          email: z.string().email(),
          age: z.number().min(0)
        })

        const middleware = validateRequest({ body: bodySchema })

        mockRequest.body = {
          name: 'John Doe',
          email: 'john.doe@example.com',
          age: 30
        }

        middleware(mockRequest as Request, mockResponse as Response, mockNext)

        expect(mockNext).toHaveBeenCalledWith()
        expect(mockRequest.body).toEqual({
          name: 'John Doe',
          email: 'john.doe@example.com',
          age: 30
        })
      })

      it('should transform and validate request body', () => {
        const bodySchema = z.object({
          name: z.string().trim().toLowerCase(),
          age: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(0))
        })

        const middleware = validateRequest({ body: bodySchema })

        mockRequest.body = {
          name: '  JOHN DOE  ',
          age: '30'
        }

        middleware(mockRequest as Request, mockResponse as Response, mockNext)

        expect(mockNext).toHaveBeenCalledWith()
        expect(mockRequest.body).toEqual({
          name: 'john doe',
          age: 30
        })
      })

      it('should handle missing required fields', () => {
        const bodySchema = z.object({
          name: z.string().min(1),
          email: z.string().email()
        })

        const middleware = validateRequest({ body: bodySchema })

        mockRequest.body = {
          name: 'John Doe'
          // Missing email
        }

        middleware(mockRequest as Request, mockResponse as Response, mockNext)

        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Validation error'),
            statusCode: 400
          })
        )
        expect(AppError).toHaveBeenCalledWith(
          expect.stringContaining('email: Required'),
          400
        )
      })

      it('should handle invalid field types', () => {
        const bodySchema = z.object({
          name: z.string(),
          age: z.number(),
          isActive: z.boolean()
        })

        const middleware = validateRequest({ body: bodySchema })

        mockRequest.body = {
          name: 123, // Should be string
          age: 'not-a-number', // Should be number
          isActive: 'not-a-boolean' // Should be boolean
        }

        middleware(mockRequest as Request, mockResponse as Response, mockNext)

        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Validation error'),
            statusCode: 400
          })
        )
        expect(AppError).toHaveBeenCalledWith(
          expect.stringMatching(/name:.*Expected string.*age:.*Expected number.*isActive:.*Expected boolean/),
          400
        )
      })

      it('should handle string validation constraints', () => {
        const bodySchema = z.object({
          name: z.string().min(2).max(50),
          email: z.string().email(),
          password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        })

        const middleware = validateRequest({ body: bodySchema })

        mockRequest.body = {
          name: 'A', // Too short
          email: 'invalid-email', // Invalid email format
          password: 'weak' // Too short and doesn't meet regex
        }

        middleware(mockRequest as Request, mockResponse as Response, mockNext)

        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Validation error'),
            statusCode: 400
          })
        )
        expect(AppError).toHaveBeenCalledWith(
          expect.stringMatching(/name:.*least 2.*email:.*Invalid email.*password:/),
          400
        )
      })

      it('should handle number validation constraints', () => {
        const bodySchema = z.object({
          age: z.number().min(0).max(120),
          price: z.number().positive(),
          rating: z.number().min(1).max(5)
        })

        const middleware = validateRequest({ body: bodySchema })

        mockRequest.body = {
          age: -5, // Below minimum
          price: -10, // Should be positive
          rating: 6 // Above maximum
        }

        middleware(mockRequest as Request, mockResponse as Response, mockNext)

        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Validation error'),
            statusCode: 400
          })
        )
        expect(AppError).toHaveBeenCalledWith(
          expect.stringMatching(/age:.*greater than.*price:.*positive.*rating:.*less than/),
          400
        )
      })

      it('should handle array validation', () => {
        const bodySchema = z.object({
          tags: z.array(z.string()).min(1),
          scores: z.array(z.number()).max(5),
          emails: z.array(z.string().email())
        })

        const middleware = validateRequest({ body: bodySchema })

        mockRequest.body = {
          tags: [], // Too few items
          scores: [1, 2, 3, 4, 5, 6], // Too many items
          emails: ['valid@example.com', 'invalid-email'] // Mixed valid/invalid
        }

        middleware(mockRequest as Request, mockResponse as Response, mockNext)

        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Validation error'),
            statusCode: 400
          })
        )
        expect(AppError).toHaveBeenCalledWith(
          expect.stringMatching(/tags:.*least 1.*scores:.*most 5.*emails\.1:.*Invalid email/),
          400
        )
      })

      it('should handle nested object validation', () => {
        const bodySchema = z.object({
          user: z.object({
            name: z.string(),
            profile: z.object({
              bio: z.string().optional(),
              age: z.number()
            })
          }),
          preferences: z.object({
            theme: z.enum(['light', 'dark']),
            notifications: z.boolean()
          })
        })

        const middleware = validateRequest({ body: bodySchema })

        mockRequest.body = {
          user: {
            name: 'John',
            profile: {
              age: 'not-a-number' // Invalid type
            }
          },
          preferences: {
            theme: 'invalid-theme', // Invalid enum value
            notifications: 'not-a-boolean' // Invalid type
          }
        }

        middleware(mockRequest as Request, mockResponse as Response, mockNext)

        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Validation error'),
            statusCode: 400
          })
        )
        expect(AppError).toHaveBeenCalledWith(
          expect.stringMatching(/user\.profile\.age:.*preferences\.theme:.*preferences\.notifications:/),
          400
        )
      })

      it('should handle optional fields correctly', () => {
        const bodySchema = z.object({
          name: z.string(),
          email: z.string().email().optional(),
          age: z.number().optional(),
          preferences: z.object({
            theme: z.string()
          }).optional()
        })

        const middleware = validateRequest({ body: bodySchema })

        mockRequest.body = {
          name: 'John Doe'
          // Optional fields not provided
        }

        middleware(mockRequest as Request, mockResponse as Response, mockNext)

        expect(mockNext).toHaveBeenCalledWith()
        expect(mockRequest.body).toEqual({
          name: 'John Doe'
        })
      })
    })

    describe('query validation', () => {
      it('should validate query parameters successfully', () => {
        const querySchema = z.object({
          page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1)),
          limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().max(100)),
          search: z.string().optional(),
          active: z.string().transform(val => val === 'true').pipe(z.boolean()).optional()
        })

        const middleware = validateRequest({ query: querySchema })

        mockRequest.query = {
          page: '2',
          limit: '20',
          search: 'test',
          active: 'true'
        }

        middleware(mockRequest as Request, mockResponse as Response, mockNext)

        expect(mockNext).toHaveBeenCalledWith()
        expect(mockRequest.query).toEqual({
          page: 2,
          limit: 20,
          search: 'test',
          active: true
        })
      })

      it('should handle invalid query parameters', () => {
        const querySchema = z.object({
          page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1)),
          limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().max(100))
        })

        const middleware = validateRequest({ query: querySchema })

        mockRequest.query = {
          page: '0', // Below minimum
          limit: '150' // Above maximum
        }

        middleware(mockRequest as Request, mockResponse as Response, mockNext)

        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Validation error'),
            statusCode: 400
          })
        )
        expect(AppError).toHaveBeenCalledWith(
          expect.stringMatching(/page:.*greater than.*limit:.*less than/),
          400
        )
      })

      it('should handle missing required query parameters', () => {
        const querySchema = z.object({
          page: z.string(),
          limit: z.string()
        })

        const middleware = validateRequest({ query: querySchema })

        mockRequest.query = {}

        middleware(mockRequest as Request, mockResponse as Response, mockNext)

        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Validation error'),
            statusCode: 400
          })
        )
        expect(AppError).toHaveBeenCalledWith(
          expect.stringMatching(/page:.*Required.*limit:.*Required/),
          400
        )
      })

      it('should handle enum validation in query parameters', () => {
        const querySchema = z.object({
          status: z.enum(['active', 'inactive', 'pending']),
          sort: z.enum(['asc', 'desc']).optional()
        })

        const middleware = validateRequest({ query: querySchema })

        mockRequest.query = {
          status: 'invalid-status',
          sort: 'invalid-sort'
        }

        middleware(mockRequest as Request, mockResponse as Response, mockNext)

        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Validation error'),
            statusCode: 400
          })
        )
        expect(AppError).toHaveBeenCalledWith(
          expect.stringMatching(/status:.*Invalid enum.*sort:.*Invalid enum/),
          400
        )
      })
    })

    describe('params validation', () => {
      it('should validate route parameters successfully', () => {
        const paramsSchema = z.object({
          id: z.string().uuid(),
          organizationId: z.string().uuid(),
          userId: z.string().optional()
        })

        const middleware = validateRequest({ params: paramsSchema })

        mockRequest.params = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          organizationId: '987fcdeb-51d3-12a3-b456-426614174111'
        }

        middleware(mockRequest as Request, mockResponse as Response, mockNext)

        expect(mockNext).toHaveBeenCalledWith()
        expect(mockRequest.params).toEqual({
          id: '123e4567-e89b-12d3-a456-426614174000',
          organizationId: '987fcdeb-51d3-12a3-b456-426614174111'
        })
      })

      it('should handle invalid UUID parameters', () => {
        const paramsSchema = z.object({
          id: z.string().uuid(),
          organizationId: z.string().uuid()
        })

        const middleware = validateRequest({ params: paramsSchema })

        mockRequest.params = {
          id: 'invalid-uuid',
          organizationId: '123'
        }

        middleware(mockRequest as Request, mockResponse as Response, mockNext)

        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Validation error'),
            statusCode: 400
          })
        )
        expect(AppError).toHaveBeenCalledWith(
          expect.stringMatching(/id:.*Invalid uuid.*organizationId:.*Invalid uuid/),
          400
        )
      })

      it('should handle missing required parameters', () => {
        const paramsSchema = z.object({
          id: z.string(),
          organizationId: z.string()
        })

        const middleware = validateRequest({ params: paramsSchema })

        mockRequest.params = {
          id: '123'
          // Missing organizationId
        }

        middleware(mockRequest as Request, mockResponse as Response, mockNext)

        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Validation error'),
            statusCode: 400
          })
        )
        expect(AppError).toHaveBeenCalledWith(
          expect.stringContaining('organizationId: Required'),
          400
        )
      })
    })

    describe('combined validation', () => {
      it('should validate body, query, and params together', () => {
        const bodySchema = z.object({
          name: z.string(),
          email: z.string().email()
        })

        const querySchema = z.object({
          page: z.string().transform(val => parseInt(val, 10)).pipe(z.number())
        })

        const paramsSchema = z.object({
          id: z.string().uuid()
        })

        const middleware = validateRequest({
          body: bodySchema,
          query: querySchema,
          params: paramsSchema
        })

        mockRequest.body = {
          name: 'John Doe',
          email: 'john.doe@example.com'
        }

        mockRequest.query = {
          page: '1'
        }

        mockRequest.params = {
          id: '123e4567-e89b-12d3-a456-426614174000'
        }

        middleware(mockRequest as Request, mockResponse as Response, mockNext)

        expect(mockNext).toHaveBeenCalledWith()
        expect(mockRequest.body).toEqual({
          name: 'John Doe',
          email: 'john.doe@example.com'
        })
        expect(mockRequest.query).toEqual({
          page: 1
        })
        expect(mockRequest.params).toEqual({
          id: '123e4567-e89b-12d3-a456-426614174000'
        })
      })

      it('should handle errors in multiple sections', () => {
        const bodySchema = z.object({
          name: z.string()
        })

        const querySchema = z.object({
          page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1))
        })

        const paramsSchema = z.object({
          id: z.string().uuid()
        })

        const middleware = validateRequest({
          body: bodySchema,
          query: querySchema,
          params: paramsSchema
        })

        mockRequest.body = {
          // Missing name
        }

        mockRequest.query = {
          page: '0' // Below minimum
        }

        mockRequest.params = {
          id: 'invalid-uuid'
        }

        middleware(mockRequest as Request, mockResponse as Response, mockNext)

        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Validation error'),
            statusCode: 400
          })
        )
        // Should include errors from all sections
        expect(AppError).toHaveBeenCalledWith(
          expect.stringMatching(/name:.*Required/),
          400
        )
      })

      it('should skip validation for undefined schemas', () => {
        const bodySchema = z.object({
          name: z.string()
        })

        const middleware = validateRequest({
          body: bodySchema
          // No query or params schemas
        })

        mockRequest.body = {
          name: 'John Doe'
        }

        mockRequest.query = {
          invalidParam: 'should-be-ignored'
        }

        mockRequest.params = {
          invalidParam: 'should-be-ignored'
        }

        middleware(mockRequest as Request, mockResponse as Response, mockNext)

        expect(mockNext).toHaveBeenCalledWith()
        expect(mockRequest.body).toEqual({
          name: 'John Doe'
        })
        // Query and params should remain unchanged
        expect(mockRequest.query).toEqual({
          invalidParam: 'should-be-ignored'
        })
        expect(mockRequest.params).toEqual({
          invalidParam: 'should-be-ignored'
        })
      })
    })

    describe('error handling', () => {
      it('should handle non-ZodError exceptions', () => {
        const bodySchema = z.object({
          name: z.string()
        })

        // Mock a schema that throws a non-ZodError
        const mockSchema = {
          parse: jest.fn().mockImplementation(() => {
            throw new Error('Non-Zod error')
          })
        }

        const middleware = validateRequest({ body: mockSchema as any })

        mockRequest.body = {
          name: 'John Doe'
        }

        middleware(mockRequest as Request, mockResponse as Response, mockNext)

        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Non-Zod error'
          })
        )
        expect(AppError).not.toHaveBeenCalled()
      })

      it('should handle empty schema object', () => {
        const middleware = validateRequest({})

        mockRequest.body = { name: 'John' }
        mockRequest.query = { page: '1' }
        mockRequest.params = { id: '123' }

        middleware(mockRequest as Request, mockResponse as Response, mockNext)

        expect(mockNext).toHaveBeenCalledWith()
        // All properties should remain unchanged
        expect(mockRequest.body).toEqual({ name: 'John' })
        expect(mockRequest.query).toEqual({ page: '1' })
        expect(mockRequest.params).toEqual({ id: '123' })
      })

      it('should handle null/undefined request properties', () => {
        const bodySchema = z.object({
          name: z.string()
        })

        const middleware = validateRequest({ body: bodySchema })

        // Simulate null/undefined request properties
        mockRequest.body = null

        middleware(mockRequest as Request, mockResponse as Response, mockNext)

        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Validation error'),
            statusCode: 400
          })
        )
      })

      it('should format multiple error messages correctly', () => {
        const bodySchema = z.object({
          user: z.object({
            name: z.string().min(2),
            email: z.string().email(),
            profile: z.object({
              age: z.number().min(0),
              bio: z.string().min(10)
            })
          }),
          preferences: z.array(z.string()).min(1)
        })

        const middleware = validateRequest({ body: bodySchema })

        mockRequest.body = {
          user: {
            name: 'A', // Too short
            email: 'invalid', // Invalid email
            profile: {
              age: -1, // Below minimum
              bio: 'short' // Too short
            }
          },
          preferences: [] // Too few items
        }

        middleware(mockRequest as Request, mockResponse as Response, mockNext)

        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Validation error'),
            statusCode: 400
          })
        )

        const errorCall = (AppError as jest.Mock).mock.calls[0]
        const errorMessage = errorCall[0]

        // Should contain all error paths
        expect(errorMessage).toContain('user.name:')
        expect(errorMessage).toContain('user.email:')
        expect(errorMessage).toContain('user.profile.age:')
        expect(errorMessage).toContain('user.profile.bio:')
        expect(errorMessage).toContain('preferences:')
      })
    })

    describe('special validation cases', () => {
      it('should handle date validation', () => {
        const bodySchema = z.object({
          birthDate: z.string().datetime(),
          createdAt: z.string().transform(val => new Date(val)).pipe(z.date())
        })

        const middleware = validateRequest({ body: bodySchema })

        mockRequest.body = {
          birthDate: '2023-01-01T00:00:00Z',
          createdAt: '2023-01-01'
        }

        middleware(mockRequest as Request, mockResponse as Response, mockNext)

        expect(mockNext).toHaveBeenCalledWith()
        expect(mockRequest.body.birthDate).toBe('2023-01-01T00:00:00Z')
        expect(mockRequest.body.createdAt).toBeInstanceOf(Date)
      })

      it('should handle union types', () => {
        const bodySchema = z.object({
          value: z.union([z.string(), z.number()]),
          status: z.union([z.literal('active'), z.literal('inactive'), z.literal('pending')])
        })

        const middleware = validateRequest({ body: bodySchema })

        mockRequest.body = {
          value: 'test',
          status: 'active'
        }

        middleware(mockRequest as Request, mockResponse as Response, mockNext)

        expect(mockNext).toHaveBeenCalledWith()
        expect(mockRequest.body).toEqual({
          value: 'test',
          status: 'active'
        })
      })

      it('should handle discriminated unions', () => {
        const bodySchema = z.discriminatedUnion('type', [
          z.object({
            type: z.literal('user'),
            name: z.string(),
            email: z.string().email()
          }),
          z.object({
            type: z.literal('organization'),
            name: z.string(),
            website: z.string().url()
          })
        ])

        const middleware = validateRequest({ body: bodySchema })

        mockRequest.body = {
          type: 'user',
          name: 'John Doe',
          email: 'john.doe@example.com'
        }

        middleware(mockRequest as Request, mockResponse as Response, mockNext)

        expect(mockNext).toHaveBeenCalledWith()
        expect(mockRequest.body).toEqual({
          type: 'user',
          name: 'John Doe',
          email: 'john.doe@example.com'
        })
      })
    })
  })
})