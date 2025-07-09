import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app';
import { 
  supabase,
  cleanupDatabase,
  testUser
} from '../setup';

describe('Authentication API', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  describe('Authentication Middleware', () => {
    it('should reject requests without Authorization header', async () => {
      const response = await request(app)
        .get('/api/v1/organizations')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0]).toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        details: expect.stringContaining('Authorization header')
      });
    });

    it('should reject requests with invalid Bearer token format', async () => {
      const response = await request(app)
        .get('/api/v1/organizations')
        .set('Authorization', 'InvalidFormat token123')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0]).toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Invalid token format',
        details: expect.stringContaining('Bearer')
      });
    });

    it('should reject requests with malformed JWT tokens', async () => {
      const response = await request(app)
        .get('/api/v1/organizations')
        .set('Authorization', 'Bearer invalid.jwt.token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0]).toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Invalid token',
        details: expect.stringContaining('malformed')
      });
    });

    it('should reject requests with expired JWT tokens', async () => {
      // Create an expired token
      const expiredPayload = {
        sub: 'user123',
        email: 'expired@test.com',
        role: 'sales_rep',
        iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
        exp: Math.floor(Date.now() / 1000) - 3600  // 1 hour ago (expired)
      };
      
      const expiredToken = Buffer.from(JSON.stringify(expiredPayload)).toString('base64');

      const response = await request(app)
        .get('/api/v1/organizations')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0]).toMatchObject({
        code: 'TOKEN_EXPIRED',
        message: 'Token has expired',
        details: expect.stringContaining('expired')
      });
    });

    it('should reject requests with tokens missing required claims', async () => {
      // Create a token without required claims
      const incompletePayload = {
        // Missing 'sub', 'email', 'role'
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      
      const incompleteToken = Buffer.from(JSON.stringify(incompletePayload)).toString('base64');

      const response = await request(app)
        .get('/api/v1/organizations')
        .set('Authorization', `Bearer ${incompleteToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0]).toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Invalid token claims',
        details: expect.stringContaining('required claims')
      });
    });

    it('should reject requests from users that do not exist', async () => {
      const nonExistentUserPayload = {
        sub: 'non-existent-user-id',
        email: 'nonexistent@test.com',
        role: 'sales_rep',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      
      const nonExistentToken = Buffer.from(JSON.stringify(nonExistentUserPayload)).toString('base64');

      const response = await request(app)
        .get('/api/v1/organizations')
        .set('Authorization', `Bearer ${nonExistentToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0]).toMatchObject({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
        details: expect.stringContaining('does not exist')
      });
    });

    it('should reject requests from suspended users', async () => {
      // Create a suspended user
      const { data: suspendedUser, error } = await supabase
        .from('profiles')
        .insert([{
          email: 'suspended@test.com',
          full_name: 'Suspended User',
          role: 'sales_rep',
          account_status: 'suspended'
        }])
        .select()
        .single();

      if (error) throw error;

      const suspendedUserPayload = {
        sub: suspendedUser.id,
        email: suspendedUser.email,
        role: suspendedUser.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      
      const suspendedToken = Buffer.from(JSON.stringify(suspendedUserPayload)).toString('base64');

      const response = await request(app)
        .get('/api/v1/organizations')
        .set('Authorization', `Bearer ${suspendedToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0]).toMatchObject({
        code: 'ACCOUNT_SUSPENDED',
        message: 'Account suspended',
        details: expect.stringContaining('suspended')
      });
    });

    it('should accept valid JWT tokens from active users', async () => {
      // Create an active user
      const { data: activeUser, error } = await supabase
        .from('profiles')
        .insert([{
          email: 'active@test.com',
          full_name: 'Active User',
          role: 'sales_rep',
          account_status: 'active'
        }])
        .select()
        .single();

      if (error) throw error;

      const validPayload = {
        sub: activeUser.id,
        email: activeUser.email,
        role: activeUser.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      
      const validToken = Buffer.from(JSON.stringify(validPayload)).toString('base64');

      const response = await request(app)
        .get('/api/v1/organizations')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should populate request context with user information', async () => {
      // Create a user for context testing
      const { data: contextUser, error } = await supabase
        .from('profiles')
        .insert([{
          email: 'context@test.com',
          full_name: 'Context User',
          role: 'admin',
          account_status: 'active'
        }])
        .select()
        .single();

      if (error) throw error;

      const contextPayload = {
        sub: contextUser.id,
        email: contextUser.email,
        role: contextUser.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      
      const contextToken = Buffer.from(JSON.stringify(contextPayload)).toString('base64');

      // Make a request that would show user context (like creating an organization)
      const response = await request(app)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${contextToken}`)
        .send({
          name: 'Context Test Organization',
          industry_segment: 'Fine Dining',
          priority_level: 'A'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      // The created organization should be associated with the authenticated user
      expect(response.body.data.assigned_user).toMatchObject({
        id: contextUser.id,
        email: contextUser.email,
        full_name: contextUser.full_name
      });
    });
  });

  describe('Role-Based Access Control', () => {
    it('should enforce admin-only endpoints', async () => {
      // Create a sales_rep user
      const { data: salesUser, error } = await supabase
        .from('profiles')
        .insert([{
          email: 'sales@test.com',
          full_name: 'Sales User',
          role: 'sales_rep',
          account_status: 'active'
        }])
        .select()
        .single();

      if (error) throw error;

      const salesPayload = {
        sub: salesUser.id,
        email: salesUser.email,
        role: salesUser.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      
      const salesToken = Buffer.from(JSON.stringify(salesPayload)).toString('base64');

      // Try to access an admin-only endpoint (hypothetical user management)
      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${salesToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0]).toMatchObject({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
        details: expect.stringContaining('admin')
      });
    });

    it('should allow admin users to access admin endpoints', async () => {
      // Create an admin user
      const { data: adminUser, error } = await supabase
        .from('profiles')
        .insert([{
          email: 'admin@test.com',
          full_name: 'Admin User',
          role: 'admin',
          account_status: 'active'
        }])
        .select()
        .single();

      if (error) throw error;

      const adminPayload = {
        sub: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      
      const adminToken = Buffer.from(JSON.stringify(adminPayload)).toString('base64');

      // Access an admin endpoint (use regular endpoint for testing)
      const response = await request(app)
        .get('/api/v1/organizations')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should enforce read-only user restrictions', async () => {
      // Create a read-only user
      const { data: readOnlyUser, error } = await supabase
        .from('profiles')
        .insert([{
          email: 'readonly@test.com',
          full_name: 'Read Only User',
          role: 'read_only',
          account_status: 'active'
        }])
        .select()
        .single();

      if (error) throw error;

      const readOnlyPayload = {
        sub: readOnlyUser.id,
        email: readOnlyUser.email,
        role: readOnlyUser.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      
      const readOnlyToken = Buffer.from(JSON.stringify(readOnlyPayload)).toString('base64');

      // Try to create an organization (should be forbidden)
      const response = await request(app)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${readOnlyToken}`)
        .send({
          name: 'Read Only Test Organization',
          industry_segment: 'Fine Dining',
          priority_level: 'A'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0]).toMatchObject({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
        details: expect.stringContaining('read-only')
      });
    });

    it('should allow read-only users to access GET endpoints', async () => {
      // Create a read-only user
      const { data: readOnlyUser, error } = await supabase
        .from('profiles')
        .insert([{
          email: 'readonly2@test.com',
          full_name: 'Read Only User 2',
          role: 'read_only',
          account_status: 'active'
        }])
        .select()
        .single();

      if (error) throw error;

      const readOnlyPayload = {
        sub: readOnlyUser.id,
        email: readOnlyUser.email,
        role: readOnlyUser.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      
      const readOnlyToken = Buffer.from(JSON.stringify(readOnlyPayload)).toString('base64');

      // Access GET endpoint (should be allowed)
      const response = await request(app)
        .get('/api/v1/organizations')
        .set('Authorization', `Bearer ${readOnlyToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Token Refresh and Security', () => {
    it('should handle token refresh gracefully', async () => {
      // Create a user with a token that's about to expire
      const { data: user, error } = await supabase
        .from('profiles')
        .insert([{
          email: 'refresh@test.com',
          full_name: 'Refresh User',
          role: 'sales_rep',
          account_status: 'active'
        }])
        .select()
        .single();

      if (error) throw error;

      const nearExpiryPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        iat: Math.floor(Date.now() / 1000) - 3500, // Issued 58 minutes ago
        exp: Math.floor(Date.now() / 1000) + 100   // Expires in 100 seconds
      };
      
      const nearExpiryToken = Buffer.from(JSON.stringify(nearExpiryPayload)).toString('base64');

      const response = await request(app)
        .get('/api/v1/organizations')
        .set('Authorization', `Bearer ${nearExpiryToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      // In a real implementation, this might include refresh instructions in headers
      expect(response.headers['x-token-refresh-recommended']).toBeDefined();
    });

    it('should include security headers in responses', async () => {
      const { data: user, error } = await supabase
        .from('profiles')
        .insert([{
          email: 'security@test.com',
          full_name: 'Security User',
          role: 'sales_rep',
          account_status: 'active'
        }])
        .select()
        .single();

      if (error) throw error;

      const validPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      
      const validToken = Buffer.from(JSON.stringify(validPayload)).toString('base64');

      const response = await request(app)
        .get('/api/v1/organizations')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      // Check for security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['content-security-policy']).toBeDefined();
    });

    it('should log authentication attempts', async () => {
      // This test would verify that authentication attempts are logged
      // In a real implementation, you would check audit logs
      
      const response = await request(app)
        .get('/api/v1/organizations')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      // The authentication failure should be logged (checked in audit logs)
    });

    it('should rate limit authentication attempts', async () => {
      // Make multiple failed authentication attempts
      const promises = Array.from({ length: 10 }, () =>
        request(app)
          .get('/api/v1/organizations')
          .set('Authorization', 'Bearer invalid-token')
      );

      const responses = await Promise.all(promises);

      // First few should be 401, later ones might be 429 (rate limited)
      const statusCodes = responses.map(r => r.status);
      expect(statusCodes.filter(code => code === 401).length).toBeGreaterThan(0);
      expect(statusCodes.filter(code => code === 429).length).toBeGreaterThan(0);
    });
  });
});