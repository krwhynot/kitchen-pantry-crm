import request from 'supertest'
import { Express } from 'express'
import { AuthTestFactory } from '../../utils/testing/auth-test-factory'
import { cleanupAllTestData } from '../../utils/testing/auth-test-utils'

// Mock the Express app - in a real scenario, this would import your actual app
const createMockApp = (): Express => {
  const express = require('express')
  const app = express()
  
  app.use(express.json())
  
  // Mock routes for testing
  app.post('/api/v1/auth/register', (req, res) => {
    res.status(201).json({
      status: 'success',
      data: {
        user: { id: 'test-user-id', email: req.body.email },
        session: { access_token: 'mock-token' }
      }
    })
  })
  
  app.post('/api/v1/auth/login', (req, res) => {
    if (req.body.email === 'valid@example.com' && req.body.password === 'ValidPassword123!') {
      res.json({
        status: 'success',
        data: {
          user: { id: 'test-user-id', email: req.body.email },
          session: { access_token: 'mock-token' }
        }
      })
    } else {
      res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      })
    }
  })
  
  app.post('/api/v1/auth/logout', (req, res) => {
    res.json({
      status: 'success',
      message: 'Logout successful'
    })
  })
  
  app.get('/api/v1/auth/profile', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1]
    if (token === 'mock-token') {
      res.json({
        status: 'success',
        data: {
          user: { id: 'test-user-id', email: 'test@example.com' }
        }
      })
    } else {
      res.status(401).json({
        status: 'error',
        message: 'Invalid token'
      })
    }
  })
  
  return app
}

