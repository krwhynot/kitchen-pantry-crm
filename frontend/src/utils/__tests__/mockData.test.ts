import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { 
  MockDataGenerator,
  generateUser,
  generateOrganization,
  generateContact,
  generateInteraction,
  generateOpportunity,
  generateProduct,
  generateUsers,
  generateOrganizations,
  generateContacts,
  generateInteractions,
  generateOpportunities,
  generateProducts,
  generateCompleteDataSet
} from '../mockData'

import type { 
  User, 
  Organization, 
  Contact, 
  Interaction, 
  Opportunity, 
  Product 
} from '@shared/types'

describe('MockDataGenerator', () => {
  beforeEach(() => {
    // Reset counters before each test
    MockDataGenerator.resetCounters()
  })

  afterEach(() => {
    // Clean up after each test
    MockDataGenerator.resetCounters()
  })

  describe('User generation', () => {
    it('should generate a user with default values', () => {
      const user = MockDataGenerator.generateUser()
      
      expect(user).toEqual({
        id: '1',
        email: 'user1@example.com',
        name: 'User 1',
        first_name: 'First1',
        last_name: 'Last1',
        role: 'user',
        organization_id: '1',
        phone: '555-0001',
        position: 'Sales Representative',
        is_active: true,
        last_login: expect.any(String),
        created_at: expect.any(String),
        updated_at: expect.any(String),
        created_by: '1'
      })
      
      expect(user.last_login).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
      expect(user.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
      expect(user.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
    })

    it('should increment user ID with each generation', () => {
      const user1 = MockDataGenerator.generateUser()
      const user2 = MockDataGenerator.generateUser()
      
      expect(user1.id).toBe('1')
      expect(user2.id).toBe('2')
      expect(user1.email).toBe('user1@example.com')
      expect(user2.email).toBe('user2@example.com')
    })

    it('should apply overrides to user generation', () => {
      const overrides = {
        name: 'Custom User',
        email: 'custom@example.com',
        role: 'admin' as const,
        is_active: false
      }
      
      const user = MockDataGenerator.generateUser(overrides)
      
      expect(user.name).toBe('Custom User')
      expect(user.email).toBe('custom@example.com')
      expect(user.role).toBe('admin')
      expect(user.is_active).toBe(false)
      expect(user.id).toBe('1') // Should still have default ID
    })

    it('should generate multiple users', () => {
      const users = MockDataGenerator.generateUsers(3)
      
      expect(users).toHaveLength(3)
      expect(users[0].id).toBe('1')
      expect(users[1].id).toBe('2')
      expect(users[2].id).toBe('3')
    })

    it('should generate default number of users', () => {
      const users = MockDataGenerator.generateUsers()
      
      expect(users).toHaveLength(10)
    })
  })

  describe('Organization generation', () => {
    it('should generate an organization with default values', () => {
      const org = MockDataGenerator.generateOrganization()
      
      expect(org).toEqual({
        id: '1',
        name: 'Organization 1',
        type: expect.any(String),
        status: expect.any(String),
        email: 'org1@example.com',
        phone: '555-1001',
        website: 'https://org1.example.com',
        address: '100 Business St',
        city: 'Business City',
        state: 'BC',
        zip: '12345',
        country: 'USA',
        industry: 'Food Service',
        size: expect.any(Number),
        annual_revenue: expect.any(Number),
        notes: 'Development notes for organization 1',
        tags: ['development', 'mock-data'],
        parent_organization_id: null,
        created_at: expect.any(String),
        updated_at: expect.any(String),
        created_by: '1'
      })
      
      expect(['restaurant', 'catering', 'hotel', 'institutional']).toContain(org.type)
      expect(['active', 'inactive', 'prospect']).toContain(org.status)
      expect(org.size).toBeGreaterThanOrEqual(10)
      expect(org.size).toBeLessThanOrEqual(1010)
      expect(org.annual_revenue).toBeGreaterThanOrEqual(100000)
      expect(org.annual_revenue).toBeLessThanOrEqual(10100000)
    })

    it('should increment organization ID with each generation', () => {
      const org1 = MockDataGenerator.generateOrganization()
      const org2 = MockDataGenerator.generateOrganization()
      
      expect(org1.id).toBe('1')
      expect(org2.id).toBe('2')
      expect(org1.name).toBe('Organization 1')
      expect(org2.name).toBe('Organization 2')
    })

    it('should apply overrides to organization generation', () => {
      const overrides = {
        name: 'Custom Restaurant',
        type: 'restaurant' as const,
        status: 'active' as const,
        size: 500
      }
      
      const org = MockDataGenerator.generateOrganization(overrides)
      
      expect(org.name).toBe('Custom Restaurant')
      expect(org.type).toBe('restaurant')
      expect(org.status).toBe('active')
      expect(org.size).toBe(500)
    })

    it('should generate multiple organizations', () => {
      const orgs = MockDataGenerator.generateOrganizations(5)
      
      expect(orgs).toHaveLength(5)
      expect(orgs.map(o => o.id)).toEqual(['1', '2', '3', '4', '5'])
    })
  })

  describe('Contact generation', () => {
    it('should generate a contact with default values', () => {
      const contact = MockDataGenerator.generateContact()
      
      expect(contact).toEqual({
        id: '1',
        organization_id: '1',
        first_name: 'First1',
        last_name: 'Last1',
        email: 'contact1@example.com',
        phone: '555-2001',
        mobile: '555-3001',
        position: expect.any(String),
        department: 'Operations',
        is_primary: false,
        is_decision_maker: expect.any(Boolean),
        status: expect.any(String),
        notes: 'Development notes for contact 1',
        tags: ['development', 'mock-data'],
        linkedin_url: 'https://linkedin.com/in/contact1',
        created_at: expect.any(String),
        updated_at: expect.any(String),
        created_by: '1'
      })
      
      expect(['Manager', 'Director', 'Owner', 'Chef', 'Purchaser']).toContain(contact.position)
      expect(['active', 'inactive']).toContain(contact.status)
      expect(typeof contact.is_decision_maker).toBe('boolean')
    })

    it('should increment contact ID with each generation', () => {
      const contact1 = MockDataGenerator.generateContact()
      const contact2 = MockDataGenerator.generateContact()
      
      expect(contact1.id).toBe('1')
      expect(contact2.id).toBe('2')
      expect(contact1.first_name).toBe('First1')
      expect(contact2.first_name).toBe('First2')
    })

    it('should apply overrides to contact generation', () => {
      const overrides = {
        first_name: 'John',
        last_name: 'Doe',
        position: 'CEO',
        is_primary: true,
        is_decision_maker: true
      }
      
      const contact = MockDataGenerator.generateContact(overrides)
      
      expect(contact.first_name).toBe('John')
      expect(contact.last_name).toBe('Doe')
      expect(contact.position).toBe('CEO')
      expect(contact.is_primary).toBe(true)
      expect(contact.is_decision_maker).toBe(true)
    })

    it('should generate multiple contacts', () => {
      const contacts = MockDataGenerator.generateContacts(3)
      
      expect(contacts).toHaveLength(3)
      expect(contacts.map(c => c.id)).toEqual(['1', '2', '3'])
    })
  })

  describe('Interaction generation', () => {
    it('should generate an interaction with default values', () => {
      const interaction = MockDataGenerator.generateInteraction()
      
      expect(interaction).toEqual({
        id: '1',
        organization_id: '1',
        contact_id: '1',
        user_id: '1',
        type: expect.any(String),
        subject: 'Interaction 1 Subject',
        description: 'Description for interaction 1. This is mock data for development.',
        outcome: expect.any(String),
        follow_up_date: expect.any(String),
        duration_minutes: expect.any(Number),
        location: 'Location 1',
        notes: 'Development notes for interaction 1',
        tags: ['development', 'mock-data'],
        created_at: expect.any(String),
        updated_at: expect.any(String),
        created_by: '1'
      })
      
      expect(['call', 'email', 'meeting', 'visit', 'demo']).toContain(interaction.type)
      expect(['successful', 'follow_up_needed', 'not_interested', 'callback_requested']).toContain(interaction.outcome)
      expect(interaction.duration_minutes).toBeGreaterThanOrEqual(15)
      expect(interaction.duration_minutes).toBeLessThanOrEqual(135)
      expect(interaction.follow_up_date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
    })

    it('should increment interaction ID with each generation', () => {
      const interaction1 = MockDataGenerator.generateInteraction()
      const interaction2 = MockDataGenerator.generateInteraction()
      
      expect(interaction1.id).toBe('1')
      expect(interaction2.id).toBe('2')
      expect(interaction1.subject).toBe('Interaction 1 Subject')
      expect(interaction2.subject).toBe('Interaction 2 Subject')
    })

    it('should apply overrides to interaction generation', () => {
      const overrides = {
        type: 'meeting' as const,
        subject: 'Custom Meeting',
        outcome: 'successful' as const,
        duration_minutes: 60
      }
      
      const interaction = MockDataGenerator.generateInteraction(overrides)
      
      expect(interaction.type).toBe('meeting')
      expect(interaction.subject).toBe('Custom Meeting')
      expect(interaction.outcome).toBe('successful')
      expect(interaction.duration_minutes).toBe(60)
    })

    it('should generate multiple interactions', () => {
      const interactions = MockDataGenerator.generateInteractions(4)
      
      expect(interactions).toHaveLength(4)
      expect(interactions.map(i => i.id)).toEqual(['1', '2', '3', '4'])
    })
  })

  describe('Opportunity generation', () => {
    it('should generate an opportunity with default values', () => {
      const opportunity = MockDataGenerator.generateOpportunity()
      
      expect(opportunity).toEqual({
        id: '1',
        organization_id: '1',
        contact_id: '1',
        user_id: '1',
        name: 'Opportunity 1',
        description: 'Description for opportunity 1. This is mock data for development.',
        stage: expect.any(String),
        value: expect.any(Number),
        probability: expect.any(Number),
        expected_close_date: expect.any(String),
        source: expect.any(String),
        competitor: expect.any(String),
        notes: 'Development notes for opportunity 1',
        tags: ['development', 'mock-data'],
        created_at: expect.any(String),
        updated_at: expect.any(String),
        created_by: '1'
      })
      
      expect(['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).toContain(opportunity.stage)
      expect(['referral', 'website', 'cold_call', 'trade_show', 'social_media']).toContain(opportunity.source)
      expect(opportunity.value).toBeGreaterThanOrEqual(5000)
      expect(opportunity.value).toBeLessThanOrEqual(105000)
      expect(opportunity.probability).toBeGreaterThanOrEqual(0)
      expect(opportunity.probability).toBeLessThanOrEqual(100)
      expect(opportunity.expected_close_date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
    })

    it('should sometimes generate competitor and sometimes null', () => {
      const opportunities = MockDataGenerator.generateOpportunities(20)
      const withCompetitor = opportunities.filter(o => o.competitor !== null)
      const withoutCompetitor = opportunities.filter(o => o.competitor === null)
      
      expect(withCompetitor.length).toBeGreaterThan(0)
      expect(withoutCompetitor.length).toBeGreaterThan(0)
    })

    it('should increment opportunity ID with each generation', () => {
      const opp1 = MockDataGenerator.generateOpportunity()
      const opp2 = MockDataGenerator.generateOpportunity()
      
      expect(opp1.id).toBe('1')
      expect(opp2.id).toBe('2')
      expect(opp1.name).toBe('Opportunity 1')
      expect(opp2.name).toBe('Opportunity 2')
    })

    it('should apply overrides to opportunity generation', () => {
      const overrides = {
        name: 'Custom Deal',
        stage: 'negotiation' as const,
        value: 50000,
        probability: 75,
        competitor: 'Competitor Corp'
      }
      
      const opportunity = MockDataGenerator.generateOpportunity(overrides)
      
      expect(opportunity.name).toBe('Custom Deal')
      expect(opportunity.stage).toBe('negotiation')
      expect(opportunity.value).toBe(50000)
      expect(opportunity.probability).toBe(75)
      expect(opportunity.competitor).toBe('Competitor Corp')
    })

    it('should generate multiple opportunities', () => {
      const opportunities = MockDataGenerator.generateOpportunities(6)
      
      expect(opportunities).toHaveLength(6)
      expect(opportunities.map(o => o.id)).toEqual(['1', '2', '3', '4', '5', '6'])
    })
  })

  describe('Product generation', () => {
    it('should generate a product with default values', () => {
      const product = MockDataGenerator.generateProduct()
      
      expect(product).toEqual({
        id: '1',
        name: 'Product 1',
        description: 'Description for product 1. This is mock data for development.',
        category: expect.any(String),
        sku: 'SKU-000001',
        unit: expect.any(String),
        price: expect.any(Number),
        cost: expect.any(Number),
        is_active: true,
        supplier: 'Supplier 1',
        brand: 'Brand 1',
        specifications: 'Specifications for product 1',
        storage_requirements: 'Refrigerated',
        shelf_life_days: expect.any(Number),
        minimum_order_quantity: expect.any(Number),
        created_at: expect.any(String),
        updated_at: expect.any(String),
        created_by: '1'
      })
      
      expect(['proteins', 'produce', 'dairy', 'beverages', 'dry_goods']).toContain(product.category)
      expect(['lb', 'kg', 'case', 'each', 'gallon']).toContain(product.unit)
      expect(product.price).toBeGreaterThanOrEqual(100)
      expect(product.price).toBeLessThanOrEqual(10100)
      expect(product.cost).toBeGreaterThanOrEqual(50)
      expect(product.cost).toBeLessThanOrEqual(5050)
      expect(product.shelf_life_days).toBeGreaterThanOrEqual(7)
      expect(product.shelf_life_days).toBeLessThanOrEqual(37)
      expect(product.minimum_order_quantity).toBeGreaterThanOrEqual(1)
      expect(product.minimum_order_quantity).toBeLessThanOrEqual(11)
    })

    it('should increment product ID with each generation', () => {
      const product1 = MockDataGenerator.generateProduct()
      const product2 = MockDataGenerator.generateProduct()
      
      expect(product1.id).toBe('1')
      expect(product2.id).toBe('2')
      expect(product1.name).toBe('Product 1')
      expect(product2.name).toBe('Product 2')
      expect(product1.sku).toBe('SKU-000001')
      expect(product2.sku).toBe('SKU-000002')
    })

    it('should apply overrides to product generation', () => {
      const overrides = {
        name: 'Custom Product',
        category: 'proteins' as const,
        unit: 'lb' as const,
        price: 2500,
        cost: 1500,
        is_active: false
      }
      
      const product = MockDataGenerator.generateProduct(overrides)
      
      expect(product.name).toBe('Custom Product')
      expect(product.category).toBe('proteins')
      expect(product.unit).toBe('lb')
      expect(product.price).toBe(2500)
      expect(product.cost).toBe(1500)
      expect(product.is_active).toBe(false)
    })

    it('should generate multiple products', () => {
      const products = MockDataGenerator.generateProducts(7)
      
      expect(products).toHaveLength(7)
      expect(products.map(p => p.id)).toEqual(['1', '2', '3', '4', '5', '6', '7'])
    })
  })

  describe('Complete data set generation', () => {
    it('should generate a complete related data set', () => {
      const dataSet = MockDataGenerator.generateCompleteDataSet()
      
      expect(dataSet).toEqual({
        organizations: expect.any(Array),
        users: expect.any(Array),
        contacts: expect.any(Array),
        interactions: expect.any(Array),
        opportunities: expect.any(Array),
        products: expect.any(Array)
      })
      
      expect(dataSet.organizations).toHaveLength(5)
      expect(dataSet.users).toHaveLength(3)
      expect(dataSet.contacts).toHaveLength(15)
      expect(dataSet.interactions).toHaveLength(25)
      expect(dataSet.opportunities).toHaveLength(8)
      expect(dataSet.products).toHaveLength(20)
    })

    it('should link contacts to organizations', () => {
      const dataSet = MockDataGenerator.generateCompleteDataSet()
      
      // All contacts should be linked to organizations
      dataSet.contacts.forEach(contact => {
        expect(dataSet.organizations.map(o => o.id)).toContain(contact.organization_id)
      })
    })

    it('should link interactions to contacts and organizations', () => {
      const dataSet = MockDataGenerator.generateCompleteDataSet()
      
      // All interactions should be linked to contacts and organizations
      dataSet.interactions.forEach(interaction => {
        expect(dataSet.contacts.map(c => c.id)).toContain(interaction.contact_id)
        expect(dataSet.organizations.map(o => o.id)).toContain(interaction.organization_id)
        expect(dataSet.users.map(u => u.id)).toContain(interaction.user_id)
        
        // Verify organization consistency
        const contact = dataSet.contacts.find(c => c.id === interaction.contact_id)
        expect(contact?.organization_id).toBe(interaction.organization_id)
      })
    })

    it('should link opportunities to contacts and organizations', () => {
      const dataSet = MockDataGenerator.generateCompleteDataSet()
      
      // All opportunities should be linked to contacts and organizations
      dataSet.opportunities.forEach(opportunity => {
        expect(dataSet.contacts.map(c => c.id)).toContain(opportunity.contact_id)
        expect(dataSet.organizations.map(o => o.id)).toContain(opportunity.organization_id)
        expect(dataSet.users.map(u => u.id)).toContain(opportunity.user_id)
        
        // Verify organization consistency
        const contact = dataSet.contacts.find(c => c.id === opportunity.contact_id)
        expect(contact?.organization_id).toBe(opportunity.organization_id)
      })
    })

    it('should distribute contacts across organizations', () => {
      const dataSet = MockDataGenerator.generateCompleteDataSet()
      
      // Each organization should have at least one contact
      dataSet.organizations.forEach(org => {
        const orgContacts = dataSet.contacts.filter(c => c.organization_id === org.id)
        expect(orgContacts.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Counter management', () => {
    it('should reset all counters', () => {
      // Generate some data to increment counters
      MockDataGenerator.generateUser()
      MockDataGenerator.generateOrganization()
      MockDataGenerator.generateContact()
      MockDataGenerator.generateInteraction()
      MockDataGenerator.generateOpportunity()
      MockDataGenerator.generateProduct()
      
      // Reset counters
      MockDataGenerator.resetCounters()
      
      // Generate new data and verify IDs start from 1
      expect(MockDataGenerator.generateUser().id).toBe('1')
      expect(MockDataGenerator.generateOrganization().id).toBe('1')
      expect(MockDataGenerator.generateContact().id).toBe('1')
      expect(MockDataGenerator.generateInteraction().id).toBe('1')
      expect(MockDataGenerator.generateOpportunity().id).toBe('1')
      expect(MockDataGenerator.generateProduct().id).toBe('1')
    })

    it('should maintain separate counters for each type', () => {
      const user = MockDataGenerator.generateUser()
      const org = MockDataGenerator.generateOrganization()
      const contact = MockDataGenerator.generateContact()
      
      expect(user.id).toBe('1')
      expect(org.id).toBe('1')
      expect(contact.id).toBe('1')
      
      const user2 = MockDataGenerator.generateUser()
      const org2 = MockDataGenerator.generateOrganization()
      const contact2 = MockDataGenerator.generateContact()
      
      expect(user2.id).toBe('2')
      expect(org2.id).toBe('2')
      expect(contact2.id).toBe('2')
    })
  })

  describe('Exported convenience functions', () => {
    it('should export individual generator functions', () => {
      expect(typeof generateUser).toBe('function')
      expect(typeof generateOrganization).toBe('function')
      expect(typeof generateContact).toBe('function')
      expect(typeof generateInteraction).toBe('function')
      expect(typeof generateOpportunity).toBe('function')
      expect(typeof generateProduct).toBe('function')
    })

    it('should export bulk generator functions', () => {
      expect(typeof generateUsers).toBe('function')
      expect(typeof generateOrganizations).toBe('function')
      expect(typeof generateContacts).toBe('function')
      expect(typeof generateInteractions).toBe('function')
      expect(typeof generateOpportunities).toBe('function')
      expect(typeof generateProducts).toBe('function')
    })

    it('should export complete data set function', () => {
      expect(typeof generateCompleteDataSet).toBe('function')
    })

    it('should work with exported functions', () => {
      MockDataGenerator.resetCounters()
      
      const user = generateUser()
      const org = generateOrganization()
      const users = generateUsers(2)
      const completeSet = generateCompleteDataSet()
      
      expect(user.id).toBe('1')
      expect(org.id).toBe('1')
      expect(users).toHaveLength(2)
      expect(completeSet.organizations).toHaveLength(5)
    })
  })

  describe('Data validation', () => {
    it('should generate valid ISO date strings', () => {
      const user = MockDataGenerator.generateUser()
      
      expect(new Date(user.created_at).toISOString()).toBe(user.created_at)
      expect(new Date(user.updated_at).toISOString()).toBe(user.updated_at)
      expect(new Date(user.last_login).toISOString()).toBe(user.last_login)
    })

    it('should generate valid email addresses', () => {
      const user = MockDataGenerator.generateUser()
      const contact = MockDataGenerator.generateContact()
      const org = MockDataGenerator.generateOrganization()
      
      expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      expect(contact.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      expect(org.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    })

    it('should generate valid phone numbers', () => {
      const user = MockDataGenerator.generateUser()
      const contact = MockDataGenerator.generateContact()
      const org = MockDataGenerator.generateOrganization()
      
      expect(user.phone).toMatch(/^555-\d{4}$/)
      expect(contact.phone).toMatch(/^555-\d{4}$/)
      expect(contact.mobile).toMatch(/^555-\d{4}$/)
      expect(org.phone).toMatch(/^555-\d{4}$/)
    })

    it('should generate valid URLs', () => {
      const org = MockDataGenerator.generateOrganization()
      const contact = MockDataGenerator.generateContact()
      
      expect(org.website).toMatch(/^https:\/\/[^\s]+$/)
      expect(contact.linkedin_url).toMatch(/^https:\/\/[^\s]+$/)
    })

    it('should generate valid SKUs', () => {
      const product = MockDataGenerator.generateProduct()
      
      expect(product.sku).toMatch(/^SKU-\d{6}$/)
    })

    it('should generate reasonable numeric values', () => {
      const org = MockDataGenerator.generateOrganization()
      const opportunity = MockDataGenerator.generateOpportunity()
      const product = MockDataGenerator.generateProduct()
      
      expect(org.size).toBeGreaterThan(0)
      expect(org.annual_revenue).toBeGreaterThan(0)
      expect(opportunity.value).toBeGreaterThan(0)
      expect(opportunity.probability).toBeGreaterThanOrEqual(0)
      expect(opportunity.probability).toBeLessThanOrEqual(100)
      expect(product.price).toBeGreaterThan(0)
      expect(product.cost).toBeGreaterThan(0)
      expect(product.shelf_life_days).toBeGreaterThan(0)
      expect(product.minimum_order_quantity).toBeGreaterThan(0)
    })
  })

  describe('Randomness and variation', () => {
    it('should generate different values for random fields', () => {
      const orgs = MockDataGenerator.generateOrganizations(10)
      const types = [...new Set(orgs.map(o => o.type))]
      const statuses = [...new Set(orgs.map(o => o.status))]
      
      expect(types.length).toBeGreaterThan(1)
      expect(statuses.length).toBeGreaterThan(1)
    })

    it('should generate different values for opportunity fields', () => {
      const opportunities = MockDataGenerator.generateOpportunities(20)
      const stages = [...new Set(opportunities.map(o => o.stage))]
      const sources = [...new Set(opportunities.map(o => o.source))]
      
      expect(stages.length).toBeGreaterThan(1)
      expect(sources.length).toBeGreaterThan(1)
    })

    it('should generate different values for product fields', () => {
      const products = MockDataGenerator.generateProducts(20)
      const categories = [...new Set(products.map(p => p.category))]
      const units = [...new Set(products.map(p => p.unit))]
      
      expect(categories.length).toBeGreaterThan(1)
      expect(units.length).toBeGreaterThan(1)
    })

    it('should generate different numeric values', () => {
      const orgs = MockDataGenerator.generateOrganizations(5)
      const sizes = orgs.map(o => o.size)
      const revenues = orgs.map(o => o.annual_revenue)
      
      expect(new Set(sizes).size).toBeGreaterThan(1)
      expect(new Set(revenues).size).toBeGreaterThan(1)
    })
  })
})