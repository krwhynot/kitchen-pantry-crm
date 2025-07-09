import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient } from '../utils/api'
import type { Contact } from '@shared/types'

export const useContactStore = defineStore('contacts', () => {
  // State
  const contacts = ref<Contact[]>([])
  const currentContact = ref<Contact | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const getContactById = computed(() => (id: string) => 
    contacts.value.find(contact => contact.id === id)
  )

  const getContactsByOrganization = computed(() => (organizationId: string) =>
    contacts.value.filter(contact => contact.organizationId === organizationId)
  )

  const decisionMakers = computed(() => 
    contacts.value.filter(contact => contact.isDecisionMaker)
  )

  const getDecisionMakersByOrganization = computed(() => (organizationId: string) =>
    contacts.value.filter(contact => 
      contact.organizationId === organizationId && contact.isDecisionMaker
    )
  )

  // Actions
  const fetchContacts = async (params?: {
    page?: number
    limit?: number
    organizationId?: string
  }) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await apiClient.get('/contacts', { params })
      
      if (response.data.status === 'success') {
        contacts.value = response.data.data
        return response.data.data
      }
      
      throw new Error(response.data.message || 'Failed to fetch contacts')
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to fetch contacts'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const fetchContactById = async (id: string) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await apiClient.get(`/contacts/${id}`)
      
      if (response.data.status === 'success') {
        currentContact.value = response.data.data
        
        // Update in list if exists
        const index = contacts.value.findIndex(contact => contact.id === id)
        if (index !== -1) {
          contacts.value[index] = response.data.data
        }
        
        return response.data.data
      }
      
      throw new Error(response.data.message || 'Failed to fetch contact')
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to fetch contact'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const createContact = async (contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await apiClient.post('/contacts', contactData)
      
      if (response.data.status === 'success') {
        const newContact = response.data.data
        contacts.value.push(newContact)
        return newContact
      }
      
      throw new Error(response.data.message || 'Failed to create contact')
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to create contact'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateContact = async (id: string, contactData: Partial<Contact>) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await apiClient.put(`/contacts/${id}`, contactData)
      
      if (response.data.status === 'success') {
        const updatedContact = response.data.data
        
        // Update in list
        const index = contacts.value.findIndex(contact => contact.id === id)
        if (index !== -1) {
          contacts.value[index] = updatedContact
        }
        
        // Update current contact if it's the same one
        if (currentContact.value?.id === id) {
          currentContact.value = updatedContact
        }
        
        return updatedContact
      }
      
      throw new Error(response.data.message || 'Failed to update contact')
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to update contact'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const deleteContact = async (id: string) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await apiClient.delete(`/contacts/${id}`)
      
      if (response.data.status === 'success') {
        // Remove from list
        const index = contacts.value.findIndex(contact => contact.id === id)
        if (index !== -1) {
          contacts.value.splice(index, 1)
        }
        
        // Clear current contact if it's the same one
        if (currentContact.value?.id === id) {
          currentContact.value = null
        }
        
        return true
      }
      
      throw new Error(response.data.message || 'Failed to delete contact')
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to delete contact'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  const clearCurrentContact = () => {
    currentContact.value = null
  }

  return {
    // State
    contacts,
    currentContact,
    isLoading,
    error,
    
    // Getters
    getContactById,
    getContactsByOrganization,
    decisionMakers,
    getDecisionMakersByOrganization,
    
    // Actions
    fetchContacts,
    fetchContactById,
    createContact,
    updateContact,
    deleteContact,
    clearError,
    clearCurrentContact
  }
})