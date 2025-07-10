import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app';
import { 
  authenticatedRequest, 
  testOrganizationData, 
  testContactData,
  testOpportunityData,
  testAuthToken, 
  testUserId,
  supabase,
  cleanupDatabase
} from '../setup';

describe('Search API', () => {
  let organizationId: string;
  let contactId: string;
  let opportunityId: string;

  beforeEach(async () => {
    await cleanupDatabase();
    
    // Create test organization
    const orgResponse = await authenticatedRequest('post', '/api/v1/organizations')
      .send(testOrganizationData);
    organizationId = orgResponse.body.data.id;

    // Create test contact
    const contactResponse = await authenticatedRequest('post', '/api/v1/contacts')
      .send({ ...testContactData, organization_id: organizationId });
    contactId = contactResponse.body.data.id;

    // Create test opportunity
    const opportunityResponse = await authenticatedRequest('post', '/api/v1/opportunities')
      .send({
        ...testOpportunityData,
        organization_id: organizationId,
        primary_contact_id: contactId
      });
    opportunityId = opportunityResponse.body.data.id;
  });

  describe('GET /api/v1/search', () => {
    it('should return unified search results across all resource types', async () => {
      const response = await authenticatedRequest('get', '/api/v1/search')
        .query({ q: 'Test' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.organizations).toBeDefined();
      expect(response.body.data.contacts).toBeDefined();
      expect(response.body.data.opportunities).toBeDefined();
    });

    it('should return organizations matching search query', async () => {
      const response = await authenticatedRequest('get', '/api/v1/search')
        .query({ q: 'Restaurant' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.organizations).toBeInstanceOf(Array);
      expect(response.body.data.organizations.length).toBeGreaterThan(0);
      expect(response.body.data.organizations[0]).toMatchObject({
        id: organizationId,
        name: testOrganizationData.name,
        industry_segment: testOrganizationData.industry_segment,
        relevance_score: expect.any(Number)
      });
      expect(response.body.data.organizations[0].relevance_score).toBeGreaterThan(0);
      expect(response.body.data.organizations[0].relevance_score).toBeLessThanOrEqual(1);
    });

    it('should return contacts matching search query', async () => {
      const response = await authenticatedRequest('get', '/api/v1/search')
        .query({ q: 'Jane' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.contacts).toBeInstanceOf(Array);
      expect(response.body.data.contacts.length).toBeGreaterThan(0);
      expect(response.body.data.contacts[0]).toMatchObject({
        id: contactId,
        full_name: 'Jane Doe',
        job_title: testContactData.job_title,
        organization_name: testOrganizationData.name,
        relevance_score: expect.any(Number)
      });
      expect(response.body.data.contacts[0].relevance_score).toBeGreaterThan(0);
      expect(response.body.data.contacts[0].relevance_score).toBeLessThanOrEqual(1);
    });

    it('should return opportunities matching search query', async () => {
      const response = await authenticatedRequest('get', '/api/v1/search')
        .query({ q: 'Equipment' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.opportunities).toBeInstanceOf(Array);
      expect(response.body.data.opportunities.length).toBeGreaterThan(0);
      expect(response.body.data.opportunities[0]).toMatchObject({
        id: opportunityId,
        opportunity_name: testOpportunityData.opportunity_name,
        organization_name: testOrganizationData.name,
        stage: testOpportunityData.stage,
        relevance_score: expect.any(Number)
      });
      expect(response.body.data.opportunities[0].relevance_score).toBeGreaterThan(0);
      expect(response.body.data.opportunities[0].relevance_score).toBeLessThanOrEqual(1);
    });

    it('should support filtering by resource types', async () => {
      const response = await authenticatedRequest('get', '/api/v1/search')
        .query({ q: 'Test', types: ['organizations', 'contacts'] })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.organizations).toBeDefined();
      expect(response.body.data.contacts).toBeDefined();
      expect(response.body.data.opportunities).toBeUndefined();
    });

    it('should support filtering by single resource type', async () => {
      const response = await authenticatedRequest('get', '/api/v1/search')
        .query({ q: 'Test', types: ['organizations'] })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.organizations).toBeDefined();
      expect(response.body.data.contacts).toBeUndefined();
      expect(response.body.data.opportunities).toBeUndefined();
    });

    it('should support custom result limit', async () => {
      const response = await authenticatedRequest('get', '/api/v1/search')
        .query({ q: 'Test', limit: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.organizations.length).toBeLessThanOrEqual(5);
      expect(response.body.data.contacts.length).toBeLessThanOrEqual(5);
      expect(response.body.data.opportunities.length).toBeLessThanOrEqual(5);
    });

    it('should return results sorted by relevance score', async () => {
      const response = await authenticatedRequest('get', '/api/v1/search')
        .query({ q: 'Test Restaurant' })
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Check that results are sorted by relevance_score in descending order
      const organizations = response.body.data.organizations;
      if (organizations.length > 1) {
        for (let i = 1; i < organizations.length; i++) {
          expect(organizations[i - 1].relevance_score).toBeGreaterThanOrEqual(organizations[i].relevance_score);
        }
      }
    });

    it('should return empty results for non-matching query', async () => {
      const response = await authenticatedRequest('get', '/api/v1/search')
        .query({ q: 'NonExistentSearchTerm12345' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.organizations).toEqual([]);
      expect(response.body.data.contacts).toEqual([]);
      expect(response.body.data.opportunities).toEqual([]);
    });

    it('should handle partial matches', async () => {
      const response = await authenticatedRequest('get', '/api/v1/search')
        .query({ q: 'Rest' }) // Partial match for "Restaurant"
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.organizations.length).toBeGreaterThan(0);
      expect(response.body.data.organizations[0].name).toContain('Restaurant');
    });

    it('should handle case-insensitive search', async () => {
      const response = await authenticatedRequest('get', '/api/v1/search')
        .query({ q: 'restaurant' }) // Lowercase query
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.organizations.length).toBeGreaterThan(0);
      expect(response.body.data.organizations[0].name).toContain('Restaurant');
    });

    it('should search across multiple fields', async () => {
      // Search for job title from contact
      const response = await authenticatedRequest('get', '/api/v1/search')
        .query({ q: 'Manager' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.contacts.length).toBeGreaterThan(0);
      expect(response.body.data.contacts[0].job_title).toContain('Manager');
    });

    it('should return 400 for missing query parameter', async () => {
      const response = await authenticatedRequest('get', '/api/v1/search')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('BAD_REQUEST');
      expect(response.body.errors[0].message).toContain('query');
    });

    it('should return 400 for empty query parameter', async () => {
      const response = await authenticatedRequest('get', '/api/v1/search')
        .query({ q: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('BAD_REQUEST');
      expect(response.body.errors[0].message).toContain('query');
    });

    it('should return 400 for invalid resource types', async () => {
      const response = await authenticatedRequest('get', '/api/v1/search')
        .query({ q: 'Test', types: ['invalid_type'] })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('BAD_REQUEST');
      expect(response.body.errors[0].field).toBe('types');
    });

    it('should return 400 for invalid limit value', async () => {
      const response = await authenticatedRequest('get', '/api/v1/search')
        .query({ q: 'Test', limit: 0 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('BAD_REQUEST');
      expect(response.body.errors[0].field).toBe('limit');
    });

    it('should return 400 for limit exceeding maximum', async () => {
      const response = await authenticatedRequest('get', '/api/v1/search')
        .query({ q: 'Test', limit: 100 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('BAD_REQUEST');
      expect(response.body.errors[0].field).toBe('limit');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .query({ q: 'Test' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('UNAUTHORIZED');
    });

      expect(response.body.success).toBe(true);
      
      // All returned results should be accessible to the current user
      response.body.data.organizations.forEach((org: any) => {
        expect(org.id).toBeDefined();
        expect(org.name).toBeDefined();
      });
      
      response.body.data.contacts.forEach((contact: any) => {
        expect(contact.id).toBeDefined();
        expect(contact.full_name).toBeDefined();
      });
      
      response.body.data.opportunities.forEach((opportunity: any) => {
        expect(opportunity.id).toBeDefined();
        expect(opportunity.opportunity_name).toBeDefined();
      });
    });

    it('should include meta information in response', async () => {
      const response = await authenticatedRequest('get', '/api/v1/search')
        .query({ q: 'Test' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.timestamp).toBeDefined();
      expect(response.body.meta.request_id).toBeDefined();
    });

    it('should handle special characters in search query', async () => {
      const response = await authenticatedRequest('get', '/api/v1/search')
        .query({ q: 'Test@Restaurant.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      // Should not crash and return valid response structure
    });

    it('should handle very long search queries', async () => {
      const longQuery = 'a'.repeat(1000);
      const response = await authenticatedRequest('get', '/api/v1/search')
        .query({ q: longQuery })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      // Should handle long queries gracefully
    });
  });
});