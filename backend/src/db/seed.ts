import { supabaseAdmin } from '../config/database'

export class DatabaseSeeder {
  async clearDatabase(): Promise<void> {
    console.log('🧹 Clearing existing data...')
    
    const tables = [
      'interactions',
      'opportunities', 
      'contacts',
      'products',
      'users',
      'organizations'
    ]

    for (const table of tables) {
      const { error } = await supabaseAdmin.from(table).delete().neq('id', '')
      if (error) {
        console.warn(`Warning: Could not clear ${table}: ${error.message}`)
      }
    }
  }

  async seedOrganizations(): Promise<void> {
    console.log('🏢 Seeding organizations...')

    const organizations = [
      {
        name: 'Olive Garden',
        type: 'restaurant',
        address: '123 Main St, Orlando, FL 32801',
        phone: '(407) 555-0123',
        email: 'info@olivegarden.com',
        website: 'https://olivegarden.com'
      },
      {
        name: 'Sysco Food Services',
        type: 'distributor',
        address: '1390 Enclave Pkwy, Houston, TX 77077',
        phone: '(281) 555-0456',
        email: 'contact@sysco.com',
        website: 'https://sysco.com'
      },
      {
        name: 'Tyson Foods',
        type: 'manufacturer',
        address: '2200 Don Tyson Pkwy, Springdale, AR 72762',
        phone: '(479) 555-0789',
        email: 'info@tysonfoods.com',
        website: 'https://tysonfoods.com'
      },
      {
        name: 'McDonald\'s Corporation',
        type: 'restaurant',
        address: '110 N Carpenter St, Chicago, IL 60607',
        phone: '(630) 555-0321',
        email: 'corporate@mcdonalds.com',
        website: 'https://mcdonalds.com'
      },
      {
        name: 'Aramark Food Services',
        type: 'food_service',
        address: '2400 Market St, Philadelphia, PA 19103',
        phone: '(215) 555-0654',
        email: 'info@aramark.com',
        website: 'https://aramark.com'
      }
    ]

    const { data, error } = await supabaseAdmin
      .from('organizations')
      .insert(organizations)
      .select()

    if (error) {
      throw new Error(`Failed to seed organizations: ${error.message}`)
    }

    console.log(`✅ Created ${data.length} organizations`)
    return data
  }

  async seedUsers(organizations: any[]): Promise<void> {
    console.log('👥 Seeding users...')

    const users = [
      {
        email: 'admin@olivegarden.com',
        first_name: 'John',
        last_name: 'Smith',
        role: 'admin',
        organization_id: organizations.find(o => o.name === 'Olive Garden')?.id
      },
      {
        email: 'manager@sysco.com',
        first_name: 'Sarah',
        last_name: 'Johnson',
        role: 'manager',
        organization_id: organizations.find(o => o.name === 'Sysco Food Services')?.id
      },
      {
        email: 'sales@tysonfoods.com',
        first_name: 'Mike',
        last_name: 'Williams',
        role: 'sales_rep',
        organization_id: organizations.find(o => o.name === 'Tyson Foods')?.id
      },
      {
        email: 'director@mcdonalds.com',
        first_name: 'Lisa',
        last_name: 'Brown',
        role: 'manager',
        organization_id: organizations.find(o => o.name === 'McDonald\'s Corporation')?.id
      },
      {
        email: 'rep@aramark.com',
        first_name: 'David',
        last_name: 'Davis',
        role: 'sales_rep',
        organization_id: organizations.find(o => o.name === 'Aramark Food Services')?.id
      }
    ]

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert(users)
      .select()

    if (error) {
      throw new Error(`Failed to seed users: ${error.message}`)
    }

    console.log(`✅ Created ${data.length} users`)
    return data
  }

