-- Kitchen Pantry CRM Development Seed Data
-- This file provides initial data for development and testing

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Insert sample organizations
INSERT INTO organizations (id, name, type, industry, phone, email, address, city, state, zip, country, website, description, created_at, updated_at)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Fine Dining Restaurant Group', 'restaurant', 'fine_dining', '555-0101', 'info@finedininggroup.com', '123 Main St', 'New York', 'NY', '10001', 'USA', 'https://finedininggroup.com', 'Premium restaurant chain focusing on fine dining experiences', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000002', 'Campus Catering Services', 'catering', 'institutional', '555-0102', 'orders@campuscatering.com', '456 University Ave', 'Boston', 'MA', '02101', 'USA', 'https://campuscatering.com', 'Large-scale catering for educational institutions', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000003', 'Metro Food Distribution', 'distributor', 'distribution', '555-0103', 'sales@metrofood.com', '789 Industrial Blvd', 'Chicago', 'IL', '60601', 'USA', 'https://metrofood.com', 'Regional food distribution and logistics', NOW(), NOW());

-- Insert sample users
INSERT INTO users (id, email, password_hash, first_name, last_name, role, territory, phone, avatar_url, is_active, last_login, created_at, updated_at)
VALUES 
    ('10000000-0000-0000-0000-000000000001', 'john.doe@kitchenpantry.com', '$2a$10$example.hash.here', 'John', 'Doe', 'admin', 'northeast', '555-1001', NULL, true, NOW(), NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000002', 'jane.smith@kitchenpantry.com', '$2a$10$example.hash.here', 'Jane', 'Smith', 'sales_rep', 'northeast', '555-1002', NULL, true, NOW(), NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000003', 'mike.johnson@kitchenpantry.com', '$2a$10$example.hash.here', 'Mike', 'Johnson', 'sales_rep', 'midwest', '555-1003', NULL, true, NOW(), NOW(), NOW());

-- Insert sample contacts
INSERT INTO contacts (id, organization_id, first_name, last_name, title, email, phone, mobile, role, decision_maker, notes, created_by, created_at, updated_at)
VALUES 
    ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Sarah', 'Wilson', 'Head Chef', 'sarah.wilson@finedininggroup.com', '555-0101', '555-0111', 'chef', true, 'Primary decision maker for menu items and ingredients', '10000000-0000-0000-0000-000000000001', NOW(), NOW()),
    ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Robert', 'Martinez', 'Procurement Manager', 'robert.martinez@campuscatering.com', '555-0102', '555-0112', 'procurement', true, 'Handles large volume orders and contract negotiations', '10000000-0000-0000-0000-000000000002', NOW(), NOW()),
    ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'Lisa', 'Chen', 'Operations Director', 'lisa.chen@metrofood.com', '555-0103', '555-0113', 'operations', true, 'Oversees distribution logistics and supplier relationships', '10000000-0000-0000-0000-000000000003', NOW(), NOW());

-- Insert sample products
INSERT INTO products (id, name, category, description, unit_price, unit_of_measure, supplier, sku, available, minimum_order, created_at, updated_at)
VALUES 
    ('30000000-0000-0000-0000-000000000001', 'Premium Angus Beef Ribeye', 'meat', 'Grade A Angus beef ribeye steaks, 12oz portions', 24.99, 'lb', 'Premium Beef Co', 'BEEF-RIB-12', true, 10, NOW(), NOW()),
    ('30000000-0000-0000-0000-000000000002', 'Organic Mixed Greens', 'produce', 'Fresh organic mixed greens, pre-washed and ready to serve', 8.99, 'lb', 'Fresh Farms LLC', 'GREENS-MIX-ORG', true, 5, NOW(), NOW()),
    ('30000000-0000-0000-0000-000000000003', 'Artisan Sourdough Bread', 'bakery', 'Handcrafted sourdough bread loaves, baked daily', 4.99, 'each', 'Artisan Bakery', 'BREAD-SOUR-ART', true, 12, NOW(), NOW());

-- Insert sample opportunities
INSERT INTO opportunities (id, organization_id, contact_id, assigned_to, title, description, stage, probability, value, expected_close_date, created_by, created_at, updated_at)
VALUES 
    ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Q1 Premium Meat Supply Contract', 'Negotiate exclusive supply agreement for premium meat products', 'negotiation', 75, 50000.00, '2025-03-31', '10000000-0000-0000-0000-000000000002', NOW(), NOW()),
    ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Campus Catering Expansion', 'Expand catering services to 3 additional campus locations', 'proposal', 60, 125000.00, '2025-04-15', '10000000-0000-0000-0000-000000000002', NOW(), NOW()),
    ('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'Distribution Partnership', 'Strategic partnership for regional distribution network', 'qualification', 40, 200000.00, '2025-05-30', '10000000-0000-0000-0000-000000000003', NOW(), NOW());

-- Insert sample interactions
INSERT INTO interactions (id, organization_id, contact_id, user_id, type, subject, content, outcome, next_action, scheduled_at, completed_at, created_at, updated_at)
VALUES 
    ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'phone_call', 'Initial Menu Planning Discussion', 'Discussed seasonal menu changes and ingredient requirements. Chef Wilson expressed interest in premium beef options.', 'positive', 'Send product catalog and pricing', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
    ('50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'meeting', 'Contract Review Meeting', 'Reviewed proposed contract terms and discussed volume pricing. Need to address delivery schedule concerns.', 'neutral', 'Prepare revised delivery schedule proposal', NOW() + INTERVAL '1 day', NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
    ('50000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'email', 'Partnership Proposal Follow-up', 'Sent detailed partnership proposal including logistics capabilities and territory coverage maps.', 'positive', 'Schedule presentation with executive team', NOW() + INTERVAL '3 days', NULL, NOW(), NOW());

-- Set up RLS policies for development (simplified for testing)
-- Note: In production, these should be more restrictive

-- Organizations policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for authenticated users" ON organizations
    FOR SELECT USING (auth.role() = 'authenticated');

-- Users policies  
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for authenticated users" ON users
    FOR SELECT USING (auth.role() = 'authenticated');

-- Contacts policies
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for authenticated users" ON contacts
    FOR SELECT USING (auth.role() = 'authenticated');

-- Products policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for authenticated users" ON products
    FOR SELECT USING (auth.role() = 'authenticated');

-- Opportunities policies
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for authenticated users" ON opportunities
    FOR SELECT USING (auth.role() = 'authenticated');

-- Interactions policies
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for authenticated users" ON interactions
    FOR SELECT USING (auth.role() = 'authenticated');