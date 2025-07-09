import { MockDataGenerator } from './mockData'
import type { 
  User, 
  Organization, 
  Contact, 
  Interaction, 
  Opportunity, 
  Product 
} from '@shared/types'

// Mock API service for development
export class MockApiService {
  private static instance: MockApiService
  private data: {
    users: User[]
    organizations: Organization[]
    contacts: Contact[]
    interactions: Interaction[]
    opportunities: Opportunity[]
    products: Product[]
  }

  private constructor() {
    this.data = MockDataGenerator.generateCompleteDataSet()
  }

  static getInstance(): MockApiService {
    if (!this.instance) {
      this.instance = new MockApiService()
    }
    return this.instance
  }

  // Generic delay for simulating network requests
  private async delay(ms: number = 300): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Generic response wrapper
  private createResponse<T>(data: T, status: number = 200) {
    return {
      data,
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      headers: {},
      config: {}
    }
  }

  // Users API
  async getUsers(): Promise<{ data: User[] }> {
    await this.delay()
    return this.createResponse(this.data.users)
  }

  async getUser(id: string): Promise<{ data: User }> {
    await this.delay()
    const user = this.data.users.find(u => u.id === id)
    if (!user) throw new Error('User not found')
    return this.createResponse(user)
  }

  async createUser(userData: Partial<User>): Promise<{ data: User }> {
    await this.delay()
    const user = MockDataGenerator.generateUser(userData)
    this.data.users.push(user)
    return this.createResponse(user)
  }

  async updateUser(id: string, userData: Partial<User>): Promise<{ data: User }> {
    await this.delay()
    const index = this.data.users.findIndex(u => u.id === id)
    if (index === -1) throw new Error('User not found')
    
    this.data.users[index] = { ...this.data.users[index], ...userData }
    return this.createResponse(this.data.users[index])
  }

  async deleteUser(id: string): Promise<{ data: { message: string } }> {
    await this.delay()
    const index = this.data.users.findIndex(u => u.id === id)
    if (index === -1) throw new Error('User not found')
    
    this.data.users.splice(index, 1)
    return this.createResponse({ message: 'User deleted successfully' })
  }

  // Organizations API
  async getOrganizations(): Promise<{ data: Organization[] }> {
    await this.delay()
    return this.createResponse(this.data.organizations)
  }

  async getOrganization(id: string): Promise<{ data: Organization }> {
    await this.delay()
    const org = this.data.organizations.find(o => o.id === id)
    if (!org) throw new Error('Organization not found')
    return this.createResponse(org)
  }

  async createOrganization(orgData: Partial<Organization>): Promise<{ data: Organization }> {
    await this.delay()
    const org = MockDataGenerator.generateOrganization(orgData)
    this.data.organizations.push(org)
    return this.createResponse(org)
  }

  async updateOrganization(id: string, orgData: Partial<Organization>): Promise<{ data: Organization }> {
    await this.delay()
    const index = this.data.organizations.findIndex(o => o.id === id)
    if (index === -1) throw new Error('Organization not found')
    
    this.data.organizations[index] = { ...this.data.organizations[index], ...orgData }
    return this.createResponse(this.data.organizations[index])
  }

  async deleteOrganization(id: string): Promise<{ data: { message: string } }> {
    await this.delay()
    const index = this.data.organizations.findIndex(o => o.id === id)
    if (index === -1) throw new Error('Organization not found')
    
    this.data.organizations.splice(index, 1)
    return this.createResponse({ message: 'Organization deleted successfully' })
  }

  // Contacts API
  async getContacts(): Promise<{ data: Contact[] }> {
    await this.delay()
    return this.createResponse(this.data.contacts)
  }

  async getContact(id: string): Promise<{ data: Contact }> {
    await this.delay()
    const contact = this.data.contacts.find(c => c.id === id)
    if (!contact) throw new Error('Contact not found')
    return this.createResponse(contact)
  }

  async createContact(contactData: Partial<Contact>): Promise<{ data: Contact }> {
    await this.delay()
    const contact = MockDataGenerator.generateContact(contactData)
    this.data.contacts.push(contact)
    return this.createResponse(contact)
  }

  async updateContact(id: string, contactData: Partial<Contact>): Promise<{ data: Contact }> {
    await this.delay()
    const index = this.data.contacts.findIndex(c => c.id === id)
    if (index === -1) throw new Error('Contact not found')
    
    this.data.contacts[index] = { ...this.data.contacts[index], ...contactData }
    return this.createResponse(this.data.contacts[index])
  }

