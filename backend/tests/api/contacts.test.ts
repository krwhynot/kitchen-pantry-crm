import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app';
import { 
  authenticatedRequest, 
  testOrganizationData, 
  testContactData,
  testAuthToken, 
  testUserId,
  supabase,
  cleanupDatabase
} from '../setup';

describe('Contacts API', () => {
  let organizationId: string;
  let contactId: string;

  beforeEach(async () => {
    await cleanupDatabase();
    
    // Create test organization first
    const orgResponse = await authenticatedRequest('post', '/api/v1/organizations')
      .send(testOrganizationData);
    organizationId = orgResponse.body.data.id;
  });

  describe('POST /api/v1/contacts', () => {
    it('should create a new contact with valid data', async () => {
      const contactData = {
        ...testContactData,
        organization_id: organizationId
      };

      const response = await authenticatedRequest('post', '/api/v1/contacts')
        .send(contactData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        organization_id: organizationId,
        first_name: contactData.first_name,
        last_name: contactData.last_name,
        job_title: contactData.job_title,
        department: contactData.department,
        is_primary_contact: contactData.is_primary_contact,
        is_decision_maker: contactData.is_decision_maker,
        authority_level: contactData.authority_level,
        email_primary: contactData.email_primary,
        phone_primary: contactData.phone_primary,
        mobile_phone: contactData.mobile_phone,
        preferred_contact_method: contactData.preferred_contact_method,
        preferred_contact_time: contactData.preferred_contact_time
      });
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.full_name).toBe('Jane Doe');
      expect(response.body.data.created_at).toBeDefined();
      expect(response.body.data.updated_at).toBeDefined();

      contactId = response.body.data.id;
    });

    it('should return validation error for missing required fields', async () => {
      const invalidData = {
        organization_id: organizationId,
        first_name: 'John'
        // Missing required last_name and email_primary
      };

      const response = await authenticatedRequest('post', '/api/v1/contacts')
        .send(invalidData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors.length).toBeGreaterThan(0);
      expect(response.body.errors.some((error: any) => error.field === 'last_name')).toBe(true);
      expect(response.body.errors.some((error: any) => error.field === 'email_primary')).toBe(true);
    });

    it('should return validation error for invalid email format', async () => {
      const invalidData = {
        ...testContactData,
        organization_id: organizationId,
        email_primary: 'invalid-email'
      };

      const response = await authenticatedRequest('post', '/api/v1/contacts')
        .send(invalidData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('VALIDATION_ERROR');
      expect(response.body.errors[0].field).toBe('email_primary');
    });

    it('should return validation error for invalid authority level', async () => {
      const invalidData = {
        ...testContactData,
        organization_id: organizationId,
        authority_level: 10 // Should be between 1-5
      };

      const response = await authenticatedRequest('post', '/api/v1/contacts')
        .send(invalidData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('VALIDATION_ERROR');
      expect(response.body.errors[0].field).toBe('authority_level');
    });

    it('should return validation error for non-existent organization', async () => {
      const invalidData = {
        ...testContactData,
        organization_id: '00000000-0000-0000-0000-000000000000'
      };

      const response = await authenticatedRequest('post', '/api/v1/contacts')
        .send(invalidData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('VALIDATION_ERROR');
      expect(response.body.errors[0].field).toBe('organization_id');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .post('/api/v1/contacts')
        .send({ ...testContactData, organization_id: organizationId })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('UNAUTHORIZED');
    });

    it('should enforce unique email per organization', async () => {
      const contactData = {
        ...testContactData,
        organization_id: organizationId
      };

      // Create first contact
      await authenticatedRequest('post', '/api/v1/contacts')
        .send(contactData)
        .expect(201);

      // Try to create duplicate with same email
      const duplicateData = {
        ...contactData,
        first_name: 'John',
        last_name: 'Smith'
      };

      const response = await authenticatedRequest('post', '/api/v1/contacts')
        .send(duplicateData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('CONFLICT');
    });

    it('should enforce only one primary contact per organization', async () => {
      const contactData = {
        ...testContactData,
        organization_id: organizationId,
        is_primary_contact: true
      };

      // Create first primary contact
      await authenticatedRequest('post', '/api/v1/contacts')
        .send(contactData)
        .expect(201);

      // Try to create another primary contact
      const duplicateData = {
        ...contactData,
        first_name: 'John',
        last_name: 'Smith',
        email_primary: 'john.smith@testrestaurant.com'
      };

      const response = await authenticatedRequest('post', '/api/v1/contacts')
        .send(duplicateData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('CONFLICT');
    });
  });

  describe('GET /api/v1/contacts', () => {
    beforeEach(async () => {
      // Create test contact
      const response = await authenticatedRequest('post', '/api/v1/contacts')
        .send({ ...testContactData, organization_id: organizationId });
      contactId = response.body.data.id;
    });

    it('should return paginated list of contacts', async () => {
      const response = await authenticatedRequest('get', '/api/v1/contacts')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.meta.pagination).toBeDefined();
      expect(response.body.meta.pagination.page).toBe(1);
      expect(response.body.meta.pagination.limit).toBe(50);
    });

    it('should support filtering by organization_id', async () => {
      const response = await authenticatedRequest('get', '/api/v1/contacts')
        .query({ organization_id: organizationId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].organization_id).toBe(organizationId);
    });

    it('should support search parameter', async () => {
      const response = await authenticatedRequest('get', '/api/v1/contacts')
        .query({ search: 'Jane' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].first_name).toBe('Jane');
    });

    it('should support filtering by is_primary_contact', async () => {
      const response = await authenticatedRequest('get', '/api/v1/contacts')
        .query({ is_primary_contact: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].is_primary_contact).toBe(true);
    });

    it('should support filtering by is_decision_maker', async () => {
      const response = await authenticatedRequest('get', '/api/v1/contacts')
        .query({ is_decision_maker: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].is_decision_maker).toBe(true);
    });

    it('should support filtering by authority_level', async () => {
      const response = await authenticatedRequest('get', '/api/v1/contacts')
        .query({ authority_level: 4 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].authority_level).toBe(4);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/v1/contacts')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/v1/organizations/:org_id/contacts', () => {
    beforeEach(async () => {
      // Create test contact
      const response = await authenticatedRequest('post', '/api/v1/contacts')
        .send({ ...testContactData, organization_id: organizationId });
      contactId = response.body.data.id;
    });

    it('should return contacts for specific organization', async () => {
      const response = await authenticatedRequest('get', `/api/v1/organizations/${organizationId}/contacts`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].organization_id).toBe(organizationId);
    });

    it('should return 404 for non-existent organization', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await authenticatedRequest('get', `/api/v1/organizations/${fakeId}/contacts`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('NOT_FOUND');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get(`/api/v1/organizations/${organizationId}/contacts`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/v1/contacts/:id', () => {
    beforeEach(async () => {
      // Create test contact
      const response = await authenticatedRequest('post', '/api/v1/contacts')
        .send({ ...testContactData, organization_id: organizationId });
      contactId = response.body.data.id;
    });

    it('should return contact details by ID', async () => {
      const response = await authenticatedRequest('get', `/api/v1/contacts/${contactId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(contactId);
      expect(response.body.data.first_name).toBe(testContactData.first_name);
      expect(response.body.data.last_name).toBe(testContactData.last_name);
      expect(response.body.data.organization).toBeDefined();
      expect(response.body.data.organization.name).toBe(testOrganizationData.name);
    });

    it('should return 404 for non-existent contact', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await authenticatedRequest('get', `/api/v1/contacts/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await authenticatedRequest('get', '/api/v1/contacts/invalid-uuid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('BAD_REQUEST');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get(`/api/v1/contacts/${contactId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('UNAUTHORIZED');
    });
  });

  describe('PUT /api/v1/contacts/:id', () => {
    beforeEach(async () => {
      // Create test contact
      const response = await authenticatedRequest('post', '/api/v1/contacts')
        .send({ ...testContactData, organization_id: organizationId });
      contactId = response.body.data.id;
    });

    it('should update contact with valid data', async () => {
      const updateData = {
        ...testContactData,
        organization_id: organizationId,
        first_name: 'Updated Jane',
        job_title: 'Senior Manager',
        authority_level: 5
      };

      const response = await authenticatedRequest('put', `/api/v1/contacts/${contactId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(contactId);
      expect(response.body.data.first_name).toBe(updateData.first_name);
      expect(response.body.data.job_title).toBe(updateData.job_title);
      expect(response.body.data.authority_level).toBe(updateData.authority_level);
      expect(response.body.data.updated_at).toBeDefined();
    });

    it('should return validation error for invalid data', async () => {
      const invalidData = {
        ...testContactData,
        organization_id: organizationId,
        authority_level: 10
      };

      const response = await authenticatedRequest('put', `/api/v1/contacts/${contactId}`)
        .send(invalidData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('VALIDATION_ERROR');
      expect(response.body.errors[0].field).toBe('authority_level');
    });

    it('should return 404 for non-existent contact', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await authenticatedRequest('put', `/api/v1/contacts/${fakeId}`)
        .send({ ...testContactData, organization_id: organizationId })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('NOT_FOUND');
    });
  });

  describe('PATCH /api/v1/contacts/:id', () => {
    beforeEach(async () => {
      // Create test contact
      const response = await authenticatedRequest('post', '/api/v1/contacts')
        .send({ ...testContactData, organization_id: organizationId });
      contactId = response.body.data.id;
    });

    it('should partially update contact', async () => {
      const patchData = {
        first_name: 'Partially Updated Jane',
        job_title: 'Director'
      };

      const response = await authenticatedRequest('patch', `/api/v1/contacts/${contactId}`)
        .send(patchData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(contactId);
      expect(response.body.data.first_name).toBe(patchData.first_name);
      expect(response.body.data.job_title).toBe(patchData.job_title);
      expect(response.body.data.last_name).toBe(testContactData.last_name); // Should remain unchanged
    });

    it('should return validation error for invalid partial data', async () => {
      const invalidPatch = {
        authority_level: 0
      };

      const response = await authenticatedRequest('patch', `/api/v1/contacts/${contactId}`)
        .send(invalidPatch)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('VALIDATION_ERROR');
      expect(response.body.errors[0].field).toBe('authority_level');
    });

    it('should return 404 for non-existent contact', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await authenticatedRequest('patch', `/api/v1/contacts/${fakeId}`)
        .send({ first_name: 'Updated Name' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /api/v1/contacts/:id', () => {
    beforeEach(async () => {
      // Create test contact
      const response = await authenticatedRequest('post', '/api/v1/contacts')
        .send({ ...testContactData, organization_id: organizationId });
      contactId = response.body.data.id;
    });

    it('should soft delete contact', async () => {
      const response = await authenticatedRequest('delete', `/api/v1/contacts/${contactId}`)
        .expect(204);

      expect(response.body).toEqual({});

      // Verify contact is soft deleted
      const getResponse = await authenticatedRequest('get', `/api/v1/contacts/${contactId}`)
        .expect(404);

      expect(getResponse.body.success).toBe(false);
      expect(getResponse.body.errors[0].code).toBe('NOT_FOUND');
    });

    it('should return 404 for non-existent contact', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await authenticatedRequest('delete', `/api/v1/contacts/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('NOT_FOUND');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .delete(`/api/v1/contacts/${contactId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('UNAUTHORIZED');
    });
  });
});