import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useContactStore } from '../contacts'

// Mock the API client
const mockApiClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn()
}

vi.mock('../utils/api', () => ({
  apiClient: mockApiClient
}))

// Mock shared types
vi.mock('@shared/types', () => ({
  Contact: {}
}))

const mockContacts = [
  {
    id: 'contact-1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1-555-0123',
    title: 'Sales Manager',
    organizationId: 'org-1',
    isDecisionMaker: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: 'contact-2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+1-555-0456',
    title: 'Marketing Director',
    organizationId: 'org-1',
    isDecisionMaker: false,
    createdAt: '2023-01-02T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z'
  },
  {
    id: 'contact-3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    phone: '+1-555-0789',
    title: 'CEO',
    organizationId: 'org-2',
    isDecisionMaker: true,
    createdAt: '2023-01-03T00:00:00Z',
    updatedAt: '2023-01-03T00:00:00Z'
  }
]

describe('Contact Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('initializes with empty state', () => {
      const contactStore = useContactStore()
      
      expect(contactStore.contacts).toEqual([])
      expect(contactStore.currentContact).toBeNull()
      expect(contactStore.isLoading).toBe(false)
      expect(contactStore.error).toBeNull()
    })
  })

  describe('Computed Properties', () => {
    beforeEach(() => {
      const contactStore = useContactStore()
      contactStore.contacts = mockContacts
    })

    it('gets contact by id', () => {
      const contactStore = useContactStore()
      
      const contact = contactStore.getContactById('contact-1')
      expect(contact).toEqual(mockContacts[0])
      
      const nonExistentContact = contactStore.getContactById('non-existent')
      expect(nonExistentContact).toBeUndefined()
    })

    it('gets contacts by organization', () => {
      const contactStore = useContactStore()
      
      const org1Contacts = contactStore.getContactsByOrganization('org-1')
      expect(org1Contacts).toHaveLength(2)
      expect(org1Contacts).toEqual([mockContacts[0], mockContacts[1]])
      
      const org2Contacts = contactStore.getContactsByOrganization('org-2')
      expect(org2Contacts).toHaveLength(1)
      expect(org2Contacts).toEqual([mockContacts[2]])
      
      const nonExistentOrgContacts = contactStore.getContactsByOrganization('non-existent')
      expect(nonExistentOrgContacts).toEqual([])
    })

    it('gets decision makers', () => {
      const contactStore = useContactStore()
      
      const decisionMakers = contactStore.decisionMakers
      expect(decisionMakers).toHaveLength(2)
      expect(decisionMakers).toEqual([mockContacts[0], mockContacts[2]])
    })

    it('gets decision makers by organization', () => {
      const contactStore = useContactStore()
      
      const org1DecisionMakers = contactStore.getDecisionMakersByOrganization('org-1')
      expect(org1DecisionMakers).toHaveLength(1)
      expect(org1DecisionMakers).toEqual([mockContacts[0]])
      
      const org2DecisionMakers = contactStore.getDecisionMakersByOrganization('org-2')
      expect(org2DecisionMakers).toHaveLength(1)
      expect(org2DecisionMakers).toEqual([mockContacts[2]])
    })
  })

  describe('Actions', () => {
    describe('fetchContacts', () => {
      it('successfully fetches contacts', async () => {
        const contactStore = useContactStore()
        
        mockApiClient.get.mockResolvedValueOnce({
          data: {
            status: 'success',
            data: mockContacts
          }
        })

        const result = await contactStore.fetchContacts()

        expect(mockApiClient.get).toHaveBeenCalledWith('/contacts', { params: undefined })
        expect(contactStore.contacts).toEqual(mockContacts)
        expect(contactStore.isLoading).toBe(false)
        expect(contactStore.error).toBeNull()
        expect(result).toEqual(mockContacts)
      })

      it('fetches contacts with parameters', async () => {
        const contactStore = useContactStore()
        const params = { page: 1, limit: 10, organizationId: 'org-1' }
        
        mockApiClient.get.mockResolvedValueOnce({
          data: {
            status: 'success',
            data: mockContacts
          }
        })

        await contactStore.fetchContacts(params)

        expect(mockApiClient.get).toHaveBeenCalledWith('/contacts', { params })
      })

      it('handles fetch contacts error', async () => {
        const contactStore = useContactStore()
        const errorMessage = 'Failed to fetch contacts'
        
        mockApiClient.get.mockRejectedValueOnce({
          response: {
            data: {
              message: errorMessage
            }
          }
        })

        await expect(contactStore.fetchContacts()).rejects.toThrow()
        
        expect(contactStore.error).toBe(errorMessage)
        expect(contactStore.isLoading).toBe(false)
        expect(contactStore.contacts).toEqual([])
      })
    })

    describe('fetchContactById', () => {
      it('successfully fetches contact by id', async () => {
        const contactStore = useContactStore()
        const contactId = 'contact-1'
        
        mockApiClient.get.mockResolvedValueOnce({
          data: {
            status: 'success',
            data: mockContacts[0]
          }
        })

        const result = await contactStore.fetchContactById(contactId)

        expect(mockApiClient.get).toHaveBeenCalledWith(`/contacts/${contactId}`)
        expect(contactStore.currentContact).toEqual(mockContacts[0])
        expect(contactStore.isLoading).toBe(false)
        expect(contactStore.error).toBeNull()
        expect(result).toEqual(mockContacts[0])
      })

      it('updates existing contact in list', async () => {
        const contactStore = useContactStore()
        contactStore.contacts = [...mockContacts]
        
        const updatedContact = { ...mockContacts[0], name: 'Updated Name' }
        
        mockApiClient.get.mockResolvedValueOnce({
          data: {
            status: 'success',
            data: updatedContact
          }
        })

        await contactStore.fetchContactById('contact-1')

        expect(contactStore.contacts[0]).toEqual(updatedContact)
        expect(contactStore.currentContact).toEqual(updatedContact)
      })

      it('handles fetch contact by id error', async () => {
        const contactStore = useContactStore()
        const errorMessage = 'Contact not found'
        
        mockApiClient.get.mockRejectedValueOnce({
          response: {
            data: {
              message: errorMessage
            }
          }
        })

        await expect(contactStore.fetchContactById('non-existent')).rejects.toThrow()
        
        expect(contactStore.error).toBe(errorMessage)
        expect(contactStore.isLoading).toBe(false)
        expect(contactStore.currentContact).toBeNull()
      })
    })

    describe('createContact', () => {
      it('successfully creates a contact', async () => {
        const contactStore = useContactStore()
        const newContactData = {
          name: 'New Contact',
          email: 'new@example.com',
          phone: '+1-555-9999',
          title: 'New Title',
          organizationId: 'org-1',
          isDecisionMaker: false
        }
        
        const createdContact = {
          id: 'contact-4',
          ...newContactData,
          createdAt: '2023-01-04T00:00:00Z',
          updatedAt: '2023-01-04T00:00:00Z'
        }
        
        mockApiClient.post.mockResolvedValueOnce({
          data: {
            status: 'success',
            data: createdContact
          }
        })

        const result = await contactStore.createContact(newContactData)

        expect(mockApiClient.post).toHaveBeenCalledWith('/contacts', newContactData)
        expect(contactStore.contacts).toContain(createdContact)
        expect(contactStore.isLoading).toBe(false)
        expect(contactStore.error).toBeNull()
        expect(result).toEqual(createdContact)
      })

      it('handles create contact error', async () => {
        const contactStore = useContactStore()
        const errorMessage = 'Email already exists'
        
        mockApiClient.post.mockRejectedValueOnce({
          response: {
            data: {
              message: errorMessage
            }
          }
        })

        await expect(contactStore.createContact({
          name: 'Test',
          email: 'test@example.com',
          organizationId: 'org-1',
          isDecisionMaker: false
        })).rejects.toThrow()
        
        expect(contactStore.error).toBe(errorMessage)
        expect(contactStore.isLoading).toBe(false)
      })
    })

    describe('updateContact', () => {
      it('successfully updates a contact', async () => {
        const contactStore = useContactStore()
        contactStore.contacts = [...mockContacts]
        contactStore.currentContact = mockContacts[0]
        
        const updateData = { name: 'Updated Name' }
        const updatedContact = { ...mockContacts[0], ...updateData }
        
        mockApiClient.put.mockResolvedValueOnce({
          data: {
            status: 'success',
            data: updatedContact
          }
        })

        const result = await contactStore.updateContact('contact-1', updateData)

        expect(mockApiClient.put).toHaveBeenCalledWith('/contacts/contact-1', updateData)
        expect(contactStore.contacts[0]).toEqual(updatedContact)
        expect(contactStore.currentContact).toEqual(updatedContact)
        expect(contactStore.isLoading).toBe(false)
        expect(contactStore.error).toBeNull()
        expect(result).toEqual(updatedContact)
      })

      it('updates only list when current contact is different', async () => {
        const contactStore = useContactStore()
        contactStore.contacts = [...mockContacts]
        contactStore.currentContact = mockContacts[1] // Different contact
        
        const updateData = { name: 'Updated Name' }
        const updatedContact = { ...mockContacts[0], ...updateData }
        
        mockApiClient.put.mockResolvedValueOnce({
          data: {
            status: 'success',
            data: updatedContact
          }
        })

        await contactStore.updateContact('contact-1', updateData)

        expect(contactStore.contacts[0]).toEqual(updatedContact)
        expect(contactStore.currentContact).toEqual(mockContacts[1]) // Unchanged
      })

      it('handles update contact error', async () => {
        const contactStore = useContactStore()
        const errorMessage = 'Contact not found'
        
        mockApiClient.put.mockRejectedValueOnce({
          response: {
            data: {
              message: errorMessage
            }
          }
        })

        await expect(contactStore.updateContact('non-existent', { name: 'Test' })).rejects.toThrow()
        
        expect(contactStore.error).toBe(errorMessage)
        expect(contactStore.isLoading).toBe(false)
      })
    })

    describe('deleteContact', () => {
      it('successfully deletes a contact', async () => {
        const contactStore = useContactStore()
        contactStore.contacts = [...mockContacts]
        contactStore.currentContact = mockContacts[0]
        
        mockApiClient.delete.mockResolvedValueOnce({
          data: {
            status: 'success'
          }
        })

        const result = await contactStore.deleteContact('contact-1')

        expect(mockApiClient.delete).toHaveBeenCalledWith('/contacts/contact-1')
        expect(contactStore.contacts).toHaveLength(2)
        expect(contactStore.contacts.find(c => c.id === 'contact-1')).toBeUndefined()
        expect(contactStore.currentContact).toBeNull()
        expect(contactStore.isLoading).toBe(false)
        expect(contactStore.error).toBeNull()
        expect(result).toBe(true)
      })

      it('deletes from list only when current contact is different', async () => {
        const contactStore = useContactStore()
        contactStore.contacts = [...mockContacts]
        contactStore.currentContact = mockContacts[1] // Different contact
        
        mockApiClient.delete.mockResolvedValueOnce({
          data: {
            status: 'success'
          }
        })

        await contactStore.deleteContact('contact-1')

        expect(contactStore.contacts).toHaveLength(2)
        expect(contactStore.contacts.find(c => c.id === 'contact-1')).toBeUndefined()
        expect(contactStore.currentContact).toEqual(mockContacts[1]) // Unchanged
      })

      it('handles delete contact error', async () => {
        const contactStore = useContactStore()
        const errorMessage = 'Contact not found'
        
        mockApiClient.delete.mockRejectedValueOnce({
          response: {
            data: {
              message: errorMessage
            }
          }
        })

        await expect(contactStore.deleteContact('non-existent')).rejects.toThrow()
        
        expect(contactStore.error).toBe(errorMessage)
        expect(contactStore.isLoading).toBe(false)
      })
    })

    describe('clearError', () => {
      it('clears error state', () => {
        const contactStore = useContactStore()
        contactStore.error = 'Some error'

        contactStore.clearError()

        expect(contactStore.error).toBeNull()
      })
    })

    describe('clearCurrentContact', () => {
      it('clears current contact', () => {
        const contactStore = useContactStore()
        contactStore.currentContact = mockContacts[0]

        contactStore.clearCurrentContact()

        expect(contactStore.currentContact).toBeNull()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles API errors without response data', async () => {
      const contactStore = useContactStore()
      
      mockApiClient.get.mockRejectedValueOnce({
        message: 'Network error'
      })

      await expect(contactStore.fetchContacts()).rejects.toThrow()
      
      expect(contactStore.error).toBe('Network error')
    })

    it('uses default error messages', async () => {
      const contactStore = useContactStore()
      
      mockApiClient.get.mockRejectedValueOnce({})

      await expect(contactStore.fetchContacts()).rejects.toThrow()
      
      expect(contactStore.error).toBe('Failed to fetch contacts')
    })

    it('handles API response errors', async () => {
      const contactStore = useContactStore()
      
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          status: 'error',
          message: 'Invalid parameters'
        }
      })

      await expect(contactStore.fetchContacts()).rejects.toThrow('Invalid parameters')
      
      expect(contactStore.error).toBe('Invalid parameters')
    })
  })

  describe('Loading States', () => {
    it('manages loading state during operations', async () => {
      const contactStore = useContactStore()
      
      let resolvePromise: (value: any) => void
      const delayedPromise = new Promise(resolve => {
        resolvePromise = resolve
      })
      
      mockApiClient.get.mockReturnValueOnce(delayedPromise)

      const fetchPromise = contactStore.fetchContacts()

      // Should be loading
      expect(contactStore.isLoading).toBe(true)

      // Resolve the promise
      resolvePromise!({
        data: {
          status: 'success',
          data: mockContacts
        }
      })

      await fetchPromise

      // Should no longer be loading
      expect(contactStore.isLoading).toBe(false)
    })

    it('ensures loading is false after error', async () => {
      const contactStore = useContactStore()
      
      mockApiClient.get.mockRejectedValueOnce(new Error('Test error'))

      await expect(contactStore.fetchContacts()).rejects.toThrow()
      
      expect(contactStore.isLoading).toBe(false)
    })
  })

  describe('Data Consistency', () => {
    it('maintains data consistency across operations', async () => {
      const contactStore = useContactStore()
      
      // Initial fetch
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          status: 'success',
          data: mockContacts
        }
      })
      
      await contactStore.fetchContacts()
      expect(contactStore.contacts).toHaveLength(3)
      
      // Create new contact
      const newContact = {
        id: 'contact-4',
        name: 'New Contact',
        email: 'new@example.com',
        organizationId: 'org-1',
        isDecisionMaker: false,
        createdAt: '2023-01-04T00:00:00Z',
        updatedAt: '2023-01-04T00:00:00Z'
      }
      
      mockApiClient.post.mockResolvedValueOnce({
        data: {
          status: 'success',
          data: newContact
        }
      })
      
      await contactStore.createContact({
        name: 'New Contact',
        email: 'new@example.com',
        organizationId: 'org-1',
        isDecisionMaker: false
      })
      
      expect(contactStore.contacts).toHaveLength(4)
      expect(contactStore.contacts[3]).toEqual(newContact)
      
      // Update contact
      const updatedContact = { ...newContact, name: 'Updated Contact' }
      
      mockApiClient.put.mockResolvedValueOnce({
        data: {
          status: 'success',
          data: updatedContact
        }
      })
      
      await contactStore.updateContact('contact-4', { name: 'Updated Contact' })
      
      expect(contactStore.contacts[3]).toEqual(updatedContact)
      
      // Delete contact
      mockApiClient.delete.mockResolvedValueOnce({
        data: {
          status: 'success'
        }
      })
      
      await contactStore.deleteContact('contact-4')
      
      expect(contactStore.contacts).toHaveLength(3)
      expect(contactStore.contacts.find(c => c.id === 'contact-4')).toBeUndefined()
    })
  })
})