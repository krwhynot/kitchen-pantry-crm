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

describe('Opportunities API', () => {
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
  });

  describe('POST /api/v1/opportunities', () => {
    it('should create a new opportunity with valid data', async () => {
      const opportunityData = {
        ...testOpportunityData,
        organization_id: organizationId,
        primary_contact_id: contactId
      };

      const response = await authenticatedRequest('post', '/api/v1/opportunities')
        .send(opportunityData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        organization: {
          id: organizationId,
          name: testOrganizationData.name,
          priority_level: testOrganizationData.priority_level
        },
        primary_contact: {
          id: contactId,
          full_name: 'Jane Doe',
          job_title: testContactData.job_title
        },
        opportunity_name: opportunityData.opportunity_name,
        description: opportunityData.description,
        opportunity_type: opportunityData.opportunity_type,
        stage: opportunityData.stage,
        probability: opportunityData.probability,
        estimated_value: opportunityData.estimated_value,
        estimated_close_date: opportunityData.estimated_close_date,
        lead_source: opportunityData.lead_source,
        budget_confirmed: opportunityData.budget_confirmed,
        authority_confirmed: opportunityData.authority_confirmed,
        need_confirmed: opportunityData.need_confirmed,
        timeline_confirmed: opportunityData.timeline_confirmed,
        decision_criteria: opportunityData.decision_criteria,
        priority_level: opportunityData.priority_level
      });
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.user.id).toBe(testUserId);
      expect(response.body.data.created_at).toBeDefined();
      expect(response.body.data.updated_at).toBeDefined();

      opportunityId = response.body.data.id;
    });

    it('should return validation error for missing required fields', async () => {
      const invalidData = {
        organization_id: organizationId,
        primary_contact_id: contactId,
        opportunity_name: 'Test Opportunity'
        // Missing required fields: stage, estimated_value, estimated_close_date
      };

      const response = await authenticatedRequest('post', '/api/v1/opportunities')
        .send(invalidData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors.length).toBeGreaterThan(0);
      expect(response.body.errors.some((error: any) => error.field === 'stage')).toBe(true);
      expect(response.body.errors.some((error: any) => error.field === 'estimated_value')).toBe(true);
      expect(response.body.errors.some((error: any) => error.field === 'estimated_close_date')).toBe(true);
    });

    it('should return validation error for invalid opportunity_type', async () => {
      const invalidData = {
        ...testOpportunityData,
        organization_id: organizationId,
        primary_contact_id: contactId,
        opportunity_type: 'INVALID_TYPE'
      };

      const response = await authenticatedRequest('post', '/api/v1/opportunities')
        .send(invalidData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('VALIDATION_ERROR');
      expect(response.body.errors[0].field).toBe('opportunity_type');
    });

    it('should return validation error for invalid stage', async () => {
      const invalidData = {
        ...testOpportunityData,
        organization_id: organizationId,
        primary_contact_id: contactId,
        stage: 'INVALID_STAGE'
      };

      const response = await authenticatedRequest('post', '/api/v1/opportunities')
        .send(invalidData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('VALIDATION_ERROR');
      expect(response.body.errors[0].field).toBe('stage');
    });

    it('should return validation error for invalid probability', async () => {
      const invalidData = {
        ...testOpportunityData,
        organization_id: organizationId,
        primary_contact_id: contactId,
        probability: 150 // Should be between 0-100
      };

      const response = await authenticatedRequest('post', '/api/v1/opportunities')
        .send(invalidData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('VALIDATION_ERROR');
      expect(response.body.errors[0].field).toBe('probability');
    });

    it('should return validation error for negative estimated_value', async () => {
      const invalidData = {
        ...testOpportunityData,
        organization_id: organizationId,
        primary_contact_id: contactId,
        estimated_value: -1000
      };

      const response = await authenticatedRequest('post', '/api/v1/opportunities')
        .send(invalidData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('VALIDATION_ERROR');
      expect(response.body.errors[0].field).toBe('estimated_value');
    });

    it('should return validation error for invalid date format', async () => {
      const invalidData = {
        ...testOpportunityData,
        organization_id: organizationId,
        primary_contact_id: contactId,
        estimated_close_date: 'invalid-date'
      };

      const response = await authenticatedRequest('post', '/api/v1/opportunities')
        .send(invalidData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('VALIDATION_ERROR');
      expect(response.body.errors[0].field).toBe('estimated_close_date');
    });

    it('should return validation error for non-existent organization', async () => {
      const invalidData = {
        ...testOpportunityData,
        organization_id: '00000000-0000-0000-0000-000000000000',
        primary_contact_id: contactId
      };

      const response = await authenticatedRequest('post', '/api/v1/opportunities')
        .send(invalidData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('VALIDATION_ERROR');
      expect(response.body.errors[0].field).toBe('organization_id');
    });

    it('should return validation error for non-existent contact', async () => {
      const invalidData = {
        ...testOpportunityData,
        organization_id: organizationId,
        primary_contact_id: '00000000-0000-0000-0000-000000000000'
      };

      const response = await authenticatedRequest('post', '/api/v1/opportunities')
        .send(invalidData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('VALIDATION_ERROR');
      expect(response.body.errors[0].field).toBe('primary_contact_id');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .post('/api/v1/opportunities')
        .send({
          ...testOpportunityData,
          organization_id: organizationId,
          primary_contact_id: contactId
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('UNAUTHORIZED');
    });

    it('should calculate sales_cycle_days based on estimated_close_date', async () => {
      const opportunityData = {
        ...testOpportunityData,
        organization_id: organizationId,
        primary_contact_id: contactId,
        estimated_close_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 60 days from now
      };

      const response = await authenticatedRequest('post', '/api/v1/opportunities')
        .send(opportunityData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sales_cycle_days).toBeGreaterThan(50);
      expect(response.body.data.sales_cycle_days).toBeLessThan(65);
    });
  });

  describe('GET /api/v1/opportunities', () => {
    beforeEach(async () => {
      // Create test opportunity
      const response = await authenticatedRequest('post', '/api/v1/opportunities')
        .send({
          ...testOpportunityData,
          organization_id: organizationId,
          primary_contact_id: contactId
        });
      opportunityId = response.body.data.id;
    });

    it('should return paginated list of opportunities with pipeline summary', async () => {
      const response = await authenticatedRequest('get', '/api/v1/opportunities')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.meta.pagination).toBeDefined();
      expect(response.body.meta.pagination.page).toBe(1);
      expect(response.body.meta.pagination.limit).toBe(50);
      expect(response.body.meta.pipeline_summary).toBeDefined();
      expect(response.body.meta.pipeline_summary.total_opportunities).toBeGreaterThan(0);
      expect(response.body.meta.pipeline_summary.total_value).toBeGreaterThan(0);
      expect(response.body.meta.pipeline_summary.weighted_value).toBeGreaterThan(0);
    });

    it('should support filtering by organization_id', async () => {
      const response = await authenticatedRequest('get', '/api/v1/opportunities')
        .query({ organization_id: organizationId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].organization.id).toBe(organizationId);
    });

    it('should support filtering by stage', async () => {
      const response = await authenticatedRequest('get', '/api/v1/opportunities')
        .query({ stage: 'qualification' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].stage).toBe('qualification');
    });

    it('should support filtering by probability_min', async () => {
      const response = await authenticatedRequest('get', '/api/v1/opportunities')
        .query({ probability_min: 50 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].probability).toBeGreaterThanOrEqual(50);
    });

    it('should support filtering by estimated_value_min', async () => {
      const response = await authenticatedRequest('get', '/api/v1/opportunities')
        .query({ estimated_value_min: 20000 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].estimated_value).toBeGreaterThanOrEqual(20000);
    });

    it('should support filtering by close_date_from and close_date_to', async () => {
      const today = new Date().toISOString().split('T')[0];
      const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await authenticatedRequest('get', '/api/v1/opportunities')
        .query({ close_date_from: today, close_date_to: nextMonth })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/v1/opportunities')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/v1/opportunities/:id', () => {
    beforeEach(async () => {
      // Create test opportunity
      const response = await authenticatedRequest('post', '/api/v1/opportunities')
        .send({
          ...testOpportunityData,
          organization_id: organizationId,
          primary_contact_id: contactId
        });
      opportunityId = response.body.data.id;
    });

    it('should return opportunity details by ID', async () => {
      const response = await authenticatedRequest('get', `/api/v1/opportunities/${opportunityId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(opportunityId);
      expect(response.body.data.opportunity_name).toBe(testOpportunityData.opportunity_name);
      expect(response.body.data.organization.id).toBe(organizationId);
      expect(response.body.data.primary_contact.id).toBe(contactId);
      expect(response.body.data.user.id).toBe(testUserId);
      expect(response.body.data.recent_interactions).toBeDefined();
    });

    it('should return 404 for non-existent opportunity', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await authenticatedRequest('get', `/api/v1/opportunities/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await authenticatedRequest('get', '/api/v1/opportunities/invalid-uuid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('BAD_REQUEST');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get(`/api/v1/opportunities/${opportunityId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('UNAUTHORIZED');
    });
  });

  describe('PUT /api/v1/opportunities/:id', () => {
    beforeEach(async () => {
      // Create test opportunity
      const response = await authenticatedRequest('post', '/api/v1/opportunities')
        .send({
          ...testOpportunityData,
          organization_id: organizationId,
          primary_contact_id: contactId
        });
      opportunityId = response.body.data.id;
    });

    it('should update opportunity with valid data', async () => {
      const updateData = {
        ...testOpportunityData,
        organization_id: organizationId,
        primary_contact_id: contactId,
        opportunity_name: 'Updated Equipment Purchase',
        stage: 'proposal',
        probability: 80,
        estimated_value: 35000.00,
        proposal_submitted: true
      };

      const response = await authenticatedRequest('put', `/api/v1/opportunities/${opportunityId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(opportunityId);
      expect(response.body.data.opportunity_name).toBe(updateData.opportunity_name);
      expect(response.body.data.stage).toBe(updateData.stage);
      expect(response.body.data.probability).toBe(updateData.probability);
      expect(response.body.data.estimated_value).toBe(updateData.estimated_value);
      expect(response.body.data.proposal_submitted).toBe(updateData.proposal_submitted);
      expect(response.body.data.updated_at).toBeDefined();
    });

    it('should return validation error for invalid data', async () => {
      const invalidData = {
        ...testOpportunityData,
        organization_id: organizationId,
        primary_contact_id: contactId,
        probability: -10
      };

      const response = await authenticatedRequest('put', `/api/v1/opportunities/${opportunityId}`)
        .send(invalidData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('VALIDATION_ERROR');
      expect(response.body.errors[0].field).toBe('probability');
    });

    it('should return 404 for non-existent opportunity', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await authenticatedRequest('put', `/api/v1/opportunities/${fakeId}`)
        .send({
          ...testOpportunityData,
          organization_id: organizationId,
          primary_contact_id: contactId
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('NOT_FOUND');
    });

    it('should recalculate sales_cycle_days when estimated_close_date changes', async () => {
      const updateData = {
        ...testOpportunityData,
        organization_id: organizationId,
        primary_contact_id: contactId,
        estimated_close_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 90 days from now
      };

      const response = await authenticatedRequest('put', `/api/v1/opportunities/${opportunityId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sales_cycle_days).toBeGreaterThan(80);
      expect(response.body.data.sales_cycle_days).toBeLessThan(95);
    });
  });

  describe('PATCH /api/v1/opportunities/:id', () => {
    beforeEach(async () => {
      // Create test opportunity
      const response = await authenticatedRequest('post', '/api/v1/opportunities')
        .send({
          ...testOpportunityData,
          organization_id: organizationId,
          primary_contact_id: contactId
        });
      opportunityId = response.body.data.id;
    });

    it('should partially update opportunity', async () => {
      const patchData = {
        opportunity_name: 'Partially Updated Opportunity',
        stage: 'needs_analysis',
        probability: 70
      };

      const response = await authenticatedRequest('patch', `/api/v1/opportunities/${opportunityId}`)
        .send(patchData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(opportunityId);
      expect(response.body.data.opportunity_name).toBe(patchData.opportunity_name);
      expect(response.body.data.stage).toBe(patchData.stage);
      expect(response.body.data.probability).toBe(patchData.probability);
      expect(response.body.data.description).toBe(testOpportunityData.description); // Should remain unchanged
    });

    it('should return validation error for invalid partial data', async () => {
      const invalidPatch = {
        estimated_value: -5000
      };

      const response = await authenticatedRequest('patch', `/api/v1/opportunities/${opportunityId}`)
        .send(invalidPatch)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('VALIDATION_ERROR');
      expect(response.body.errors[0].field).toBe('estimated_value');
    });

    it('should return 404 for non-existent opportunity', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await authenticatedRequest('patch', `/api/v1/opportunities/${fakeId}`)
        .send({ opportunity_name: 'Updated Name' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('NOT_FOUND');
    });

    it('should track stage changes and update probability automatically', async () => {
      // Move to more advanced stage
      const patchData = {
        stage: 'proposal'
      };

      const response = await authenticatedRequest('patch', `/api/v1/opportunities/${opportunityId}`)
        .send(patchData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stage).toBe('proposal');
      // Probability should be automatically adjusted based on stage
      expect(response.body.data.probability).toBeGreaterThan(testOpportunityData.probability);
    });
  });

  describe('DELETE /api/v1/opportunities/:id', () => {
    beforeEach(async () => {
      // Create test opportunity
      const response = await authenticatedRequest('post', '/api/v1/opportunities')
        .send({
          ...testOpportunityData,
          organization_id: organizationId,
          primary_contact_id: contactId
        });
      opportunityId = response.body.data.id;
    });

    it('should soft delete opportunity', async () => {
      const response = await authenticatedRequest('delete', `/api/v1/opportunities/${opportunityId}`)
        .expect(204);

      expect(response.body).toEqual({});

      // Verify opportunity is soft deleted
      const getResponse = await authenticatedRequest('get', `/api/v1/opportunities/${opportunityId}`)
        .expect(404);

      expect(getResponse.body.success).toBe(false);
      expect(getResponse.body.errors[0].code).toBe('NOT_FOUND');
    });

    it('should return 404 for non-existent opportunity', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await authenticatedRequest('delete', `/api/v1/opportunities/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('NOT_FOUND');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .delete(`/api/v1/opportunities/${opportunityId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('UNAUTHORIZED');
    });
  });
});