  async seedContacts(organizations: any[]): Promise<void> {
    console.log('📞 Seeding contacts...')

    const contacts = [
      {
        first_name: 'Maria',
        last_name: 'Rodriguez',
        title: 'Purchasing Manager',
        email: 'maria.rodriguez@olivegarden.com',
        phone: '(407) 555-0124',
        organization_id: organizations.find(o => o.name === 'Olive Garden')?.id,
        is_decision_maker: true
      },
      {
        first_name: 'James',
        last_name: 'Wilson',
        title: 'Executive Chef',
        email: 'james.wilson@olivegarden.com',
        phone: '(407) 555-0125',
        organization_id: organizations.find(o => o.name === 'Olive Garden')?.id,
        is_decision_maker: false
      },
      {
        first_name: 'Robert',
        last_name: 'Taylor',
        title: 'Operations Director',
        email: 'robert.taylor@sysco.com',
        phone: '(281) 555-0457',
        organization_id: organizations.find(o => o.name === 'Sysco Food Services')?.id,
        is_decision_maker: true
      },
      {
        first_name: 'Jennifer',
        last_name: 'Anderson',
        title: 'Sales Manager',
        email: 'jennifer.anderson@tysonfoods.com',
        phone: '(479) 555-0790',
        organization_id: organizations.find(o => o.name === 'Tyson Foods')?.id,
        is_decision_maker: true
      },
      {
        first_name: 'Michael',
        last_name: 'Thompson',
        title: 'Supply Chain Manager',
        email: 'michael.thompson@mcdonalds.com',
        phone: '(630) 555-0322',
        organization_id: organizations.find(o => o.name === 'McDonald\'s Corporation')?.id,
        is_decision_maker: true
      },
      {
        first_name: 'Emily',
        last_name: 'Garcia',
        title: 'Food Service Director',
        email: 'emily.garcia@aramark.com',
        phone: '(215) 555-0655',
        organization_id: organizations.find(o => o.name === 'Aramark Food Services')?.id,
        is_decision_maker: true
      }
    ]

    const { data, error } = await supabaseAdmin
      .from('contacts')
      .insert(contacts)
      .select()

    if (error) {
      throw new Error(`Failed to seed contacts: ${error.message}`)
    }

    console.log(`✅ Created ${data.length} contacts`)
    return data
  }

  async seedProducts(): Promise<void> {
    console.log('🥘 Seeding products...')

    const products = [
      {
        name: 'Premium Chicken Breast',
        description: 'Fresh, hormone-free chicken breast fillets',
        sku: 'CHK-BREAST-001',
        category: 'Poultry',
        unit_price: 12.99,
        unit: 'lb',
        is_active: true
      },
      {
        name: 'Organic Beef Ground',
        description: 'USDA certified organic ground beef, 80/20 lean',
        sku: 'BEEF-GROUND-002',
        category: 'Meat',
        unit_price: 8.49,
        unit: 'lb',
        is_active: true
      },
      {
        name: 'Wild-Caught Salmon',
        description: 'Fresh Atlantic salmon fillets, sustainably sourced',
        sku: 'FISH-SALMON-003',
        category: 'Seafood',
        unit_price: 18.99,
        unit: 'lb',
        is_active: true
      },
      {
        name: 'Pasta Penne Rigate',
        description: 'Italian durum wheat penne pasta, 20lb case',
        sku: 'PASTA-PENNE-004',
        category: 'Dry Goods',
        unit_price: 24.99,
        unit: 'case',
        is_active: true
      },
      {
        name: 'Extra Virgin Olive Oil',
        description: 'Cold-pressed extra virgin olive oil, 1 gallon',
        sku: 'OIL-OLIVE-005',
        category: 'Condiments',
        unit_price: 32.99,
        unit: 'gallon',
        is_active: true
      },
      {
        name: 'Mozzarella Cheese Block',
        description: 'Low-moisture mozzarella cheese, 5lb block',
        sku: 'CHEESE-MOZZ-006',
        category: 'Dairy',
        unit_price: 15.99,
        unit: 'block',
        is_active: true
      },
      {
        name: 'Roma Tomatoes',
        description: 'Fresh roma tomatoes, 25lb case',
        sku: 'VEG-TOMATO-007',
        category: 'Produce',
        unit_price: 18.99,
        unit: 'case',
        is_active: true
      },
      {
        name: 'Garlic Powder',
        description: 'Premium garlic powder, 1lb container',
        sku: 'SPICE-GARLIC-008',
        category: 'Spices',
        unit_price: 6.99,
        unit: 'lb',
        is_active: true
      }
    ]

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert(products)
      .select()

    if (error) {
      throw new Error(`Failed to seed products: ${error.message}`)
    }

    console.log(`✅ Created ${data.length} products`)
    return data
  }

