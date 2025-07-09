import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app';
import { 
  authenticatedRequest, 
  testOrganizationData, 
  testContactData,
  testInteractionData,
  testAuthToken, 
  testUserId,
  supabase,
  cleanupDatabase
} from '../setup';

describe('Interactions API', () => {
  let organizationId: string;
  let contactId: string;
  let interactionId: string;

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

  describe('POST /api/v1/interactions', () => {
    it('should create a new interaction with valid data', async () => {
      const interactionData = {
        ...testInteractionData,
        organization_id: organizationId,
        contact_id: contactId
      };

      const response = await authenticatedRequest('post', '/api/v1/interactions')
        .send(interactionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        organization: {
          id: organizationId,
          name: testOrganizationData.name
        },
        contact: {
          id: contactId,
          full_name: 'Jane Doe',
          job_title: testContactData.job_title
        },
        interaction_type: interactionData.interaction_type,
        duration_minutes: interactionData.duration_minutes,
        subject: interactionData.subject,
        description: interactionData.description,
        outcome: interactionData.outcome,
        outcome_details: interactionData.outcome_details,
        follow_up_required: interactionData.follow_up_required,
        follow_up_notes: interactionData.follow_up_notes,
        sentiment_score: interactionData.sentiment_score,
        priority_level: interactionData.priority_level,
        tags: interactionData.tags
      });
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.user.id).toBe(testUserId);
      expect(response.body.data.created_at).toBeDefined();
      expect(response.body.data.updated_at).toBeDefined();

      interactionId = response.body.data.id;
    });

    it('should return validation error for missing required fields', async () => {
      const invalidData = {
        organization_id: organizationId,
        contact_id: contactId,
        interaction_type: 'CALL'
        // Missing required fields: interaction_date, subject, outcome
      };

      const response = await authenticatedRequest('post', '/api/v1/interactions')
        .send(invalidData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors.length).toBeGreaterThan(0);
      expect(response.body.errors.some((error: any) => error.field === 'interaction_date')).toBe(true);
      expect(response.body.errors.some((error: any) => error.field === 'subject')).toBe(true);
      expect(response.body.errors.some((error: any) => error.field === 'outcome')).toBe(true);
    });

    it('should return validation error for invalid interaction_type', async () => {
      const invalidData = {
        ...testInteractionData,
        organization_id: organizationId,
        contact_id: contactId,
        interaction_type: 'INVALID_TYPE'
      };

      const response = await authenticatedRequest('post', '/api/v1/interactions')
        .send(invalidData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('VALIDATION_ERROR');
      expect(response.body.errors[0].field).toBe('interaction_type');
    });

    it('should return validation error for invalid outcome', async () => {
      const invalidData = {
        ...testInteractionData,
        organization_id: organizationId,
        contact_id: contactId,
        outcome: 'INVALID_OUTCOME'
      };

      const response = await authenticatedRequest('post', '/api/v1/interactions')
        .send(invalidData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('VALIDATION_ERROR');
      expect(response.body.errors[0].field).toBe('outcome');
    });

    it('should return validation error for invalid sentiment_score', async () => {
      const invalidData = {
        ...testInteractionData,
        organization_id: organizationId,
        contact_id: contactId,
        sentiment_score: 10 // Should be between 1-5
      };

      const response = await authenticatedRequest('post', '/api/v1/interactions')
        .send(invalidData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('VALIDATION_ERROR');
      expect(response.body.errors[0].field).toBe('sentiment_score');
    });

    it('should return validation error for negative duration_minutes', async () => {
      const invalidData = {
        ...testInteractionData,
        organization_id: organizationId,
        contact_id: contactId,
        duration_minutes: -10
      };

      const response = await authenticatedRequest('post', '/api/v1/interactions')
        .send(invalidData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('VALIDATION_ERROR');
      expect(response.body.errors[0].field).toBe('duration_minutes');
    });

    it('should return validation error for non-existent organization', async () => {
      const invalidData = {
        ...testInteractionData,
        organization_id: '00000000-0000-0000-0000-000000000000',
        contact_id: contactId
      };

      const response = await authenticatedRequest('post', '/api/v1/interactions')
        .send(invalidData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('VALIDATION_ERROR');
      expect(response.body.errors[0].field).toBe('organization_id');
    });

    it('should return validation error for non-existent contact', async () => {
      const invalidData = {
        ...testInteractionData,
        organization_id: organizationId,
        contact_id: '00000000-0000-0000-0000-000000000000'
      };

      const response = await authenticatedRequest('post', '/api/v1/interactions')
        .send(invalidData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('VALIDATION_ERROR');
      expect(response.body.errors[0].field).toBe('contact_id');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .post('/api/v1/interactions')
        .send({
          ...testInteractionData,
          organization_id: organizationId,
          contact_id: contactId
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('UNAUTHORIZED');
    });

    it('should automatically update organization and contact last_interaction_date', async () => {
      const interactionData = {
        ...testInteractionData,
        organization_id: organizationId,
        contact_id: contactId
      };

      const response = await authenticatedRequest('post', '/api/v1/interactions')
        .send(interactionData)
        .expect(201);

      expect(response.body.success).toBe(true);

      // Verify organization was updated
      const orgResponse = await authenticatedRequest('get', `/api/v1/organizations/${organizationId}`);
      expect(orgResponse.body.data.last_interaction_date).toBeDefined();

      // Verify contact was updated
      const contactResponse = await authenticatedRequest('get', `/api/v1/contacts/${contactId}`);
      expect(contactResponse.body.data.last_interaction_date).toBeDefined();
    });
  });

  describe('GET /api/v1/interactions', () => {
    beforeEach(async () => {
      // Create test interaction
      const response = await authenticatedRequest('post', '/api/v1/interactions')
        .send({
          ...testInteractionData,
          organization_id: organizationId,
          contact_id: contactId
        });
      interactionId = response.body.data.id;
    });

    it('should return paginated list of interactions', async () => {
      const response = await authenticatedRequest('get', '/api/v1/interactions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.meta.pagination).toBeDefined();
      expect(response.body.meta.pagination.page).toBe(1);
      expect(response.body.meta.pagination.limit).toBe(50);
    });

    it('should support filtering by organization_id', async () => {
      const response = await authenticatedRequest('get', '/api/v1/interactions')
        .query({ organization_id: organizationId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].organization.id).toBe(organizationId);
    });

    it('should support filtering by contact_id', async () => {
      const response = await authenticatedRequest('get', '/api/v1/interactions')
        .query({ contact_id: contactId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].contact.id).toBe(contactId);
    });

    it('should support filtering by interaction_type', async () => {
      const response = await authenticatedRequest('get', '/api/v1/interactions')
        .query({ interaction_type: 'CALL' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].interaction_type).toBe('CALL');
    });

    it('should support filtering by outcome', async () => {
      const response = await authenticatedRequest('get', '/api/v1/interactions')
        .query({ outcome: 'Positive' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].outcome).toBe('Positive');
    });

    it('should support filtering by follow_up_required', async () => {
      const response = await authenticatedRequest('get', '/api/v1/interactions')
        .query({ follow_up_required: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].follow_up_required).toBe(true);
    });

    it('should support filtering by priority_level', async () => {
      const response = await authenticatedRequest('get', '/api/v1/interactions')
        .query({ priority_level: 'A' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].priority_level).toBe('A');
    });

    it('should support filtering by date range', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await authenticatedRequest('get', '/api/v1/interactions')
        .query({ date_from: today, date_to: today })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/v1/interactions')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/v1/interactions/:id', () => {
    beforeEach(async () => {
      // Create test interaction
      const response = await authenticatedRequest('post', '/api/v1/interactions')
        .send({
          ...testInteractionData,
          organization_id: organizationId,
          contact_id: contactId
        });
      interactionId = response.body.data.id;
    });

    it('should return interaction details by ID', async () => {
      const response = await authenticatedRequest('get', `/api/v1/interactions/${interactionId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(interactionId);
      expect(response.body.data.subject).toBe(testInteractionData.subject);
      expect(response.body.data.organization.id).toBe(organizationId);
      expect(response.body.data.contact.id).toBe(contactId);
      expect(response.body.data.user.id).toBe(testUserId);
    });

    it('should return 404 for non-existent interaction', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await authenticatedRequest('get', `/api/v1/interactions/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await authenticatedRequest('get', '/api/v1/interactions/invalid-uuid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('BAD_REQUEST');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get(`/api/v1/interactions/${interactionId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('UNAUTHORIZED');
    });
  });

  describe('PUT /api/v1/interactions/:id', () => {
    beforeEach(async () => {
      // Create test interaction
      const response = await authenticatedRequest('post', '/api/v1/interactions')
        .send({
          ...testInteractionData,
          organization_id: organizationId,
          contact_id: contactId
        });
      interactionId = response.body.data.id;
    });

    it('should update interaction with valid data', async () => {
      const updateData = {
        ...testInteractionData,
        organization_id: organizationId,
        contact_id: contactId,
        subject: 'Updated Test Call',
        outcome: 'Very Positive',
        sentiment_score: 5,
        duration_minutes: 45
      };

      const response = await authenticatedRequest('put', `/api/v1/interactions/${interactionId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(interactionId);
      expect(response.body.data.subject).toBe(updateData.subject);
      expect(response.body.data.outcome).toBe(updateData.outcome);
      expect(response.body.data.sentiment_score).toBe(updateData.sentiment_score);
      expect(response.body.data.duration_minutes).toBe(updateData.duration_minutes);
      expect(response.body.data.updated_at).toBeDefined();
    });

    it('should return validation error for invalid data', async () => {
      const invalidData = {
        ...testInteractionData,
        organization_id: organizationId,
        contact_id: contactId,
        sentiment_score: 0
      };

      const response = await authenticatedRequest('put', `/api/v1/interactions/${interactionId}`)
        .send(invalidData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('VALIDATION_ERROR');
      expect(response.body.errors[0].field).toBe('sentiment_score');
    });

    it('should return 404 for non-existent interaction', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await authenticatedRequest('put', `/api/v1/interactions/${fakeId}`)
        .send({
          ...testInteractionData,
          organization_id: organizationId,
          contact_id: contactId
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('NOT_FOUND');
    });
  });

  describe('PATCH /api/v1/interactions/:id', () => {
    beforeEach(async () => {
      // Create test interaction
      const response = await authenticatedRequest('post', '/api/v1/interactions')
        .send({
          ...testInteractionData,
          organization_id: organizationId,
          contact_id: contactId
        });
      interactionId = response.body.data.id;
    });

    it('should partially update interaction', async () => {
      const patchData = {
        subject: 'Partially Updated Call',
        outcome: 'Very Positive'
      };

      const response = await authenticatedRequest('patch', `/api/v1/interactions/${interactionId}`)
        .send(patchData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(interactionId);
      expect(response.body.data.subject).toBe(patchData.subject);
      expect(response.body.data.outcome).toBe(patchData.outcome);
      expect(response.body.data.description).toBe(testInteractionData.description); // Should remain unchanged
    });

    it('should return validation error for invalid partial data', async () => {
      const invalidPatch = {
        duration_minutes: -5
      };

      const response = await authenticatedRequest('patch', `/api/v1/interactions/${interactionId}`)
        .send(invalidPatch)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('VALIDATION_ERROR');
      expect(response.body.errors[0].field).toBe('duration_minutes');
    });

    it('should return 404 for non-existent interaction', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await authenticatedRequest('patch', `/api/v1/interactions/${fakeId}`)
        .send({ subject: 'Updated Subject' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /api/v1/interactions/:id', () => {
    beforeEach(async () => {
      // Create test interaction
      const response = await authenticatedRequest('post', '/api/v1/interactions')
        .send({
          ...testInteractionData,
          organization_id: organizationId,
          contact_id: contactId
        });
      interactionId = response.body.data.id;
    });

    it('should soft delete interaction', async () => {
      const response = await authenticatedRequest('delete', `/api/v1/interactions/${interactionId}`)
        .expect(204);

      expect(response.body).toEqual({});

      // Verify interaction is soft deleted
      const getResponse = await authenticatedRequest('get', `/api/v1/interactions/${interactionId}`)
        .expect(404);

      expect(getResponse.body.success).toBe(false);
      expect(getResponse.body.errors[0].code).toBe('NOT_FOUND');
    });

    it('should return 404 for non-existent interaction', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await authenticatedRequest('delete', `/api/v1/interactions/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('NOT_FOUND');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .delete(`/api/v1/interactions/${interactionId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('UNAUTHORIZED');
    });
  });
});