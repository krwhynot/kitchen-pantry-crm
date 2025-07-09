import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import request from 'supertest';
import app from '../src/app';

// Test database configuration
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/kitchen_pantry_test';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sbrlujvekkpthwztxfyo.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

// Global test client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test user credentials
export const testUser = {
  email: 'test@kitchenpantry.com',
  password: 'testpassword123',
  full_name: 'Test User',
  role: 'sales_rep'
};

// Global test fixtures
export let testAuthToken: string;
export let testUserId: string;
export let testOrganizationId: string;
export let testContactId: string;
export let testInteractionId: string;
export let testOpportunityId: string;

// Helper function to create test JWT token
export const createTestToken = (userId: string, email: string, role: string = 'sales_rep'): string => {
  // This is a simplified token creation for testing
  // In production, this would use proper JWT signing
  const payload = {
    sub: userId,
    email,
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  
  return Buffer.from(JSON.stringify(payload)).toString('base64');
};

// Helper function to make authenticated requests
export const authenticatedRequest = (method: 'get' | 'post' | 'put' | 'patch' | 'delete', url: string) => {
  return request(app)[method](url).set('Authorization', `Bearer ${testAuthToken}`);
};

// Database cleanup helper
export const cleanupDatabase = async (): Promise<void> => {
  try {
    // Clean up test data in reverse dependency order
    await supabase.from('interactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('opportunities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('contacts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('organizations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  } catch (error) {
    console.error('Database cleanup failed:', error);
  }
};

// Test data fixtures
export const testOrganizationData = {
  name: 'Test Restaurant Group',
  industry_segment: 'Fine Dining',
  priority_level: 'A',
  business_type: 'Restaurant Chain',
  annual_revenue: 1000000.00,
  employee_count: 50,
  website_url: 'https://testrestaurant.com',
  primary_phone: '+1-555-0123',
  primary_email: 'info@testrestaurant.com',
  billing_address: {
    street: '123 Test St',
    city: 'Test City',
    state: 'CA',
    postal_code: '90210',
    country: 'US'
  },
  payment_terms: 'Net 30',
  credit_limit: 50000.00,
  notes: 'Test organization for API testing'
};

export const testContactData = {
  first_name: 'Jane',
  last_name: 'Doe',
  job_title: 'Manager',
  department: 'Operations',
  is_primary_contact: true,
  is_decision_maker: true,
  authority_level: 4,
  email_primary: 'jane.doe@testrestaurant.com',
  phone_primary: '+1-555-0124',
  mobile_phone: '+1-555-0125',
  preferred_contact_method: 'email',
  preferred_contact_time: '9:00 AM - 5:00 PM EST',
  communication_preferences: {
    email_frequency: 'weekly',
    content_types: ['product_updates'],
    opt_out_marketing: false
  }
};

export const testInteractionData = {
  interaction_type: 'CALL',
  interaction_date: new Date().toISOString(),
  duration_minutes: 30,
  subject: 'Test Call',
  description: 'Test interaction for API testing',
  outcome: 'Positive',
  outcome_details: 'Good conversation about upcoming needs',
  follow_up_required: true,
  follow_up_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  follow_up_notes: 'Schedule follow-up meeting',
  sentiment_score: 4,
  priority_level: 'A',
  tags: ['test', 'api_testing']
};

export const testOpportunityData = {
  opportunity_name: 'Test Equipment Purchase',
  description: 'Test opportunity for API testing',
  opportunity_type: 'New Business',
  stage: 'qualification',
  probability: 60,
  estimated_value: 25000.00,
  estimated_close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  lead_source: 'API Testing',
  budget_confirmed: true,
  authority_confirmed: true,
  need_confirmed: true,
  timeline_confirmed: false,
  decision_criteria: 'Price, quality, delivery time',
  priority_level: 'A'
};

// Global setup
beforeAll(async () => {
  // Create test user and get auth token
  try {
    // Create test user profile
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .insert([{
        email: testUser.email,
        full_name: testUser.full_name,
        role: testUser.role
      }])
      .select()
      .single();

    if (userError) {
      console.error('Test user creation failed:', userError);
      throw userError;
    }

    testUserId = userData.id;
    testAuthToken = createTestToken(testUserId, testUser.email, testUser.role);

    console.log('Test setup completed successfully');
  } catch (error) {
    console.error('Test setup failed:', error);
    throw error;
  }
});

// Global cleanup
afterAll(async () => {
  await cleanupDatabase();
  console.log('Test cleanup completed');
});

// Test case setup
beforeEach(async () => {
  // Clean up any existing test data
  await cleanupDatabase();
});

// Test case cleanup
afterEach(async () => {
  // Additional cleanup if needed
});

// Mock console methods to reduce test noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};