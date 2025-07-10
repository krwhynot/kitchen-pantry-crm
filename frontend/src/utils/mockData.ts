import type { 
  User, 
  Organization, 
  Contact, 
  Interaction, 
  Opportunity, 
  Product 
} from '@shared/types'

// Mock data generators for development
export class MockDataGenerator {
  private static userCounter = 1
  private static orgCounter = 1
  private static contactCounter = 1
  private static interactionCounter = 1
  private static opportunityCounter = 1
  private static productCounter = 1

  static generateUser(overrides: Partial<User> = {}): User {
    const id = String(this.userCounter++)
    return {
      id,
      email: `user${id}@example.com`,
      name: `User ${id}`,
      first_name: `First${id}`,
      last_name: `Last${id}`,
      role: 'user',
      organization_id: '1',
      phone: `555-000${id.padStart(4, '0')}`,
      position: 'Sales Representative',
      is_active: true,
      last_login: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: '1',
      ...overrides
    }
  }

  static generateOrganization(overrides: Partial<Organization> = {}): Organization {
    const id = String(this.orgCounter++)
    const businessTypes = ['restaurant', 'catering', 'hotel', 'institutional']
    const statuses = ['active', 'inactive', 'prospect']
    
    return {
      id,
      name: `Organization ${id}`,
      type: businessTypes[Math.floor(Math.random() * businessTypes.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      email: `org${id}@example.com`,
      phone: `555-100${id.padStart(4, '0')}`,
      website: `https://org${id}.example.com`,
      address: `${id}00 Business St`,
      city: 'Business City',
      state: 'BC',
      zip: '12345',
      country: 'USA',
      industry: 'Food Service',
      size: Math.floor(Math.random() * 1000) + 10,
      annual_revenue: Math.floor(Math.random() * 10000000) + 100000,
      notes: `Development notes for organization ${id}`,
      tags: ['development', 'mock-data'],
      parent_organization_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: '1',
      ...overrides
    }
  }

  static generateContact(overrides: Partial<Contact> = {}): Contact {
    const id = String(this.contactCounter++)
    const titles = ['Manager', 'Director', 'Owner', 'Chef', 'Purchaser']
    const statuses = ['active', 'inactive']
    
    return {
      id,
      organization_id: '1',
      first_name: `First${id}`,
      last_name: `Last${id}`,
      email: `contact${id}@example.com`,
      phone: `555-200${id.padStart(4, '0')}`,
      mobile: `555-300${id.padStart(4, '0')}`,
      position: titles[Math.floor(Math.random() * titles.length)],
      department: 'Operations',
      is_primary: false,
      is_decision_maker: Math.random() > 0.5,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      notes: `Development notes for contact ${id}`,
      tags: ['development', 'mock-data'],
      linkedin_url: `https://linkedin.com/in/contact${id}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: '1',
      ...overrides
    }
  }

  static generateInteraction(overrides: Partial<Interaction> = {}): Interaction {
    const id = String(this.interactionCounter++)
    const types = ['call', 'email', 'meeting', 'visit', 'demo']
    const outcomes = ['successful', 'follow_up_needed', 'not_interested', 'callback_requested']
    
    return {
      id,
      organization_id: '1',
      contact_id: '1',
      user_id: '1',
      type: types[Math.floor(Math.random() * types.length)],
      subject: `Interaction ${id} Subject`,
      description: `Description for interaction ${id}. This is mock data for development.`,
      outcome: outcomes[Math.floor(Math.random() * outcomes.length)],
      follow_up_date: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      duration_minutes: Math.floor(Math.random() * 120) + 15,
      location: `Location ${id}`,
      notes: `Development notes for interaction ${id}`,
      tags: ['development', 'mock-data'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: '1',
      ...overrides
    }
  }

  static generateOpportunity(overrides: Partial<Opportunity> = {}): Opportunity {
    const id = String(this.opportunityCounter++)
    const stages = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost']
    const sources = ['referral', 'website', 'cold_call', 'trade_show', 'social_media']
    
    return {
      id,
      organization_id: '1',
      contact_id: '1',
      user_id: '1',
      name: `Opportunity ${id}`,
      description: `Description for opportunity ${id}. This is mock data for development.`,
      stage: stages[Math.floor(Math.random() * stages.length)],
      value: Math.floor(Math.random() * 100000) + 5000,
      probability: Math.floor(Math.random() * 100),
      expected_close_date: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      source: sources[Math.floor(Math.random() * sources.length)],
      competitor: Math.random() > 0.7 ? 'Competitor Corp' : null,
      notes: `Development notes for opportunity ${id}`,
      tags: ['development', 'mock-data'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: '1',
      ...overrides
    }
  }

  static generateProduct(overrides: Partial<Product> = {}): Product {
    const id = String(this.productCounter++)
    const categories = ['proteins', 'produce', 'dairy', 'beverages', 'dry_goods']
    const units = ['lb', 'kg', 'case', 'each', 'gallon']
    
    return {
      id,
      name: `Product ${id}`,
      description: `Description for product ${id}. This is mock data for development.`,
      category: categories[Math.floor(Math.random() * categories.length)],
      sku: `SKU-${id.padStart(6, '0')}`,
      unit: units[Math.floor(Math.random() * units.length)],
      price: Math.floor(Math.random() * 10000) + 100,
      cost: Math.floor(Math.random() * 5000) + 50,
      is_active: true,
      supplier: `Supplier ${id}`,
      brand: `Brand ${id}`,
      specifications: `Specifications for product ${id}`,
      storage_requirements: 'Refrigerated',
      shelf_life_days: Math.floor(Math.random() * 30) + 7,
      minimum_order_quantity: Math.floor(Math.random() * 10) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: '1',
      ...overrides
    }
  }

  // Generate bulk data
  static generateUsers(count: number = 10): User[] {
    return Array.from({ length: count }, () => this.generateUser())
  }

  static generateOrganizations(count: number = 10): Organization[] {
    return Array.from({ length: count }, () => this.generateOrganization())
  }

  static generateContacts(count: number = 10): Contact[] {
    return Array.from({ length: count }, () => this.generateContact())
  }

  static generateInteractions(count: number = 10): Interaction[] {
    return Array.from({ length: count }, () => this.generateInteraction())
  }

  static generateOpportunities(count: number = 10): Opportunity[] {
    return Array.from({ length: count }, () => this.generateOpportunity())
  }

  static generateProducts(count: number = 10): Product[] {
    return Array.from({ length: count }, () => this.generateProduct())
  }

  // Generate related data sets
  static generateCompleteDataSet() {
    const organizations = this.generateOrganizations(5)
    const users = this.generateUsers(3)
    const contacts = this.generateContacts(15)
    const interactions = this.generateInteractions(25)
    const opportunities = this.generateOpportunities(8)
    const products = this.generateProducts(20)

    // Link contacts to organizations
    contacts.forEach((contact, index) => {
      contact.organization_id = organizations[index % organizations.length].id
    })

    // Link interactions to contacts and organizations
    interactions.forEach((interaction, index) => {
      const contact = contacts[index % contacts.length]
      interaction.contact_id = contact.id
      interaction.organization_id = contact.organization_id
      interaction.user_id = users[index % users.length].id
    })

    // Link opportunities to contacts and organizations
    opportunities.forEach((opportunity, index) => {
      const contact = contacts[index % contacts.length]
      opportunity.contact_id = contact.id
      opportunity.organization_id = contact.organization_id
      opportunity.user_id = users[index % users.length].id
    })

    return {
      organizations,
      users,
      contacts,
      interactions,
      opportunities,
      products
    }
  }

  // Reset counters for testing
  static resetCounters() {
    this.userCounter = 1
    this.orgCounter = 1
    this.contactCounter = 1
    this.interactionCounter = 1
    this.opportunityCounter = 1
    this.productCounter = 1
  }
}

// Export individual generators for convenience
export const {
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
} = MockDataGenerator