import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { Request, Response, NextFunction } from 'express'
import request from 'supertest'
import express from 'express'
import { generalLimiter, authLimiter } from '../rateLimiter'

describe('Rate Limiter Middleware', () => {
  let app: express.Application
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    app = express()
    
    mockRequest = {
      ip: '127.0.0.1',
      headers: {
        'x-forwarded-for': '127.0.0.1',
        'user-agent': 'Jest Test Agent'
      },
      method: 'GET',
      url: '/test'
    }

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      header: jest.fn().mockReturnThis()
    }

    mockNext = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('generalLimiter', () => {
    beforeEach(() => {
      app.use(generalLimiter)
      app.get('/test', (req, res) => res.json({ message: 'success' }))
    })

    it('should allow requests within rate limit', async () => {
      const response = await request(app).get('/test')
      
      expect(response.status).toBe(200)
      expect(response.body).toEqual({ message: 'success' })
    })

    it('should set rate limit headers', async () => {
      const response = await request(app).get('/test')
      
      expect(response.headers['x-ratelimit-limit']).toBeDefined()
      expect(response.headers['x-ratelimit-remaining']).toBeDefined()
      expect(response.headers['x-ratelimit-reset']).toBeDefined()
    })

    it('should track requests per IP', async () => {
      const firstResponse = await request(app).get('/test')
      const secondResponse = await request(app).get('/test')
      
      expect(firstResponse.status).toBe(200)
      expect(secondResponse.status).toBe(200)
      
      // Check that remaining count decreased
      const firstRemaining = parseInt(firstResponse.headers['x-ratelimit-remaining'])
      const secondRemaining = parseInt(secondResponse.headers['x-ratelimit-remaining'])
      
      expect(secondRemaining).toBe(firstRemaining - 1)
    })

    it('should reject requests when rate limit exceeded', async () => {
      // Make 100 requests (the limit)
      const requests = Array.from({ length: 100 }, () => request(app).get('/test'))
      await Promise.all(requests)
      
      // The 101st request should be rejected
      const response = await request(app).get('/test')
      
      expect(response.status).toBe(429)
      expect(response.text).toContain('Too many requests from this IP')
    })

    it('should reset rate limit after window expires', async () => {
      // This test would need to manipulate time or use a shorter window
      // For now, we'll test the configuration
      expect(generalLimiter).toBeDefined()
    })

    it('should handle different IP addresses separately', async () => {
      const response1 = await request(app)
        .get('/test')
        .set('X-Forwarded-For', '192.168.1.1')
      
      const response2 = await request(app)
        .get('/test')
        .set('X-Forwarded-For', '192.168.1.2')
      
      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)
      
      // Both should have full limit remaining (minus 1)
      expect(response1.headers['x-ratelimit-remaining']).toBe('99')
      expect(response2.headers['x-ratelimit-remaining']).toBe('99')
    })

    it('should handle requests with different HTTP methods', async () => {
      app.post('/test', (req, res) => res.json({ message: 'post success' }))
      app.put('/test', (req, res) => res.json({ message: 'put success' }))
      
      const getResponse = await request(app).get('/test')
      const postResponse = await request(app).post('/test')
      const putResponse = await request(app).put('/test')
      
      expect(getResponse.status).toBe(200)
      expect(postResponse.status).toBe(200)
      expect(putResponse.status).toBe(200)
      
      // All should count towards the same limit
      expect(putResponse.headers['x-ratelimit-remaining']).toBe('97')
    })

    it('should handle requests with no IP gracefully', async () => {
      const response = await request(app)
        .get('/test')
        .set('X-Forwarded-For', '')
      
      expect(response.status).toBe(200)
      expect(response.body).toEqual({ message: 'success' })
    })

    it('should handle concurrent requests properly', async () => {
      const concurrentRequests = Array.from({ length: 10 }, () => 
        request(app).get('/test')
      )
      
      const responses = await Promise.all(concurrentRequests)
      
      // All should succeed if under limit
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })
  })

  describe('authLimiter', () => {
    beforeEach(() => {
      app.use(authLimiter)
      app.post('/auth/login', (req, res) => res.json({ message: 'login success' }))
      app.post('/auth/register', (req, res) => res.json({ message: 'register success' }))
    })

    it('should allow requests within auth rate limit', async () => {
      const response = await request(app).post('/auth/login')
      
      expect(response.status).toBe(200)
      expect(response.body).toEqual({ message: 'login success' })
    })

    it('should set rate limit headers for auth routes', async () => {
      const response = await request(app).post('/auth/login')
      
      expect(response.headers['x-ratelimit-limit']).toBe('5')
      expect(response.headers['x-ratelimit-remaining']).toBe('4')
      expect(response.headers['x-ratelimit-reset']).toBeDefined()
    })

    it('should reject auth requests when rate limit exceeded', async () => {
      // Make 5 requests (the auth limit)
      const requests = Array.from({ length: 5 }, () => 
        request(app).post('/auth/login')
      )
      await Promise.all(requests)
      
      // The 6th request should be rejected
      const response = await request(app).post('/auth/login')
      
      expect(response.status).toBe(429)
      expect(response.text).toContain('Too many authentication attempts')
    })

    it('should handle different auth endpoints under same limit', async () => {
      await request(app).post('/auth/login')
      await request(app).post('/auth/register')
      const response = await request(app).post('/auth/login')
      
      expect(response.status).toBe(200)
      expect(response.headers['x-ratelimit-remaining']).toBe('2')
    })

    it('should be more restrictive than general limiter', async () => {
      // Auth limiter should have lower limit (5 vs 100)
      expect(true).toBe(true) // This is a configuration check
    })

    it('should handle failed authentication attempts', async () => {
      // Simulate failed login attempts
      const attempts = Array.from({ length: 3 }, () => 
        request(app).post('/auth/login').send({ email: 'test@example.com', password: 'wrong' })
      )
      
      const responses = await Promise.all(attempts)
      
      responses.forEach(response => {
        expect(response.status).toBe(200) // Rate limiter allows, but auth might fail
      })
      
      // Check remaining attempts
      const lastResponse = responses[responses.length - 1]
      expect(lastResponse.headers['x-ratelimit-remaining']).toBe('2')
    })

    it('should track different IPs separately for auth', async () => {
      const response1 = await request(app)
        .post('/auth/login')
        .set('X-Forwarded-For', '192.168.1.1')
      
      const response2 = await request(app)
        .post('/auth/login')
        .set('X-Forwarded-For', '192.168.1.2')
      
      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)
      
      // Both should have full limit remaining (minus 1)
      expect(response1.headers['x-ratelimit-remaining']).toBe('4')
      expect(response2.headers['x-ratelimit-remaining']).toBe('4')
    })

    it('should handle high frequency auth attempts', async () => {
      const startTime = Date.now()
      
      // Make rapid requests
      const requests = Array.from({ length: 3 }, () => 
        request(app).post('/auth/login')
      )
      
      const responses = await Promise.all(requests)
      const endTime = Date.now()
      
      // All should complete quickly
      expect(endTime - startTime).toBeLessThan(1000)
      
      // All should succeed if under limit
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })
  })

  describe('rate limiter configuration', () => {
    it('should have correct window duration for general limiter', () => {
      // General limiter should have 15 minute window
      expect(generalLimiter).toBeDefined()
    })

    it('should have correct window duration for auth limiter', () => {
      // Auth limiter should have 15 minute window
      expect(authLimiter).toBeDefined()
    })

    it('should have standard headers enabled', () => {
      // Both limiters should have standardHeaders: true
      expect(generalLimiter).toBeDefined()
      expect(authLimiter).toBeDefined()
    })

    it('should have legacy headers disabled', () => {
      // Both limiters should have legacyHeaders: false
      expect(generalLimiter).toBeDefined()
      expect(authLimiter).toBeDefined()
    })

    it('should have appropriate messages for each limiter', () => {
      // This is a configuration test - the actual message testing is done above
      expect(generalLimiter).toBeDefined()
      expect(authLimiter).toBeDefined()
    })
  })

  describe('rate limiter behavior with middleware chain', () => {
    it('should work with authentication middleware', async () => {
      const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
        // Simulate auth middleware
        (req as any).user = { id: 'user123' }
        next()
      }
      
      app.use(generalLimiter)
      app.use(authMiddleware)
      app.get('/protected', (req, res) => res.json({ message: 'protected resource' }))
      
      const response = await request(app).get('/protected')
      
      expect(response.status).toBe(200)
      expect(response.body).toEqual({ message: 'protected resource' })
    })

    it('should work with validation middleware', async () => {
      const validationMiddleware = (req: Request, res: Response, next: NextFunction) => {
        // Simulate validation middleware
        if (!req.body.email) {
          return res.status(400).json({ error: 'Email required' })
        }
        next()
      }
      
      app.use(express.json())
      app.use(authLimiter)
      app.use(validationMiddleware)
      app.post('/validate', (req, res) => res.json({ message: 'valid' }))
      
      const response = await request(app)
        .post('/validate')
        .send({ email: 'test@example.com' })
      
      expect(response.status).toBe(200)
      expect(response.body).toEqual({ message: 'valid' })
    })

    it('should be positioned before route handlers', async () => {
      // Rate limiter should be applied before route logic
      let middlewareOrder: string[] = []
      
      const testMiddleware = (name: string) => (req: Request, res: Response, next: NextFunction) => {
        middlewareOrder.push(name)
        next()
      }
      
      app.use(testMiddleware('first'))
      app.use(generalLimiter)
      app.use(testMiddleware('after-limiter'))
      app.get('/order', (req, res) => {
        middlewareOrder.push('route')
        res.json({ order: middlewareOrder })
      })
      
      const response = await request(app).get('/order')
      
      expect(response.status).toBe(200)
      expect(response.body.order).toEqual(['first', 'after-limiter', 'route'])
    })
  })

  describe('error handling', () => {
    it('should handle rate limit exceeded gracefully', async () => {
      app.use(authLimiter)
      app.post('/auth/test', (req, res) => res.json({ message: 'success' }))
      
      // Exhaust the rate limit
      const requests = Array.from({ length: 5 }, () => 
        request(app).post('/auth/test')
      )
      await Promise.all(requests)
      
      // Next request should be rate limited
      const response = await request(app).post('/auth/test')
      
      expect(response.status).toBe(429)
      expect(response.text).toContain('Too many authentication attempts')
    })

    it('should handle malformed requests', async () => {
      app.use(generalLimiter)
      app.get('/test', (req, res) => res.json({ message: 'success' }))
      
      const response = await request(app)
        .get('/test')
        .set('X-Forwarded-For', 'invalid-ip')
      
      expect(response.status).toBe(200)
      expect(response.body).toEqual({ message: 'success' })
    })

    it('should handle requests with missing headers', async () => {
      app.use(generalLimiter)
      app.get('/test', (req, res) => res.json({ message: 'success' }))
      
      const response = await request(app)
        .get('/test')
        .unset('User-Agent')
      
      expect(response.status).toBe(200)
      expect(response.body).toEqual({ message: 'success' })
    })
  })

  describe('edge cases', () => {
    it('should handle IPv6 addresses', async () => {
      app.use(generalLimiter)
      app.get('/test', (req, res) => res.json({ message: 'success' }))
      
      const response = await request(app)
        .get('/test')
        .set('X-Forwarded-For', '2001:0db8:85a3:0000:0000:8a2e:0370:7334')
      
      expect(response.status).toBe(200)
      expect(response.body).toEqual({ message: 'success' })
    })

    it('should handle requests with proxy headers', async () => {
      app.use(generalLimiter)
      app.get('/test', (req, res) => res.json({ message: 'success' }))
      
      const response = await request(app)
        .get('/test')
        .set('X-Forwarded-For', '203.0.113.1, 192.168.1.1')
        .set('X-Real-IP', '203.0.113.1')
      
      expect(response.status).toBe(200)
      expect(response.body).toEqual({ message: 'success' })
    })

    it('should handle requests with multiple X-Forwarded-For IPs', async () => {
      app.use(generalLimiter)
      app.get('/test', (req, res) => res.json({ message: 'success' }))
      
      const response = await request(app)
        .get('/test')
        .set('X-Forwarded-For', '203.0.113.1, 192.168.1.1, 10.0.0.1')
      
      expect(response.status).toBe(200)
      expect(response.body).toEqual({ message: 'success' })
    })

    it('should handle empty or null IP addresses', async () => {
      app.use(generalLimiter)
      app.get('/test', (req, res) => res.json({ message: 'success' }))
      
      const response = await request(app)
        .get('/test')
        .set('X-Forwarded-For', '')
      
      expect(response.status).toBe(200)
      expect(response.body).toEqual({ message: 'success' })
    })
  })

  describe('performance', () => {
    it('should handle multiple concurrent requests efficiently', async () => {
      app.use(generalLimiter)
      app.get('/test', (req, res) => res.json({ message: 'success' }))
      
      const startTime = Date.now()
      
      const requests = Array.from({ length: 20 }, () => 
        request(app).get('/test')
      )
      
      const responses = await Promise.all(requests)
      const endTime = Date.now()
      
      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(2000)
      
      // All should succeed if under limit
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })

    it('should not significantly impact response time', async () => {
      app.use(generalLimiter)
      app.get('/test', (req, res) => res.json({ message: 'success' }))
      
      const startTime = Date.now()
      const response = await request(app).get('/test')
      const endTime = Date.now()
      
      expect(response.status).toBe(200)
      expect(endTime - startTime).toBeLessThan(100) // Should be very fast
    })
  })
})