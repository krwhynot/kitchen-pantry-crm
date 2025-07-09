import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient } from '../utils/api'
import type { Organization } from '@shared/types'

export const useOrganizationStore = defineStore('organizations', () => {
  // State
  const organizations = ref<Organization[]>([])
  const currentOrganization = ref<Organization | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const getOrganizationById = computed(() => (id: string) => 
    organizations.value.find(org => org.id === id)
  )

  const getOrganizationsByType = computed(() => (type: Organization['type']) =>
    organizations.value.filter(org => org.type === type)
  )

  const restaurantOrganizations = computed(() => 
    getOrganizationsByType.value('restaurant')
  )

  const distributorOrganizations = computed(() => 
    getOrganizationsByType.value('distributor')
  )

  const manufacturerOrganizations = computed(() => 
    getOrganizationsByType.value('manufacturer')
  )

  const foodServiceOrganizations = computed(() => 
    getOrganizationsByType.value('food_service')
  )

  // Actions
  const fetchOrganizations = async (params?: {
    page?: number
    limit?: number
    type?: Organization['type']
  }) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await apiClient.get('/organizations', { params })
      
      if (response.data.status === 'success') {
        organizations.value = response.data.data
        return response.data.data
      }
      
      throw new Error(response.data.message || 'Failed to fetch organizations')
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to fetch organizations'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const fetchOrganizationById = async (id: string) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await apiClient.get(`/organizations/${id}`)
      
      if (response.data.status === 'success') {
        currentOrganization.value = response.data.data
        
        // Update in list if exists
        const index = organizations.value.findIndex(org => org.id === id)
        if (index !== -1) {
          organizations.value[index] = response.data.data
        }
        
        return response.data.data
      }
      
      throw new Error(response.data.message || 'Failed to fetch organization')
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to fetch organization'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const createOrganization = async (organizationData: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await apiClient.post('/organizations', organizationData)
      
      if (response.data.status === 'success') {
        const newOrganization = response.data.data
        organizations.value.push(newOrganization)
        return newOrganization
      }
      
      throw new Error(response.data.message || 'Failed to create organization')
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to create organization'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateOrganization = async (id: string, organizationData: Partial<Organization>) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await apiClient.put(`/organizations/${id}`, organizationData)
      
      if (response.data.status === 'success') {
        const updatedOrganization = response.data.data
        
        // Update in list
        const index = organizations.value.findIndex(org => org.id === id)
        if (index !== -1) {
          organizations.value[index] = updatedOrganization
        }
        
        // Update current organization if it's the same one
        if (currentOrganization.value?.id === id) {
          currentOrganization.value = updatedOrganization
        }
        
        return updatedOrganization
      }
      
      throw new Error(response.data.message || 'Failed to update organization')
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to update organization'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const deleteOrganization = async (id: string) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await apiClient.delete(`/organizations/${id}`)
      
      if (response.data.status === 'success') {
        // Remove from list
        const index = organizations.value.findIndex(org => org.id === id)
        if (index !== -1) {
          organizations.value.splice(index, 1)
        }
        
        // Clear current organization if it's the same one
        if (currentOrganization.value?.id === id) {
          currentOrganization.value = null
        }
        
        return true
      }
      
      throw new Error(response.data.message || 'Failed to delete organization')
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to delete organization'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  const clearCurrentOrganization = () => {
    currentOrganization.value = null
  }

  return {
    // State
    organizations,
    currentOrganization,
    isLoading,
    error,
    
    // Getters
    getOrganizationById,
    getOrganizationsByType,
    restaurantOrganizations,
    distributorOrganizations,
    manufacturerOrganizations,
    foodServiceOrganizations,
    
    // Actions
    fetchOrganizations,
    fetchOrganizationById,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    clearError,
    clearCurrentOrganization
  }
})