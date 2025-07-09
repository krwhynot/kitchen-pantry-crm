import { faker } from '@faker-js/faker'
import { SupabaseClient } from '@supabase/supabase-js'

export interface FactoryOptions {
  count?: number
  overrides?: Record<string, any>
  relationships?: Record<string, any>
}

export interface TestDataSeed {
  organizations: any[]
  users: any[]
  contacts: any[]
  interactions: any[]
  opportunities: any[]
  products: any[]
}

export class TestDataFactory {
  private client: SupabaseClient
  private createdIds: Map<string, string[]> = new Map()

  constructor(client: SupabaseClient) {
    this.client = client
  }

  // Organization factory
  createOrganization(overrides: Partial<any> = {}): any {
    const organizationType = faker.helpers.arrayElement(['restaurant', 'distributor', 'supplier', 'chain'])
    
    return {
      id: faker.string.uuid(),
      name: faker.company.name(),
      type: organizationType,
      industry: faker.helpers.arrayElement(['fast_food', 'fine_dining', 'casual_dining', 'food_service']),
      website: faker.internet.url(),
      phone: faker.phone.number(),
      email: faker.internet.email(),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state({ abbreviated: true }),
        zipCode: faker.location.zipCode(),
        country: 'US'
      },
      priority: faker.helpers.arrayElement(['high', 'medium', 'low']),
      segment: faker.helpers.arrayElement(['enterprise', 'mid_market', 'small_business']),
      annualRevenue: faker.number.int({ min: 100000, max: 50000000 }),
      employeeCount: faker.number.int({ min: 5, max: 1000 }),
      description: faker.company.catchPhrase(),
      tags: faker.helpers.arrayElements(['potential', 'hot_lead', 'existing_customer'], { min: 0, max: 3 }),
      isActive: faker.datatype.boolean(0.9),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      ...overrides
    }
  }

  // User factory
  createUser(overrides: Partial<any> = {}): any {
    const role = faker.helpers.arrayElement(['admin', 'manager', 'sales_rep', 'viewer'])
    
    return {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      role,
      organizationId: overrides.organizationId || faker.string.uuid(),
      phone: faker.phone.number(),
      territory: faker.location.state(),
      isActive: faker.datatype.boolean(0.95),
      emailVerified: faker.datatype.boolean(0.9),
      mfaEnabled: faker.datatype.boolean(0.3),
      lastLogin: faker.date.recent().toISOString(),
      loginCount: faker.number.int({ min: 0, max: 500 }),
      lastPasswordChange: faker.date.past().toISOString(),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      ...overrides
    }
  }

  // Contact factory
  createContact(overrides: Partial<any> = {}): any {
    return {
      id: faker.string.uuid(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      title: faker.person.jobTitle(),
      department: faker.commerce.department(),
      organizationId: overrides.organizationId || faker.string.uuid(),
      isPrimary: faker.datatype.boolean(0.2),
      role: faker.helpers.arrayElement(['decision_maker', 'influencer', 'user', 'gatekeeper', 'other']),
      preferredContactMethod: faker.helpers.arrayElement(['email', 'phone', 'text', 'in_person']),
      notes: faker.lorem.paragraph(),
      socialProfiles: {
        linkedin: faker.internet.url(),
        twitter: faker.internet.url(),
        facebook: faker.internet.url()
      },
      isActive: faker.datatype.boolean(0.9),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      ...overrides
    }
  }

  // Interaction factory
  createInteraction(overrides: Partial<any> = {}): any {
    const interactionType = faker.helpers.arrayElement(['call', 'email', 'meeting', 'demo', 'proposal', 'follow_up', 'other'])
    const isCompleted = faker.datatype.boolean(0.7)
    
    return {
      id: faker.string.uuid(),
      type: interactionType,
      subject: faker.lorem.sentence(),
      description: faker.lorem.paragraphs(2),
      contactId: overrides.contactId,
      organizationId: overrides.organizationId || faker.string.uuid(),
      opportunityId: overrides.opportunityId,
      userId: overrides.userId || faker.string.uuid(),
      scheduledAt: faker.date.future().toISOString(),
      completedAt: isCompleted ? faker.date.recent().toISOString() : null,
      duration: isCompleted ? faker.number.int({ min: 15, max: 120 }) : null,
      outcome: isCompleted ? faker.helpers.arrayElement(['positive', 'neutral', 'negative', 'no_response']) : null,
      nextSteps: faker.lorem.sentence(),
      location: faker.location.streetAddress(),
      attendees: faker.helpers.arrayElements([
        faker.person.fullName(),
        faker.person.fullName(),
        faker.person.fullName()
      ], { min: 0, max: 3 }),
      attachments: [],
      isCompleted,
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      ...overrides
    }
  }

  // Opportunity factory
  createOpportunity(overrides: Partial<any> = {}): any {
    const stage = faker.helpers.arrayElement(['prospecting', 'qualifying', 'proposal', 'negotiation', 'closed_won', 'closed_lost'])
    const isClosed = ['closed_won', 'closed_lost'].includes(stage)
    
    return {
      id: faker.string.uuid(),
      name: `${faker.company.name()} - ${faker.commerce.productName()}`,
      description: faker.lorem.paragraph(),
      organizationId: overrides.organizationId || faker.string.uuid(),
      contactId: overrides.contactId,
      userId: overrides.userId || faker.string.uuid(),
      stage,
      value: faker.number.int({ min: 5000, max: 500000 }),
      probability: stage === 'closed_won' ? 100 : stage === 'closed_lost' ? 0 : faker.number.int({ min: 10, max: 90 }),
      expectedCloseDate: faker.date.future().toISOString(),
      actualCloseDate: isClosed ? faker.date.recent().toISOString() : null,
      source: faker.helpers.arrayElement(['website', 'referral', 'cold_call', 'trade_show', 'advertising', 'other']),
      competitorNotes: faker.lorem.sentence(),
      lossReason: stage === 'closed_lost' ? faker.lorem.sentence() : null,
      products: [],
      tags: faker.helpers.arrayElements(['urgent', 'strategic', 'competitive'], { min: 0, max: 3 }),
      isActive: !isClosed,
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      ...overrides
    }
  }

  // Product factory
  createProduct(overrides: Partial<any> = {}): any {
    const productCategory = faker.helpers.arrayElement(['beverages', 'proteins', 'produce', 'dairy', 'pantry', 'frozen'])
    
    return {
      id: faker.string.uuid(),
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      sku: faker.string.alphanumeric(8).toUpperCase(),
      category: productCategory,
      subcategory: faker.commerce.department(),
      brand: faker.company.name(),
      unitPrice: parseFloat(faker.commerce.price({ min: 5, max: 500 })),
      costPrice: parseFloat(faker.commerce.price({ min: 2, max: 250 })),
      unitOfMeasure: faker.helpers.arrayElement(['case', 'pound', 'gallon', 'each', 'dozen']),
      weight: faker.number.float({ min: 0.1, max: 50, fractionDigits: 2 }),
      dimensions: {
        length: faker.number.float({ min: 1, max: 24, fractionDigits: 1 }),
        width: faker.number.float({ min: 1, max: 24, fractionDigits: 1 }),
        height: faker.number.float({ min: 1, max: 24, fractionDigits: 1 }),
        unit: 'in'
      },
      nutritionalInfo: {
        calories: faker.number.int({ min: 50, max: 800 }),
        protein: faker.number.float({ min: 0, max: 50, fractionDigits: 1 }),
        carbs: faker.number.float({ min: 0, max: 100, fractionDigits: 1 }),
        fat: faker.number.float({ min: 0, max: 50, fractionDigits: 1 }),
        fiber: faker.number.float({ min: 0, max: 20, fractionDigits: 1 }),
        sodium: faker.number.int({ min: 0, max: 2000 })
      },
      allergens: faker.helpers.arrayElements(['dairy', 'gluten', 'nuts', 'soy', 'eggs'], { min: 0, max: 3 }),
      certifications: faker.helpers.arrayElements(['organic', 'non-gmo', 'kosher', 'halal'], { min: 0, max: 2 }),
      shelfLife: faker.number.int({ min: 30, max: 365 }),
      storageRequirements: faker.helpers.arrayElement(['refrigerated', 'frozen', 'dry', 'room_temperature']),
      minimumOrderQuantity: faker.number.int({ min: 1, max: 50 }),
      isActive: faker.datatype.boolean(0.9),
      imageUrls: [faker.image.url()],
      tags: faker.helpers.arrayElements(['popular', 'seasonal', 'premium', 'value'], { min: 0, max: 3 }),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      ...overrides
    }
  }

  // Generate related data set
  async createDataSet(options: {
    organizationCount?: number
    usersPerOrg?: number
    contactsPerOrg?: number
    interactionsPerContact?: number
    opportunitiesPerOrg?: number
    productCount?: number
  } = {}): Promise<TestDataSeed> {
    const {
      organizationCount = 5,
      usersPerOrg = 3,
      contactsPerOrg = 5,
      interactionsPerContact = 2,
      opportunitiesPerOrg = 3,
      productCount = 20
    } = options

    const seed: TestDataSeed = {
      organizations: [],
      users: [],
      contacts: [],
      interactions: [],
      opportunities: [],
      products: []
    }

    // Create organizations
    for (let i = 0; i < organizationCount; i++) {
      const org = this.createOrganization()
      seed.organizations.push(org)

      // Create users for this organization
      for (let j = 0; j < usersPerOrg; j++) {
        const user = this.createUser({ organizationId: org.id })
        seed.users.push(user)
      }

      // Create contacts for this organization
      for (let k = 0; k < contactsPerOrg; k++) {
        const contact = this.createContact({ organizationId: org.id })
        seed.contacts.push(contact)

        // Create interactions for this contact
        for (let l = 0; l < interactionsPerContact; l++) {
          const interaction = this.createInteraction({
            organizationId: org.id,
            contactId: contact.id,
            userId: seed.users[faker.number.int({ min: 0, max: seed.users.length - 1 })]?.id
          })
          seed.interactions.push(interaction)
        }
      }

      // Create opportunities for this organization
      for (let m = 0; m < opportunitiesPerOrg; m++) {
        const opportunity = this.createOpportunity({
          organizationId: org.id,
          contactId: faker.helpers.arrayElement(seed.contacts.filter(c => c.organizationId === org.id))?.id,
          userId: faker.helpers.arrayElement(seed.users.filter(u => u.organizationId === org.id))?.id
        })
        seed.opportunities.push(opportunity)
      }
    }

    // Create products (not organization-specific)
    for (let n = 0; n < productCount; n++) {
      const product = this.createProduct()
      seed.products.push(product)
    }

    return seed
  }

  // Seed database with generated data
  async seedDatabase(seed: TestDataSeed): Promise<void> {
    try {
      console.log('🌱 Seeding test database...')

      // Seed in dependency order
      const tables = ['organizations', 'users', 'contacts', 'products', 'interactions', 'opportunities']
      
      for (const table of tables) {
        const data = seed[table as keyof TestDataSeed] as any[]
        if (data.length > 0) {
          console.log(`  📝 Seeding ${data.length} ${table}`)
          
          const { error } = await this.client
            .from(table)
            .insert(data)

          if (error) {
            throw new Error(`Failed to seed ${table}: ${error.message}`)
          }

          // Track created IDs for cleanup
          const ids = data.map(item => item.id)
          this.createdIds.set(table, [...(this.createdIds.get(table) || []), ...ids])
        }
      }

      console.log('✅ Test database seeded successfully')
    } catch (error) {
      console.error('❌ Failed to seed test database:', error)
      throw error
    }
  }

  // Quick factory methods for common scenarios
  async createMinimalDataSet(): Promise<TestDataSeed> {
    return this.createDataSet({
      organizationCount: 1,
      usersPerOrg: 1,
      contactsPerOrg: 2,
      interactionsPerContact: 1,
      opportunitiesPerOrg: 1,
      productCount: 5
    })
  }

  async createLargeDataSet(): Promise<TestDataSeed> {
    return this.createDataSet({
      organizationCount: 20,
      usersPerOrg: 5,
      contactsPerOrg: 15,
      interactionsPerContact: 5,
      opportunitiesPerOrg: 8,
      productCount: 100
    })
  }

  // Cleanup helper
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up test data...')

    const tables = ['interactions', 'opportunities', 'contacts', 'users', 'products', 'organizations']
    
    for (const table of tables) {
      const ids = this.createdIds.get(table)
      if (ids && ids.length > 0) {
        console.log(`  🗑️ Removing ${ids.length} ${table}`)
        
        const { error } = await this.client
          .from(table)
          .delete()
          .in('id', ids)

        if (error) {
          console.warn(`Warning: Failed to cleanup ${table}:`, error.message)
        }
      }
    }

    this.createdIds.clear()
    console.log('✅ Test data cleanup completed')
  }

  // Get specific factory method
  getFactoryMethod(entityType: string): (overrides?: any) => any {
    const factories: Record<string, (overrides?: any) => any> = {
      organization: this.createOrganization.bind(this),
      user: this.createUser.bind(this),
      contact: this.createContact.bind(this),
      interaction: this.createInteraction.bind(this),
      opportunity: this.createOpportunity.bind(this),
      product: this.createProduct.bind(this)
    }

    const factory = factories[entityType]
    if (!factory) {
      throw new Error(`Unknown entity type: ${entityType}`)
    }

    return factory
  }
}