import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app';
import { 
  authenticatedRequest, 
  testOrganizationData, 
  testContactData,
  testInteractionData,
  testOpportunityData,
  testAuthToken, 
  testUserId,
  supabase,
  cleanupDatabase
} from '../setup';

describe('Analytics API', () => {
  let organizationId: string;
  let contactId: string;
  let interactionId: string;
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

    // Create test interaction
    const interactionResponse = await authenticatedRequest('post', '/api/v1/interactions')
      .send({
        ...testInteractionData,
        organization_id: organizationId,
        contact_id: contactId
      });
    interactionId = interactionResponse.body.data.id;

    // Create test opportunity
    const opportunityResponse = await authenticatedRequest('post', '/api/v1/opportunities')
      .send({
        ...testOpportunityData,
        organization_id: organizationId,
        primary_contact_id: contactId
      });
    opportunityId = opportunityResponse.body.data.id;
  });

  describe('GET /api/v1/analytics/dashboard', () => {
    it('should return dashboard KPI metrics', async () => {
      const response = await authenticatedRequest('get', '/api/v1/analytics/dashboard')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.kpis).toBeDefined();
      expect(response.body.data.trends).toBeDefined();
      expect(response.body.data.pipeline_by_stage).toBeDefined();
    });

    it('should include accurate KPI counts', async () => {
      const response = await authenticatedRequest('get', '/api/v1/analytics/dashboard')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.kpis).toMatchObject({
        total_organizations: expect.any(Number),
        total_contacts: expect.any(Number),
        total_opportunities: expect.any(Number),
        pipeline_value: expect.any(Number),
        weighted_pipeline: expect.any(Number),
        activities_this_week: expect.any(Number),
        follow_ups_due: expect.any(Number)
      });

      // Verify counts are accurate
      expect(response.body.data.kpis.total_organizations).toBeGreaterThan(0);
      expect(response.body.data.kpis.total_contacts).toBeGreaterThan(0);
      expect(response.body.data.kpis.total_opportunities).toBeGreaterThan(0);
      expect(response.body.data.kpis.pipeline_value).toBeGreaterThan(0);
      expect(response.body.data.kpis.weighted_pipeline).toBeGreaterThan(0);
      expect(response.body.data.kpis.activities_this_week).toBeGreaterThan(0);
    });

    it('should include growth trend percentages', async () => {
      const response = await authenticatedRequest('get', '/api/v1/analytics/dashboard')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.trends).toMatchObject({
        organizations_growth: expect.any(Number),
        pipeline_growth: expect.any(Number),
        activity_trend: expect.any(Number)
      });

      // Trends should be percentage values
      expect(response.body.data.trends.organizations_growth).toBeGreaterThanOrEqual(-100);
      expect(response.body.data.trends.pipeline_growth).toBeGreaterThanOrEqual(-100);
      expect(response.body.data.trends.activity_trend).toBeGreaterThanOrEqual(-100);
    });

    it('should include pipeline breakdown by stage', async () => {
      const response = await authenticatedRequest('get', '/api/v1/analytics/dashboard')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pipeline_by_stage).toBeInstanceOf(Array);
      expect(response.body.data.pipeline_by_stage.length).toBeGreaterThan(0);

      // Check structure of pipeline stage data
      const stageData = response.body.data.pipeline_by_stage[0];
      expect(stageData).toMatchObject({
        stage: expect.any(String),
        count: expect.any(Number),
        value: expect.any(Number)
      });

      // Verify stage names are valid
      const validStages = ['prospecting', 'qualification', 'needs_analysis', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
      expect(validStages).toContain(stageData.stage);
    });

    it('should calculate weighted pipeline correctly', async () => {
      const response = await authenticatedRequest('get', '/api/v1/analytics/dashboard')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      const kpis = response.body.data.kpis;
      
      // Weighted pipeline should be less than or equal to total pipeline
      expect(kpis.weighted_pipeline).toBeLessThanOrEqual(kpis.pipeline_value);
      
      // Weighted pipeline should be greater than 0 if there are opportunities
      if (kpis.total_opportunities > 0) {
        expect(kpis.weighted_pipeline).toBeGreaterThan(0);
      }
    });

    it('should calculate activities this week correctly', async () => {
      const response = await authenticatedRequest('get', '/api/v1/analytics/dashboard')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      const kpis = response.body.data.kpis;
      
      // Activities this week should be a non-negative number
      expect(kpis.activities_this_week).toBeGreaterThanOrEqual(0);
      
      // Should include the interaction we created (if it's within this week)
      expect(kpis.activities_this_week).toBeGreaterThan(0);
    });

    it('should calculate follow-ups due correctly', async () => {
      const response = await authenticatedRequest('get', '/api/v1/analytics/dashboard')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      const kpis = response.body.data.kpis;
      
      // Follow-ups due should be a non-negative number
      expect(kpis.follow_ups_due).toBeGreaterThanOrEqual(0);
      
      // Should include the interaction we created with follow-up required
      expect(kpis.follow_ups_due).toBeGreaterThan(0);
    });

    it('should include response metadata', async () => {
      const response = await authenticatedRequest('get', '/api/v1/analytics/dashboard')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.timestamp).toBeDefined();
      expect(response.body.meta.request_id).toBeDefined();
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/dashboard')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].code).toBe('UNAUTHORIZED');
    });

    it('should handle empty data gracefully', async () => {
      // Clean up all test data
      await cleanupDatabase();

      const response = await authenticatedRequest('get', '/api/v1/analytics/dashboard')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.kpis).toMatchObject({
        total_organizations: 0,
        total_contacts: 0,
        total_opportunities: 0,
        pipeline_value: 0,
        weighted_pipeline: 0,
        activities_this_week: 0,
        follow_ups_due: 0
      });
    });

    it('should filter data based on user permissions', async () => {
      const response = await authenticatedRequest('get', '/api/v1/analytics/dashboard')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // All counts should reflect only data accessible to the current user
      const kpis = response.body.data.kpis;
      
      // Verify that we're getting our test data
      expect(kpis.total_organizations).toBe(1);
      expect(kpis.total_contacts).toBe(1);
      expect(kpis.total_opportunities).toBe(1);
      expect(kpis.pipeline_value).toBe(testOpportunityData.estimated_value);
    });

    it('should calculate trends over time periods', async () => {
      const response = await authenticatedRequest('get', '/api/v1/analytics/dashboard')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      const trends = response.body.data.trends;
      
      // Since this is new test data, growth should be 100% (infinity represented as a high number)
      expect(trends.organizations_growth).toBeGreaterThan(0);
      expect(trends.pipeline_growth).toBeGreaterThan(0);
      expect(trends.activity_trend).toBeGreaterThan(0);
    });

    it('should return pipeline stages with correct totals', async () => {
      const response = await authenticatedRequest('get', '/api/v1/analytics/dashboard')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      const pipelineByStage = response.body.data.pipeline_by_stage;
      
      // Sum of all stage values should equal total pipeline value
      const totalStageValue = pipelineByStage.reduce((sum: number, stage: any) => sum + stage.value, 0);
      expect(totalStageValue).toBe(response.body.data.kpis.pipeline_value);
      
      // Sum of all stage counts should equal total opportunities
      const totalStageCount = pipelineByStage.reduce((sum: number, stage: any) => sum + stage.count, 0);
      expect(totalStageCount).toBe(response.body.data.kpis.total_opportunities);
    });

    it('should handle concurrent requests efficiently', async () => {
      // Make multiple concurrent requests
      const promises = Array.from({ length: 5 }, () => 
        authenticatedRequest('get', '/api/v1/analytics/dashboard')
      );

      const responses = await Promise.all(promises);

      // All responses should be successful and consistent
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.kpis).toBeDefined();
      });

      // All responses should return the same data
      const firstResponse = responses[0].body.data;
      responses.slice(1).forEach(response => {
        expect(response.body.data.kpis).toEqual(firstResponse.kpis);
      });
    });

    it('should perform within acceptable time limits', async () => {
      const startTime = Date.now();
      
      const response = await authenticatedRequest('get', '/api/v1/analytics/dashboard')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.body.success).toBe(true);
      // Dashboard should respond within 2 seconds
      expect(responseTime).toBeLessThan(2000);
    });
  });
});