  async deleteContact(id: string): Promise<{ data: { message: string } }> {
    await this.delay()
    const index = this.data.contacts.findIndex(c => c.id === id)
    if (index === -1) throw new Error('Contact not found')
    
    this.data.contacts.splice(index, 1)
    return this.createResponse({ message: 'Contact deleted successfully' })
  }

  // Interactions API
  async getInteractions(): Promise<{ data: Interaction[] }> {
    await this.delay()
    return this.createResponse(this.data.interactions)
  }

  async getInteraction(id: string): Promise<{ data: Interaction }> {
    await this.delay()
    const interaction = this.data.interactions.find(i => i.id === id)
    if (!interaction) throw new Error('Interaction not found')
    return this.createResponse(interaction)
  }

  async createInteraction(interactionData: Partial<Interaction>): Promise<{ data: Interaction }> {
    await this.delay()
    const interaction = MockDataGenerator.generateInteraction(interactionData)
    this.data.interactions.push(interaction)
    return this.createResponse(interaction)
  }

  async updateInteraction(id: string, interactionData: Partial<Interaction>): Promise<{ data: Interaction }> {
    await this.delay()
    const index = this.data.interactions.findIndex(i => i.id === id)
    if (index === -1) throw new Error('Interaction not found')
    
    this.data.interactions[index] = { ...this.data.interactions[index], ...interactionData }
    return this.createResponse(this.data.interactions[index])
  }

  async deleteInteraction(id: string): Promise<{ data: { message: string } }> {
    await this.delay()
    const index = this.data.interactions.findIndex(i => i.id === id)
    if (index === -1) throw new Error('Interaction not found')
    
    this.data.interactions.splice(index, 1)
    return this.createResponse({ message: 'Interaction deleted successfully' })
  }

  // Opportunities API
  async getOpportunities(): Promise<{ data: Opportunity[] }> {
    await this.delay()
    return this.createResponse(this.data.opportunities)
  }

  async getOpportunity(id: string): Promise<{ data: Opportunity }> {
    await this.delay()
    const opportunity = this.data.opportunities.find(o => o.id === id)
    if (!opportunity) throw new Error('Opportunity not found')
    return this.createResponse(opportunity)
  }

  async createOpportunity(opportunityData: Partial<Opportunity>): Promise<{ data: Opportunity }> {
    await this.delay()
    const opportunity = MockDataGenerator.generateOpportunity(opportunityData)
    this.data.opportunities.push(opportunity)
    return this.createResponse(opportunity)
  }

  async updateOpportunity(id: string, opportunityData: Partial<Opportunity>): Promise<{ data: Opportunity }> {
    await this.delay()
    const index = this.data.opportunities.findIndex(o => o.id === id)
    if (index === -1) throw new Error('Opportunity not found')
    
    this.data.opportunities[index] = { ...this.data.opportunities[index], ...opportunityData }
    return this.createResponse(this.data.opportunities[index])
  }

  async deleteOpportunity(id: string): Promise<{ data: { message: string } }> {
    await this.delay()
    const index = this.data.opportunities.findIndex(o => o.id === id)
    if (index === -1) throw new Error('Opportunity not found')
    
    this.data.opportunities.splice(index, 1)
    return this.createResponse({ message: 'Opportunity deleted successfully' })
  }

  // Products API
  async getProducts(): Promise<{ data: Product[] }> {
    await this.delay()
    return this.createResponse(this.data.products)
  }

  async getProduct(id: string): Promise<{ data: Product }> {
    await this.delay()
    const product = this.data.products.find(p => p.id === id)
    if (!product) throw new Error('Product not found')
    return this.createResponse(product)
  }

  async createProduct(productData: Partial<Product>): Promise<{ data: Product }> {
    await this.delay()
    const product = MockDataGenerator.generateProduct(productData)
    this.data.products.push(product)
    return this.createResponse(product)
  }

  async updateProduct(id: string, productData: Partial<Product>): Promise<{ data: Product }> {
    await this.delay()
    const index = this.data.products.findIndex(p => p.id === id)
    if (index === -1) throw new Error('Product not found')
    
    this.data.products[index] = { ...this.data.products[index], ...productData }
    return this.createResponse(this.data.products[index])
  }

  async deleteProduct(id: string): Promise<{ data: { message: string } }> {
    await this.delay()
    const index = this.data.products.findIndex(p => p.id === id)
    if (index === -1) throw new Error('Product not found')
    
    this.data.products.splice(index, 1)
    return this.createResponse({ message: 'Product deleted successfully' })
  }

  // Utility methods
  resetData(): void {
    this.data = MockDataGenerator.generateCompleteDataSet()
  }

  seedData(data: Partial<typeof this.data>): void {
    this.data = { ...this.data, ...data }
  }
}

// Export singleton instance
export const mockApi = MockApiService.getInstance()