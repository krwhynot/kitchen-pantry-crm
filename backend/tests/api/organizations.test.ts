import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app';
import { 
  authenticatedRequest, 
  testOrganizationData, 
  testAuthToken, 
  testUserId,
  supabase,
  cleanupDatabase
} from '../setup';

describe('Organizations API', () => {
  let organizationId: string;

  beforeEach(async () => {
    await cleanupDatabase();
  });

  describe('POST /api/v1/organizations', () => {
    it('should create a new organization with valid data', async () => {
      const response = await authenticatedRequest('post', '/api/v1/organizations')
        .send(testOrganizationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: testOrganizationData.name,
        industry_segment: testOrganizationData.industry_segment,
        priority_level: testOrganizationData.priority_level,
        business_type: testOrganizationData.business_type,
        annual_revenue: testOrganizationData.annual_revenue,
        employee_count: testOrganizationData.employee_count,
        website_url: testOrganizationData.website_url,
        primary_phone: testOrganizationData.primary_phone,
        primary_email: testOrganizationData.primary_email,
        payment_terms: testOrganizationData.payment_terms,
        credit_limit: testOrganizationData.credit_limit,
        notes: testOrganizationData.notes
      });
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.created_at).toBeDefined();
      expect(response.body.data.updated_at).toBeDefined();
      expect(response.body.meta.timestamp).toBeDefined();
      expect(response.body.meta.request_id).toBeDefined();

      organizationId = response.body.data.id;
    });

    it('should return validation error for missing required fields', async () => {
      const invalidData = {
        industry_segment: 'Fine Dining',
        priority_level: 'A'
        // Missing required 'name' field
      };

      const response = await authenticatedRequest('post', '/api/v1/organizations')
        .send(invalidData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toHaveLength(1);
      expect(response.body.errors[0].code).toBe('VALIDATION_ERROR');
      expect(response.body.errors[0].field).toBe('name');
      expect(response.body.errors[0].message).toContain('required');
    });

    it('should return validation error for invalid enum values', async () => {
      const invalidData = {
        ...testOrganizationData,
        priority_level: 'INVALID_PRIORITY'
      };

      const response = await authenticatedRequest('post', '/api/v1/organizations')
        .send(invalidData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('VALIDATION_ERROR');
      expect(response.body.errors[0].field).toBe('priority_level');
    });

    it('should return validation error for invalid email format', async () => {
      const invalidData = {
        ...testOrganizationData,
        primary_email: 'invalid-email'
      };

      const response = await authenticatedRequest('post', '/api/v1/organizations')
        .send(invalidData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('VALIDATION_ERROR');
      expect(response.body.errors[0].field).toBe('primary_email');
    });

    it('should return validation error for negative annual revenue', async () => {
      const invalidData = {
        ...testOrganizationData,
        annual_revenue: -1000
      };

      const response = await authenticatedRequest('post', '/api/v1/organizations')
        .send(invalidData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('VALIDATION_ERROR');
      expect(response.body.errors[0].field).toBe('annual_revenue');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .post('/api/v1/organizations')
        .send(testOrganizationData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('UNAUTHORIZED');
    });

    it('should return 409 for duplicate organization names', async () => {
      // Create first organization
      await authenticatedRequest('post', '/api/v1/organizations')
        .send(testOrganizationData)
        .expect(201);

      // Try to create duplicate
      const response = await authenticatedRequest('post', '/api/v1/organizations')
        .send(testOrganizationData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('CONFLICT');
    });
  });

  describe('GET /api/v1/organizations', () => {
    beforeEach(async () => {
      // Create test organization
      const response = await authenticatedRequest('post', '/api/v1/organizations')
        .send(testOrganizationData);
      organizationId = response.body.data.id;
    });

    it('should return paginated list of organizations', async () => {
      const response = await authenticatedRequest('get', '/api/v1/organizations')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.meta.pagination).toBeDefined();
      expect(response.body.meta.pagination.page).toBe(1);
      expect(response.body.meta.pagination.limit).toBe(50);
      expect(response.body.meta.pagination.total).toBeGreaterThan(0);
    });

    it('should support pagination parameters', async () => {
      const response = await authenticatedRequest('get', '/api/v1/organizations')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.meta.pagination.page).toBe(1);
      expect(response.body.meta.pagination.limit).toBe(10);
    });

    it('should support search parameter', async () => {
      const response = await authenticatedRequest('get', '/api/v1/organizations')
        .query({ search: 'Test Restaurant' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].name).toContain('Test Restaurant');
    });

    it('should support filtering by industry segment', async () => {
      const response = await authenticatedRequest('get', '/api/v1/organizations')
        .query({ industry_segment: 'Fine Dining' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].industry_segment).toBe('Fine Dining');
    });

    it('should support filtering by priority level', async () => {
      const response = await authenticatedRequest('get', '/api/v1/organizations')
        .query({ priority_level: 'A' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].priority_level).toBe('A');
    });

    it('should support sorting by name', async () => {
      const response = await authenticatedRequest('get', '/api/v1/organizations')
        .query({ sort: 'name', order: 'asc' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/v1/organizations')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/v1/organizations/:id', () => {
    beforeEach(async () => {
      // Create test organization
      const response = await authenticatedRequest('post', '/api/v1/organizations')
        .send(testOrganizationData);
      organizationId = response.body.data.id;
    });

    it('should return organization details by ID', async () => {
      const response = await authenticatedRequest('get', `/api/v1/organizations/${organizationId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(organizationId);
      expect(response.body.data.name).toBe(testOrganizationData.name);
      expect(response.body.data.contacts).toBeDefined();
      expect(response.body.data.recent_interactions).toBeDefined();
      expect(response.body.data.opportunities).toBeDefined();
    });

    it('should return 404 for non-existent organization', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await authenticatedRequest('get', `/api/v1/organizations/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await authenticatedRequest('get', '/api/v1/organizations/invalid-uuid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('BAD_REQUEST');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get(`/api/v1/organizations/${organizationId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('UNAUTHORIZED');
    });
  });

  describe('PUT /api/v1/organizations/:id', () => {
    beforeEach(async () => {
      // Create test organization
      const response = await authenticatedRequest('post', '/api/v1/organizations')
        .send(testOrganizationData);
      organizationId = response.body.data.id;
    });

    it('should update organization with valid data', async () => {
      const updateData = {
        ...testOrganizationData,
        name: 'Updated Restaurant Group',
        priority_level: 'B',
        annual_revenue: 2000000.00
      };

      const response = await authenticatedRequest('put', `/api/v1/organizations/${organizationId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(organizationId);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.priority_level).toBe(updateData.priority_level);
      expect(response.body.data.annual_revenue).toBe(updateData.annual_revenue);
      expect(response.body.data.updated_at).toBeDefined();
    });

    it('should return validation error for invalid data', async () => {
      const invalidData = {
        ...testOrganizationData,
        priority_level: 'INVALID'
      };

      const response = await authenticatedRequest('put', `/api/v1/organizations/${organizationId}`)
        .send(invalidData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('VALIDATION_ERROR');
      expect(response.body.errors[0].field).toBe('priority_level');
    });

    it('should return 404 for non-existent organization', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await authenticatedRequest('put', `/api/v1/organizations/${fakeId}`)
        .send(testOrganizationData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('NOT_FOUND');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .put(`/api/v1/organizations/${organizationId}`)
        .send(testOrganizationData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('UNAUTHORIZED');
    });
  });

  describe('PATCH /api/v1/organizations/:id', () => {
    beforeEach(async () => {
      // Create test organization
      const response = await authenticatedRequest('post', '/api/v1/organizations')
        .send(testOrganizationData);
      organizationId = response.body.data.id;
    });

    it('should partially update organization', async () => {
      const patchData = {
        name: 'Partially Updated Restaurant',
        priority_level: 'C'
      };

      const response = await authenticatedRequest('patch', `/api/v1/organizations/${organizationId}`)
        .send(patchData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(organizationId);
      expect(response.body.data.name).toBe(patchData.name);
      expect(response.body.data.priority_level).toBe(patchData.priority_level);
      expect(response.body.data.industry_segment).toBe(testOrganizationData.industry_segment); // Should remain unchanged
    });

    it('should return validation error for invalid partial data', async () => {
      const invalidPatch = {
        annual_revenue: -5000
      };

      const response = await authenticatedRequest('patch', `/api/v1/organizations/${organizationId}`)
        .send(invalidPatch)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('VALIDATION_ERROR');
      expect(response.body.errors[0].field).toBe('annual_revenue');
    });

    it('should return 404 for non-existent organization', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await authenticatedRequest('patch', `/api/v1/organizations/${fakeId}`)
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /api/v1/organizations/:id', () => {
    beforeEach(async () => {
      // Create test organization
      const response = await authenticatedRequest('post', '/api/v1/organizations')
        .send(testOrganizationData);
      organizationId = response.body.data.id;
    });

    it('should soft delete organization', async () => {
      const response = await authenticatedRequest('delete', `/api/v1/organizations/${organizationId}`)
        .expect(204);

      expect(response.body).toEqual({});

      // Verify organization is soft deleted
      const getResponse = await authenticatedRequest('get', `/api/v1/organizations/${organizationId}`)
        .expect(404);

      expect(getResponse.body.success).toBe(false);
      expect(getResponse.body.errors[0].code).toBe('NOT_FOUND');
    });

    it('should return 404 for non-existent organization', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await authenticatedRequest('delete', `/api/v1/organizations/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('NOT_FOUND');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .delete(`/api/v1/organizations/${organizationId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('UNAUTHORIZED');
    });
  });
});