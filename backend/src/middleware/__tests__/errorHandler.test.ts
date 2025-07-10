import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { Request, Response, NextFunction } from 'express'
import { errorHandler, notFoundHandler, asyncHandler, AppError, ApiError } from '../errorHandler'

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockNext: NextFunction
  let consoleSpy: jest.SpyInstance

  beforeEach(() => {
    mockRequest = {
      originalUrl: '/test',
      method: 'GET',
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'Jest Test Agent'
      }
    }

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    }

    mockNext = jest.fn()
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.clearAllMocks()
    consoleSpy.mockRestore()
  })

  describe('AppError class', () => {
    it('should create AppError with message and status code', () => {
      const error = new AppError('Test error', 400)

      expect(error.message).toBe('Test error')
      expect(error.statusCode).toBe(400)
      expect(error.isOperational).toBe(true)
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(AppError)
    })

    it('should capture stack trace', () => {
      const error = new AppError('Test error', 500)

      expect(error.stack).toBeDefined()
      expect(error.stack).toContain('AppError')
    })

    it('should set isOperational to true', () => {
      const error = new AppError('Test error', 422)

      expect(error.isOperational).toBe(true)
    })

    it('should handle different status codes', () => {
      const error400 = new AppError('Bad request', 400)
      const error401 = new AppError('Unauthorized', 401)
      const error403 = new AppError('Forbidden', 403)
      const error404 = new AppError('Not found', 404)
      const error500 = new AppError('Server error', 500)

      expect(error400.statusCode).toBe(400)
      expect(error401.statusCode).toBe(401)
      expect(error403.statusCode).toBe(403)
      expect(error404.statusCode).toBe(404)
      expect(error500.statusCode).toBe(500)
    })

    it('should handle empty message', () => {
      const error = new AppError('', 400)

      expect(error.message).toBe('')
      expect(error.statusCode).toBe(400)
    })

    it('should handle long error messages', () => {
      const longMessage = 'This is a very long error message that contains detailed information about what went wrong in the application and should be handled properly by the error handler'
      const error = new AppError(longMessage, 400)

      expect(error.message).toBe(longMessage)
      expect(error.statusCode).toBe(400)
    })
  })

  describe('errorHandler middleware', () => {
    it('should handle AppError with correct status code and message', () => {
      const error = new AppError('Test error', 400)

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: 400,
        message: 'Test error'
      })
      expect(consoleSpy).toHaveBeenCalledWith('Error:', error)
    })

    it('should handle generic Error with default status code', () => {
      const error = new Error('Generic error') as ApiError

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: 500,
        message: 'Generic error'
      })
    })

    it('should include stack trace in development environment', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const error = new AppError('Test error', 400)

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: 400,
        message: 'Test error',
        stack: error.stack
      })

      process.env.NODE_ENV = originalEnv
    })

    it('should not include stack trace in production environment', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const error = new AppError('Test error', 400)

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: 400,
        message: 'Test error'
      })

      process.env.NODE_ENV = originalEnv
    })

    it('should handle error without message', () => {
      const error = new Error() as ApiError
      error.statusCode = 400

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: 400,
        message: ''
      })
    })

    it('should handle error with custom statusCode property', () => {
      const error = new Error('Custom error') as ApiError
      error.statusCode = 422

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(422)
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: 422,
        message: 'Custom error'
      })
    })

    it('should handle null or undefined error', () => {
      const error = null as any

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: 500,
        message: undefined
      })
    })

    it('should log error to console', () => {
      const error = new AppError('Test error', 400)

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext)

      expect(consoleSpy).toHaveBeenCalledWith('Error:', error)
    })

    it('should handle errors with additional properties', () => {
      const error = new AppError('Test error', 400) as any
      error.details = { field: 'email', code: 'INVALID_FORMAT' }
      error.timestamp = new Date().toISOString()

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: 400,
        message: 'Test error'
      })
    })

    it('should handle validation errors', () => {
      const error = new AppError('Validation failed: email is required', 400)

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: 400,
        message: 'Validation failed: email is required'
      })
    })

    it('should handle authentication errors', () => {
      const error = new AppError('Invalid credentials', 401)

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: 401,
        message: 'Invalid credentials'
      })
    })

    it('should handle authorization errors', () => {
      const error = new AppError('Insufficient permissions', 403)

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(403)
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: 403,
        message: 'Insufficient permissions'
      })
    })

    it('should handle rate limit errors', () => {
      const error = new AppError('Too many requests', 429)

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(429)
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: 429,
        message: 'Too many requests'
      })
    })

    it('should handle database errors', () => {
      const error = new AppError('Database connection failed', 500)

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: 500,
        message: 'Database connection failed'
      })
    })
  })

  describe('notFoundHandler middleware', () => {
    it('should return 404 for non-existent routes', () => {
      mockRequest.originalUrl = '/non-existent-route'

      notFoundHandler(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(404)
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: 404,
        message: 'Route /non-existent-route not found'
      })
    })

    it('should handle different HTTP methods', () => {
      mockRequest.originalUrl = '/api/users'
      mockRequest.method = 'POST'

      notFoundHandler(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(404)
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: 404,
        message: 'Route /api/users not found'
      })
    })

    it('should handle routes with query parameters', () => {
      mockRequest.originalUrl = '/api/users?page=1&limit=10'

      notFoundHandler(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(404)
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: 404,
        message: 'Route /api/users?page=1&limit=10 not found'
      })
    })

    it('should handle empty originalUrl', () => {
      mockRequest.originalUrl = ''

      notFoundHandler(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(404)
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: 404,
        message: 'Route  not found'
      })
    })

    it('should handle undefined originalUrl', () => {
      mockRequest.originalUrl = undefined as any

      notFoundHandler(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(404)
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: 404,
        message: 'Route undefined not found'
      })
    })

    it('should handle nested routes', () => {
      mockRequest.originalUrl = '/api/v1/organizations/123/contacts/456'

      notFoundHandler(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(404)
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: 404,
        message: 'Route /api/v1/organizations/123/contacts/456 not found'
      })
    })
  })

  describe('asyncHandler utility', () => {
    it('should handle successful async function', async () => {
      const asyncFunction = async (req: Request, res: Response) => {
        res.json({ success: true })
      }

      const wrappedFunction = asyncHandler(asyncFunction)
      await wrappedFunction(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockResponse.json).toHaveBeenCalledWith({ success: true })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should catch and forward async errors', async () => {
      const asyncFunction = async (req: Request, res: Response) => {
        throw new AppError('Async error', 400)
      }

      const wrappedFunction = asyncHandler(asyncFunction)
      await wrappedFunction(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError))
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Async error',
        statusCode: 400
      }))
    })

    it('should handle async functions that return promises', async () => {
      const asyncFunction = (req: Request, res: Response) => {
        return Promise.resolve().then(() => {
          res.json({ message: 'Promise resolved' })
        })
      }

      const wrappedFunction = asyncHandler(asyncFunction)
      await wrappedFunction(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Promise resolved' })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should handle rejected promises', async () => {
      const asyncFunction = (req: Request, res: Response) => {
        return Promise.reject(new Error('Promise rejected'))
      }

      const wrappedFunction = asyncHandler(asyncFunction)
      await wrappedFunction(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Promise rejected'
      }))
    })

    it('should handle non-async functions', async () => {
      const syncFunction = (req: Request, res: Response) => {
        res.json({ message: 'Sync function' })
      }

      const wrappedFunction = asyncHandler(syncFunction)
      await wrappedFunction(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Sync function' })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should handle functions that throw synchronously', async () => {
      const syncFunction = (req: Request, res: Response) => {
        throw new Error('Sync error')
      }

      const wrappedFunction = asyncHandler(syncFunction)
      await wrappedFunction(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Sync error'
      }))
    })

    it('should handle functions with next parameter', async () => {
      const functionWithNext = async (req: Request, res: Response, next: NextFunction) => {
        try {
          res.json({ message: 'Success' })
        } catch (error) {
          next(error)
        }
      }

      const wrappedFunction = asyncHandler(functionWithNext)
      await wrappedFunction(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Success' })
    })

    it('should handle database operation errors', async () => {
      const databaseFunction = async (req: Request, res: Response) => {
        // Simulate database error
        throw new Error('Connection timeout')
      }

      const wrappedFunction = asyncHandler(databaseFunction)
      await wrappedFunction(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Connection timeout'
      }))
    })

    it('should handle validation errors in async functions', async () => {
      const validationFunction = async (req: Request, res: Response) => {
        if (!req.body.email) {
          throw new AppError('Email is required', 400)
        }
        res.json({ message: 'Valid' })
      }

      mockRequest.body = {}
      const wrappedFunction = asyncHandler(validationFunction)
      await wrappedFunction(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError))
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Email is required',
        statusCode: 400
      }))
    })
  })

  describe('error handler integration', () => {
    it('should work with express error handling flow', () => {
      const error = new AppError('Integration test error', 422)

      // Simulate express error handling
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(422)
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: 422,
        message: 'Integration test error'
      })
      expect(consoleSpy).toHaveBeenCalledWith('Error:', error)
    })

    it('should handle errors from middleware chain', () => {
      const middlewareError = new Error('Middleware error') as ApiError
      middlewareError.statusCode = 500

      errorHandler(middlewareError, mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: 500,
        message: 'Middleware error'
      })
    })

    it('should handle errors with consistent response format', () => {
      const errors = [
        new AppError('Bad request', 400),
        new AppError('Unauthorized', 401),
        new AppError('Forbidden', 403),
        new AppError('Not found', 404),
        new AppError('Server error', 500)
      ]

      errors.forEach(error => {
        mockResponse.status = jest.fn().mockReturnThis()
        mockResponse.json = jest.fn().mockReturnThis()

        errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext)

        expect(mockResponse.json).toHaveBeenCalledWith({
          status: 'error',
          statusCode: error.statusCode,
          message: error.message
        })
      })
    })
  })

  describe('edge cases', () => {
    it('should handle circular reference in error object', () => {
      const error = new AppError('Circular error', 400) as any
      error.circular = error // Create circular reference

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: 400,
        message: 'Circular error'
      })
    })

    it('should handle very large error messages', () => {
      const largeMessage = 'A'.repeat(10000)
      const error = new AppError(largeMessage, 400)

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: 400,
        message: largeMessage
      })
    })

    it('should handle errors with special characters', () => {
      const specialMessage = 'Error with special chars: áéíóú ñ © ® ™ 中文 🚀'
      const error = new AppError(specialMessage, 400)

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: 400,
        message: specialMessage
      })
    })

    it('should handle errors with invalid status codes', () => {
      const error = new Error('Invalid status') as ApiError
      error.statusCode = 999 // Invalid HTTP status code

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(999)
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: 999,
        message: 'Invalid status'
      })
    })

    it('should handle errors with negative status codes', () => {
      const error = new Error('Negative status') as ApiError
      error.statusCode = -1

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(-1)
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: -1,
        message: 'Negative status'
      })
    })
  })
})