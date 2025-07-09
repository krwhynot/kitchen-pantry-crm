import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { ContactService } from '../ContactService'
import { ContactModel } from '../../models/Contact'
import { OrganizationModel } from '../../models/Organization'
import { Contact } from '@shared/types'

// Mock the models
jest.mock('../../models/Contact')
jest.mock('../../models/Organization')

describe('ContactService', () => {
  let contactService: ContactService
  let mockContactModel: jest.Mocked<typeof ContactModel>
  let mockOrganizationModel: jest.Mocked<typeof OrganizationModel>

  const mockContact: Contact = {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    organizationId: 'org1',
    role: 'manager',
    title: 'Restaurant Manager',
    department: 'Operations',
    isDecisionMaker: true,
    influenceLevel: 'high',
    communicationPreferences: {
      email: true,
      phone: true,
      sms: false,
      inPerson: true
    },
    socialProfiles: {
      linkedin: 'https://linkedin.com/in/johndoe'
    },
    notes: 'Key contact for restaurant operations',
    isActive: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    createdBy: 'user1',
    updatedBy: 'user1'
  }

  const mockOrganization = {
    id: 'org1',
    name: 'Test Restaurant',
    type: 'restaurant',
    isActive: true
  }

  beforeEach(() => {
    mockContactModel = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByOrganization: jest.fn(),
      search: jest.fn(),
      findAll: jest.fn(),
      getAnalytics: jest.fn(),
      bulkUpdate: jest.fn(),
      findDuplicates: jest.fn(),
      validateSchema: jest.fn()
    } as any

    mockOrganizationModel = {
      findById: jest.fn(),
      findByName: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      search: jest.fn()
    } as any

    // Reset the mocks before each test
    jest.mocked(ContactModel).mockImplementation(() => mockContactModel as any)
    jest.mocked(OrganizationModel).mockImplementation(() => mockOrganizationModel as any)
    
    // Mock static methods
    Object.assign(ContactModel, mockContactModel)
    Object.assign(OrganizationModel, mockOrganizationModel)
    
    contactService = new ContactService()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('createContact', () => {
    const createData = {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '+1234567890',
      organizationId: 'org1',
      role: 'chef',
      title: 'Executive Chef',
      department: 'Kitchen',
      isDecisionMaker: false,
      influenceLevel: 'medium' as const,
      communicationPreferences: {
        email: true,
        phone: true,
        sms: false,
        inPerson: true
      },
      socialProfiles: {
        linkedin: 'https://linkedin.com/in/janesmith'
      },
      notes: 'Head chef with 10+ years experience'
    }

    it('should create contact successfully', async () => {
      mockOrganizationModel.findById.mockResolvedValue(mockOrganization)
      mockContactModel.findByEmail.mockResolvedValue(null)
      mockContactModel.create.mockResolvedValue(mockContact)

      const result = await contactService.createContact(createData, 'user1')

      expect(mockOrganizationModel.findById).toHaveBeenCalledWith('org1')
      expect(mockContactModel.findByEmail).toHaveBeenCalledWith('jane.smith@example.com')
      expect(mockContactModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createData,
          isActive: true,
          createdBy: 'user1',
          updatedBy: 'user1'
        })
      )
      expect(result).toEqual(mockContact)
    })

    it('should throw error if organization not found', async () => {
      mockOrganizationModel.findById.mockResolvedValue(null)

      await expect(
        contactService.createContact(createData, 'user1')
      ).rejects.toThrow('Organization not found')
    })

    it('should throw error if email already exists', async () => {
      mockOrganizationModel.findById.mockResolvedValue(mockOrganization)
      mockContactModel.findByEmail.mockResolvedValue(mockContact)

      await expect(
        contactService.createContact(createData, 'user1')
      ).rejects.toThrow('Contact with this email already exists')
    })

    it('should validate email format when provided', async () => {
      mockOrganizationModel.findById.mockResolvedValue(mockOrganization)
      mockContactModel.findByEmail.mockResolvedValue(null)

      await expect(
        contactService.createContact({
          ...createData,
          email: 'invalid-email'
        }, 'user1')
      ).rejects.toThrow('Invalid email format')
    })

    it('should validate phone number format when provided', async () => {
      mockOrganizationModel.findById.mockResolvedValue(mockOrganization)
      mockContactModel.findByEmail.mockResolvedValue(null)

      await expect(
        contactService.createContact({
          ...createData,
          phone: 'invalid-phone'
        }, 'user1')
      ).rejects.toThrow('Invalid phone number format')
    })

    it('should create contact without email', async () => {
      const dataWithoutEmail = { ...createData }
      delete dataWithoutEmail.email

      mockOrganizationModel.findById.mockResolvedValue(mockOrganization)
      mockContactModel.create.mockResolvedValue(mockContact)

      const result = await contactService.createContact(dataWithoutEmail, 'user1')

      expect(mockContactModel.findByEmail).not.toHaveBeenCalled()
      expect(mockContactModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...dataWithoutEmail,
          isActive: true,
          createdBy: 'user1',
          updatedBy: 'user1'
        })
      )
      expect(result).toEqual(mockContact)
    })

    it('should handle repository errors', async () => {
      mockOrganizationModel.findById.mockRejectedValue(new Error('Database error'))

      await expect(
        contactService.createContact(createData, 'user1')
      ).rejects.toThrow('Failed to create contact: Database error')
    })
  })

  describe('updateContact', () => {
    const updateData = {
      firstName: 'Jane',
      title: 'Senior Chef',
      isDecisionMaker: true,
      notes: 'Updated notes'
    }

    it('should update contact successfully', async () => {
      mockContactModel.findById.mockResolvedValue(mockContact)
      mockContactModel.update.mockResolvedValue({ ...mockContact, ...updateData })

      const result = await contactService.updateContact('1', updateData, 'user1')

      expect(mockContactModel.findById).toHaveBeenCalledWith('1')
      expect(mockContactModel.update).toHaveBeenCalledWith('1', 
        expect.objectContaining({
          ...updateData,
          updatedBy: 'user1'
        })
      )
      expect(result).toEqual({ ...mockContact, ...updateData })
    })

    it('should throw error if contact not found', async () => {
      mockContactModel.findById.mockResolvedValue(null)

      await expect(
        contactService.updateContact('1', updateData, 'user1')
      ).rejects.toThrow('Contact not found')
    })

    it('should validate organization exists when updating organizationId', async () => {
      mockContactModel.findById.mockResolvedValue(mockContact)
      mockOrganizationModel.findById.mockResolvedValue(null)

      await expect(
        contactService.updateContact('1', { organizationId: 'org2' }, 'user1')
      ).rejects.toThrow('Organization not found')
    })

    it('should check email uniqueness when updating email', async () => {
      mockContactModel.findById.mockResolvedValue(mockContact)
      mockContactModel.findByEmail.mockResolvedValue({ ...mockContact, id: '2' })

      await expect(
        contactService.updateContact('1', { email: 'existing@example.com' }, 'user1')
      ).rejects.toThrow('Contact with this email already exists')
    })

    it('should allow updating to same email', async () => {
      mockContactModel.findById.mockResolvedValue(mockContact)
      mockContactModel.findByEmail.mockResolvedValue(mockContact)
      mockContactModel.update.mockResolvedValue(mockContact)

      const result = await contactService.updateContact('1', { email: mockContact.email }, 'user1')

      expect(mockContactModel.update).toHaveBeenCalled()
      expect(result).toEqual(mockContact)
    })

    it('should validate email format when updating', async () => {
      mockContactModel.findById.mockResolvedValue(mockContact)

      await expect(
        contactService.updateContact('1', { email: 'invalid-email' }, 'user1')
      ).rejects.toThrow('Invalid email format')
    })

    it('should validate phone number format when updating', async () => {
      mockContactModel.findById.mockResolvedValue(mockContact)

      await expect(
        contactService.updateContact('1', { phone: 'invalid-phone' }, 'user1')
      ).rejects.toThrow('Invalid phone number format')
    })
  })

  describe('deleteContact', () => {
    it('should soft delete contact successfully', async () => {
      mockContactModel.findById.mockResolvedValue(mockContact)
      mockContactModel.update.mockResolvedValue({ ...mockContact, isActive: false })

      await contactService.deleteContact('1', 'user1')

      expect(mockContactModel.findById).toHaveBeenCalledWith('1')
      expect(mockContactModel.update).toHaveBeenCalledWith('1', 
        expect.objectContaining({
          isActive: false,
          deletedBy: 'user1'
        })
      )
    })

    it('should throw error if contact not found', async () => {
      mockContactModel.findById.mockResolvedValue(null)

      await expect(
        contactService.deleteContact('1', 'user1')
      ).rejects.toThrow('Contact not found')
    })

    it('should handle repository errors', async () => {
      mockContactModel.findById.mockRejectedValue(new Error('Database error'))

      await expect(
        contactService.deleteContact('1', 'user1')
      ).rejects.toThrow('Failed to delete contact: Database error')
    })
  })

  describe('getContactById', () => {
    it('should return contact when found', async () => {
      mockContactModel.findById.mockResolvedValue(mockContact)

      const result = await contactService.getContactById('1')

      expect(mockContactModel.findById).toHaveBeenCalledWith('1')
      expect(result).toEqual(mockContact)
    })

    it('should return null when not found', async () => {
      mockContactModel.findById.mockResolvedValue(null)

      const result = await contactService.getContactById('1')

      expect(result).toBeNull()
    })

    it('should handle repository errors', async () => {
      mockContactModel.findById.mockRejectedValue(new Error('Database error'))

      await expect(
        contactService.getContactById('1')
      ).rejects.toThrow('Failed to retrieve contact: Database error')
    })
  })

  describe('searchContacts', () => {
    const searchOptions = {
      query: 'john',
      organizationId: 'org1',
      role: 'manager',
      isDecisionMaker: true,
      limit: 10,
      offset: 0
    }

    it('should search contacts with query', async () => {
      const searchResults = [mockContact]
      mockContactModel.search.mockResolvedValue(searchResults)

      const result = await contactService.searchContacts(searchOptions)

      expect(mockContactModel.search).toHaveBeenCalledWith({
        query: 'john',
        organizationId: 'org1',
        role: 'manager',
        isDecisionMaker: true,
        limit: 10,
        offset: 0
      })
      expect(result).toEqual({
        data: searchResults,
        total: 1,
        page: 1,
        limit: 10
      })
    })

    it('should find all contacts when no query provided', async () => {
      const findAllResult = {
        data: [mockContact],
        total: 1
      }
      mockContactModel.findAll.mockResolvedValue(findAllResult)

      const result = await contactService.searchContacts({
        organizationId: 'org1',
        limit: 10,
        offset: 0
      })

      expect(mockContactModel.findAll).toHaveBeenCalledWith({
        organizationId: 'org1',
        limit: 10,
        offset: 0
      })
      expect(result).toEqual({
        data: [mockContact],
        total: 1,
        page: 1,
        limit: 10
      })
    })

    it('should use default limit and offset when not provided', async () => {
      const searchResults = [mockContact]
      mockContactModel.search.mockResolvedValue(searchResults)

      const result = await contactService.searchContacts({ query: 'john' })

      expect(mockContactModel.search).toHaveBeenCalledWith({
        query: 'john',
        limit: 20,
        offset: 0
      })
      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
    })

    it('should calculate page correctly', async () => {
      const searchResults = [mockContact]
      mockContactModel.search.mockResolvedValue(searchResults)

      const result = await contactService.searchContacts({
        query: 'john',
        limit: 10,
        offset: 20
      })

      expect(result.page).toBe(3) // offset 20 / limit 10 + 1
    })

    it('should handle repository errors', async () => {
      mockContactModel.search.mockRejectedValue(new Error('Database error'))

      await expect(
        contactService.searchContacts({ query: 'john' })
      ).rejects.toThrow('Failed to search contacts: Database error')
    })
  })

  describe('getContactsByOrganization', () => {
    it('should return contacts for organization', async () => {
      const contacts = [mockContact]
      mockContactModel.findByOrganization.mockResolvedValue(contacts)

      const result = await contactService.getContactsByOrganization('org1')

      expect(mockContactModel.findByOrganization).toHaveBeenCalledWith('org1', true)
      expect(result).toEqual(contacts)
    })

    it('should return inactive contacts when requested', async () => {
      const contacts = [mockContact]
      mockContactModel.findByOrganization.mockResolvedValue(contacts)

      const result = await contactService.getContactsByOrganization('org1', false)

      expect(mockContactModel.findByOrganization).toHaveBeenCalledWith('org1', false)
      expect(result).toEqual(contacts)
    })

    it('should handle repository errors', async () => {
      mockContactModel.findByOrganization.mockRejectedValue(new Error('Database error'))

      await expect(
        contactService.getContactsByOrganization('org1')
      ).rejects.toThrow('Failed to get contacts by organization: Database error')
    })
  })

  describe('getContactAnalytics', () => {
    it('should return analytics data', async () => {
      const analytics = {
        totalContacts: 100,
        byRole: { manager: 20, chef: 30, server: 50 },
        byDepartment: { kitchen: 30, service: 50, management: 20 },
        byInfluenceLevel: { high: 20, medium: 30, low: 50 },
        decisionMakersCount: 20,
        activeCount: 90,
        inactiveCount: 10,
        avgEngagementScore: 7.5,
        topEngagedContacts: [mockContact]
      }
      mockContactModel.getAnalytics.mockResolvedValue(analytics)

      const result = await contactService.getContactAnalytics()

      expect(mockContactModel.getAnalytics).toHaveBeenCalledWith(undefined)
      expect(result).toEqual(analytics)
    })

    it('should pass date range to repository', async () => {
      const dateRange = { start: new Date('2023-01-01'), end: new Date('2023-12-31') }
      mockContactModel.getAnalytics.mockResolvedValue({} as any)

      await contactService.getContactAnalytics(dateRange)

      expect(mockContactModel.getAnalytics).toHaveBeenCalledWith(dateRange)
    })

    it('should handle repository errors', async () => {
      mockContactModel.getAnalytics.mockRejectedValue(new Error('Database error'))

      await expect(
        contactService.getContactAnalytics()
      ).rejects.toThrow('Failed to get contact analytics: Database error')
    })
  })

  describe('bulkUpdateContacts', () => {
    it('should update multiple contacts successfully', async () => {
      const contactIds = ['1', '2', '3']
      const updateData = { role: 'senior_chef' }
      const updatedContacts = contactIds.map(id => ({ ...mockContact, id, ...updateData }))
      
      mockContactModel.bulkUpdate.mockResolvedValue(updatedContacts)

      const result = await contactService.bulkUpdateContacts(contactIds, updateData, 'user1')

      expect(mockContactModel.bulkUpdate).toHaveBeenCalledWith(contactIds, {
        ...updateData,
        updatedBy: 'user1'
      })
      expect(result).toEqual(updatedContacts)
    })

    it('should handle repository errors', async () => {
      mockContactModel.bulkUpdate.mockRejectedValue(new Error('Database error'))

      await expect(
        contactService.bulkUpdateContacts(['1', '2'], { role: 'chef' }, 'user1')
      ).rejects.toThrow('Failed to bulk update contacts: Database error')
    })
  })

  describe('findDuplicateContacts', () => {
    it('should find duplicate contacts', async () => {
      const duplicates = [mockContact]
      mockContactModel.findDuplicates.mockResolvedValue(duplicates)

      const result = await contactService.findDuplicateContacts()

      expect(mockContactModel.findDuplicates).toHaveBeenCalled()
      expect(result).toEqual(duplicates)
    })

    it('should handle repository errors', async () => {
      mockContactModel.findDuplicates.mockRejectedValue(new Error('Database error'))

      await expect(
        contactService.findDuplicateContacts()
      ).rejects.toThrow('Failed to find duplicate contacts: Database error')
    })
  })

  describe('validateContactData', () => {
    it('should validate contact data', async () => {
      const validData = { firstName: 'John', lastName: 'Doe', organizationId: 'org1' }
      mockContactModel.validateSchema.mockResolvedValue(validData)

      const result = await contactService.validateContactData(validData)

      expect(mockContactModel.validateSchema).toHaveBeenCalledWith(validData, false)
      expect(result).toEqual(validData)
    })

    it('should validate contact data for update', async () => {
      const validData = { firstName: 'John' }
      mockContactModel.validateSchema.mockResolvedValue(validData)

      const result = await contactService.validateContactData(validData, true)

      expect(mockContactModel.validateSchema).toHaveBeenCalledWith(validData, true)
      expect(result).toEqual(validData)
    })

    it('should handle validation errors', async () => {
      mockContactModel.validateSchema.mockRejectedValue(new Error('Validation error'))

      await expect(
        contactService.validateContactData({})
      ).rejects.toThrow('Failed to validate contact data: Validation error')
    })
  })
})