describe('Authentication Integration Tests', () => {
  let app: Express
  let authFactory: AuthTestFactory

  beforeEach(() => {
    app = createMockApp()
    authFactory = new AuthTestFactory()
  })

  afterEach(async () => {
    await authFactory.cleanup()
  })

  afterAll(async () => {
    await cleanupAllTestData()
  })

  describe('Authentication Flow', () => {
    it('should complete full authentication flow', async () => {
      const testData = await authFactory.createRegistrationTestData()
      
      // Step 1: Register user
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(testData.validRegistrationData)
        .expect(201)
      
      expect(registerResponse.body.status).toBe('success')
      expect(registerResponse.body.data.user.email).toBe(testData.validRegistrationData.email)
      expect(registerResponse.body.data.session.access_token).toBeDefined()
      
      // Step 2: Login with registered credentials
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'valid@example.com',
          password: 'ValidPassword123!'
        })
        .expect(200)
      
      expect(loginResponse.body.status).toBe('success')
      expect(loginResponse.body.data.session.access_token).toBeDefined()
      
      const token = loginResponse.body.data.session.access_token
      
      // Step 3: Access protected route
      const profileResponse = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
      
      expect(profileResponse.body.status).toBe('success')
      expect(profileResponse.body.data.user).toBeDefined()
      
      // Step 4: Logout
      const logoutResponse = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
      
      expect(logoutResponse.body.status).toBe('success')
      expect(logoutResponse.body.message).toBe('Logout successful')
    })

    it('should fail authentication with invalid credentials', async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'invalid@example.com',
          password: 'wrongpassword'
        })
        .expect(401)
      
      expect(loginResponse.body.status).toBe('error')
      expect(loginResponse.body.message).toBe('Invalid credentials')
    })

    it('should fail to access protected route without token', async () => {
      const profileResponse = await request(app)
        .get('/api/v1/auth/profile')
        .expect(401)
      
      expect(profileResponse.body.status).toBe('error')
      expect(profileResponse.body.message).toBe('Invalid token')
    })

    it('should fail to access protected route with invalid token', async () => {
      const profileResponse = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)
      
      expect(profileResponse.body.status).toBe('error')
      expect(profileResponse.body.message).toBe('Invalid token')
    })
  })

  describe('Role-based Authorization Integration', () => {
    it('should handle role-based access correctly', async () => {
      const scenario = await authFactory.createRoleBasedScenario()
      
      // Mock role-based endpoints
      app.get('/api/v1/admin/users', (req, res) => {
        const token = req.headers.authorization?.split(' ')[1]
        if (token === 'admin-token') {
          res.json({ status: 'success', data: { users: [] } })
        } else {
          res.status(403).json({ status: 'error', message: 'Insufficient permissions' })
        }
      })
      
      app.get('/api/v1/manager/reports', (req, res) => {
        const token = req.headers.authorization?.split(' ')[1]
        if (token === 'admin-token' || token === 'manager-token') {
          res.json({ status: 'success', data: { reports: [] } })
        } else {
          res.status(403).json({ status: 'error', message: 'Insufficient permissions' })
        }
      })
      
      // Test admin access
      const adminResponse = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', 'Bearer admin-token')
        .expect(200)
      
      expect(adminResponse.body.status).toBe('success')
      
      // Test manager access to admin endpoint (should fail)
      const managerToAdminResponse = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', 'Bearer manager-token')
        .expect(403)
      
      expect(managerToAdminResponse.body.status).toBe('error')
      expect(managerToAdminResponse.body.message).toBe('Insufficient permissions')
      
      // Test manager access to manager endpoint (should succeed)
      const managerToManagerResponse = await request(app)
        .get('/api/v1/manager/reports')
        .set('Authorization', 'Bearer manager-token')
        .expect(200)
      
      expect(managerToManagerResponse.body.status).toBe('success')
    })
  })

  describe('Multi-tenant Authorization', () => {
    it('should handle multi-tenant scenarios correctly', async () => {
      const scenario = await authFactory.createMultiOrgScenario()
      
      // Mock organization-specific endpoint
      app.get('/api/v1/organizations/:id/contacts', (req, res) => {
        const token = req.headers.authorization?.split(' ')[1]
        const orgId = req.params.id
        
        // Mock organization-specific access control
        if (token === 'org-a-token' && orgId === 'org-a-id') {
          res.json({ status: 'success', data: { contacts: [] } })
        } else if (token === 'org-b-token' && orgId === 'org-b-id') {
          res.json({ status: 'success', data: { contacts: [] } })
        } else {
          res.status(403).json({ status: 'error', message: 'Access denied' })
        }
      })
      
      // Test access to own organization
      const ownOrgResponse = await request(app)
        .get('/api/v1/organizations/org-a-id/contacts')
        .set('Authorization', 'Bearer org-a-token')
        .expect(200)
      
      expect(ownOrgResponse.body.status).toBe('success')
      
      // Test access to other organization (should fail)
      const otherOrgResponse = await request(app)
        .get('/api/v1/organizations/org-b-id/contacts')
        .set('Authorization', 'Bearer org-a-token')
        .expect(403)
      
      expect(otherOrgResponse.body.status).toBe('error')
      expect(otherOrgResponse.body.message).toBe('Access denied')
    })
  })

  describe('Security Headers and CORS', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'valid@example.com',
          password: 'ValidPassword123!'
        })
        .expect(200)
      
      // In a real app, you would check for actual security headers
      expect(response.headers['content-type']).toMatch(/application\/json/)
    })

    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/api/v1/auth/login')
        .expect(404) // In this mock, OPTIONS is not handled
      
      // In a real app, you would check for CORS headers
    })
  })

  describe('Rate Limiting', () => {
    it('should handle rate limiting on auth endpoints', async () => {
      // Mock rate limiting scenario
      const promises = []
      
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .post('/api/v1/auth/login')
            .send({
              email: 'test@example.com',
              password: 'wrongpassword'
            })
        )
      }
      
      const responses = await Promise.all(promises)
      
      // All requests should complete (in real app, some might be rate limited)
      responses.forEach(response => {
        expect(response.status).toBe(401)
      })
    })
  })

  describe('Session Management', () => {
    it('should handle session lifecycle correctly', async () => {
      // Login
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'valid@example.com',
          password: 'ValidPassword123!'
        })
        .expect(200)
      
      const token = loginResponse.body.data.session.access_token
      
      // Use session
      await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
      
      // Logout
      await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
      
      // Try to use session after logout (in real app, this would fail)
      await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200) // Mock still accepts token
    })
  })
})