  async seedInteractions(contacts: any[], users: any[], organizations: any[]): Promise<void> {
    console.log('📝 Seeding interactions...')

    const interactions = [
      {
        type: 'email',
        subject: 'Q1 Product Catalog Review',
        content: 'Discussed new product offerings for Q1 2024',
        contact_id: contacts[0]?.id,
        organization_id: organizations.find(o => o.name === 'Olive Garden')?.id,
        user_id: users[0]?.id,
        completed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        type: 'call',
        subject: 'Pricing Discussion',
        content: 'Reviewed bulk pricing options for chicken products',
        contact_id: contacts[1]?.id,
        organization_id: organizations.find(o => o.name === 'Olive Garden')?.id,
        user_id: users[0]?.id,
        completed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        type: 'meeting',
        subject: 'Supply Chain Planning',
        content: 'Quarterly supply chain review and planning session',
        contact_id: contacts[2]?.id,
        organization_id: organizations.find(o => o.name === 'Sysco Food Services')?.id,
        user_id: users[1]?.id,
        scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        type: 'note',
        subject: 'Follow-up Required',
        content: 'Need to follow up on contract terms discussion',
        contact_id: contacts[3]?.id,
        organization_id: organizations.find(o => o.name === 'Tyson Foods')?.id,
        user_id: users[2]?.id,
        completed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]

    const { data, error } = await supabaseAdmin
      .from('interactions')
      .insert(interactions)
      .select()

    if (error) {
      throw new Error(`Failed to seed interactions: ${error.message}`)
    }

    console.log(`✅ Created ${data.length} interactions`)
    return data
  }

  async seedOpportunities(contacts: any[], users: any[], organizations: any[]): Promise<void> {
    console.log('💰 Seeding opportunities...')

    const opportunities = [
      {
        title: 'Q1 Chicken Supply Contract',
        description: 'Annual chicken supply contract for all Olive Garden locations',
        value: 250000.00,
        stage: 'proposal',
        probability: 75,
        expected_close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        organization_id: organizations.find(o => o.name === 'Olive Garden')?.id,
        contact_id: contacts[0]?.id,
        user_id: users[0]?.id
      },
      {
        title: 'Seafood Product Line Expansion',
        description: 'Expanding seafood offerings for premium menu items',
        value: 150000.00,
        stage: 'qualified',
        probability: 60,
        expected_close_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        organization_id: organizations.find(o => o.name === 'Olive Garden')?.id,
        contact_id: contacts[1]?.id,
        user_id: users[0]?.id
      },
      {
        title: 'Distribution Partnership',
        description: 'Strategic partnership for regional distribution',
        value: 500000.00,
        stage: 'negotiation',
        probability: 85,
        expected_close_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        organization_id: organizations.find(o => o.name === 'Sysco Food Services')?.id,
        contact_id: contacts[2]?.id,
        user_id: users[1]?.id
      },
      {
        title: 'Organic Beef Supply',
        description: 'Premium organic beef supply for restaurant chain',
        value: 320000.00,
        stage: 'lead',
        probability: 25,
        expected_close_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        organization_id: organizations.find(o => o.name === 'McDonald\'s Corporation')?.id,
        contact_id: contacts[4]?.id,
        user_id: users[3]?.id
      }
    ]

    const { data, error } = await supabaseAdmin
      .from('opportunities')
      .insert(opportunities)
      .select()

    if (error) {
      throw new Error(`Failed to seed opportunities: ${error.message}`)
    }

    console.log(`✅ Created ${data.length} opportunities`)
    return data
  }

  async run(): Promise<void> {
    try {
      console.log('🌱 Starting database seeding...')
      
      // Clear existing data
      await this.clearDatabase()
      
      // Seed data in dependency order
      const organizations = await this.seedOrganizations()
      const users = await this.seedUsers(organizations)
      const contacts = await this.seedContacts(organizations)
      const products = await this.seedProducts()
      const interactions = await this.seedInteractions(contacts, users, organizations)
      const opportunities = await this.seedOpportunities(contacts, users, organizations)

      console.log('🎉 Database seeding completed successfully!')
      console.log('📊 Summary:')
      console.log(`  - Organizations: ${organizations.length}`)
      console.log(`  - Users: ${users.length}`)
      console.log(`  - Contacts: ${contacts.length}`)
      console.log(`  - Products: ${products.length}`)
      console.log(`  - Interactions: ${interactions.length}`)
      console.log(`  - Opportunities: ${opportunities.length}`)
      
    } catch (error) {
      console.error('❌ Seeding failed:', error)
      throw error
    }
  }
}

// CLI interface
if (require.main === module) {
  const seeder = new DatabaseSeeder()
  seeder.run().catch(console.error)
}