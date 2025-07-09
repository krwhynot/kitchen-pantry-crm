import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient } from '../utils/api'
import type { Opportunity } from '@shared/types'

export const useOpportunityStore = defineStore('opportunities', () => {
  // State
  const opportunities = ref<Opportunity[]>([])
  const currentOpportunity = ref<Opportunity | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const getOpportunityById = computed(() => (id: string) => 
    opportunities.value.find(opportunity => opportunity.id === id)
  )

  const getOpportunitiesByContact = computed(() => (contactId: string) =>
    opportunities.value.filter(opportunity => opportunity.contactId === contactId)
  )

  const getOpportunitiesByOrganization = computed(() => (organizationId: string) =>
    opportunities.value.filter(opportunity => opportunity.organizationId === organizationId)
  )

  const getOpportunitiesByStage = computed(() => (stage: Opportunity['stage']) =>
    opportunities.value.filter(opportunity => opportunity.stage === stage)
  )

  const getOpportunitiesByUser = computed(() => (userId: string) =>
    opportunities.value.filter(opportunity => opportunity.userId === userId)
  )

  const activeOpportunities = computed(() => 
    opportunities.value.filter(opportunity => 
      !['closed_won', 'closed_lost'].includes(opportunity.stage)
    )
  )

  const wonOpportunities = computed(() => 
    opportunities.value.filter(opportunity => opportunity.stage === 'closed_won')
  )

  const lostOpportunities = computed(() => 
    opportunities.value.filter(opportunity => opportunity.stage === 'closed_lost')
  )

  const totalValue = computed(() => 
    opportunities.value.reduce((sum, opp) => sum + opp.value, 0)
  )

  const totalActiveValue = computed(() => 
    activeOpportunities.value.reduce((sum, opp) => sum + opp.value, 0)
  )

  const totalWonValue = computed(() => 
    wonOpportunities.value.reduce((sum, opp) => sum + opp.value, 0)
  )

  const weightedValue = computed(() => 
    opportunities.value.reduce((sum, opp) => sum + (opp.value * opp.probability / 100), 0)
  )

  // Actions
  const fetchOpportunities = async (params?: {
    page?: number
    limit?: number
    contactId?: string
    organizationId?: string
    userId?: string
    stage?: Opportunity['stage']
  }) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await apiClient.get('/opportunities', { params })
      
      if (response.data.status === 'success') {
        opportunities.value = response.data.data
        return response.data.data
      }
      
      throw new Error(response.data.message || 'Failed to fetch opportunities')
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to fetch opportunities'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const fetchOpportunityById = async (id: string) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await apiClient.get(`/opportunities/${id}`)
      
      if (response.data.status === 'success') {
        currentOpportunity.value = response.data.data
        
        // Update in list if exists
        const index = opportunities.value.findIndex(opportunity => opportunity.id === id)
        if (index !== -1) {
          opportunities.value[index] = response.data.data
        }
        
        return response.data.data
      }
      
      throw new Error(response.data.message || 'Failed to fetch opportunity')
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to fetch opportunity'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const createOpportunity = async (opportunityData: Omit<Opportunity, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await apiClient.post('/opportunities', opportunityData)
      
      if (response.data.status === 'success') {
        const newOpportunity = response.data.data
        opportunities.value.push(newOpportunity)
        return newOpportunity
      }
      
      throw new Error(response.data.message || 'Failed to create opportunity')
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to create opportunity'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateOpportunity = async (id: string, opportunityData: Partial<Opportunity>) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await apiClient.put(`/opportunities/${id}`, opportunityData)
      
      if (response.data.status === 'success') {
        const updatedOpportunity = response.data.data
        
        // Update in list
        const index = opportunities.value.findIndex(opportunity => opportunity.id === id)
        if (index !== -1) {
          opportunities.value[index] = updatedOpportunity
        }
        
        // Update current opportunity if it's the same one
        if (currentOpportunity.value?.id === id) {
          currentOpportunity.value = updatedOpportunity
        }
        
        return updatedOpportunity
      }
      
      throw new Error(response.data.message || 'Failed to update opportunity')
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to update opportunity'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const deleteOpportunity = async (id: string) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await apiClient.delete(`/opportunities/${id}`)
      
      if (response.data.status === 'success') {
        // Remove from list
        const index = opportunities.value.findIndex(opportunity => opportunity.id === id)
        if (index !== -1) {
          opportunities.value.splice(index, 1)
        }
        
        // Clear current opportunity if it's the same one
        if (currentOpportunity.value?.id === id) {
          currentOpportunity.value = null
        }
        
        return true
      }
      
      throw new Error(response.data.message || 'Failed to delete opportunity')
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to delete opportunity'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  const clearCurrentOpportunity = () => {
    currentOpportunity.value = null
  }

  return {
    // State
    opportunities,
    currentOpportunity,
    isLoading,
    error,
    
    // Getters
    getOpportunityById,
    getOpportunitiesByContact,
    getOpportunitiesByOrganization,
    getOpportunitiesByStage,
    getOpportunitiesByUser,
    activeOpportunities,
    wonOpportunities,
    lostOpportunities,
    totalValue,
    totalActiveValue,
    totalWonValue,
    weightedValue,
    
    // Actions
    fetchOpportunities,
    fetchOpportunityById,
    createOpportunity,
    updateOpportunity,
    deleteOpportunity,
    clearError,
    clearCurrentOpportunity
  }
})