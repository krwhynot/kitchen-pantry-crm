import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient } from '../utils/api'
import type { Interaction } from '@shared/types'

export const useInteractionStore = defineStore('interactions', () => {
  // State
  const interactions = ref<Interaction[]>([])
  const currentInteraction = ref<Interaction | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const getInteractionById = computed(() => (id: string) => 
    interactions.value.find(interaction => interaction.id === id)
  )

  const getInteractionsByContact = computed(() => (contactId: string) =>
    interactions.value.filter(interaction => interaction.contactId === contactId)
  )

  const getInteractionsByOrganization = computed(() => (organizationId: string) =>
    interactions.value.filter(interaction => interaction.organizationId === organizationId)
  )

  const getInteractionsByType = computed(() => (type: Interaction['type']) =>
    interactions.value.filter(interaction => interaction.type === type)
  )

  const scheduledInteractions = computed(() => 
    interactions.value.filter(interaction => 
      interaction.scheduledAt && !interaction.completedAt
    )
  )

  const completedInteractions = computed(() => 
    interactions.value.filter(interaction => interaction.completedAt)
  )

  // Actions
  const fetchInteractions = async (params?: {
    page?: number
    limit?: number
    contactId?: string
    organizationId?: string
    type?: Interaction['type']
  }) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await apiClient.get('/interactions', { params })
      
      if (response.data.status === 'success') {
        interactions.value = response.data.data
        return response.data.data
      }
      
      throw new Error(response.data.message || 'Failed to fetch interactions')
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to fetch interactions'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const fetchInteractionById = async (id: string) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await apiClient.get(`/interactions/${id}`)
      
      if (response.data.status === 'success') {
        currentInteraction.value = response.data.data
        
        // Update in list if exists
        const index = interactions.value.findIndex(interaction => interaction.id === id)
        if (index !== -1) {
          interactions.value[index] = response.data.data
        }
        
        return response.data.data
      }
      
      throw new Error(response.data.message || 'Failed to fetch interaction')
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to fetch interaction'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const createInteraction = async (interactionData: Omit<Interaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await apiClient.post('/interactions', interactionData)
      
      if (response.data.status === 'success') {
        const newInteraction = response.data.data
        interactions.value.push(newInteraction)
        return newInteraction
      }
      
      throw new Error(response.data.message || 'Failed to create interaction')
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to create interaction'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateInteraction = async (id: string, interactionData: Partial<Interaction>) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await apiClient.put(`/interactions/${id}`, interactionData)
      
      if (response.data.status === 'success') {
        const updatedInteraction = response.data.data
        
        // Update in list
        const index = interactions.value.findIndex(interaction => interaction.id === id)
        if (index !== -1) {
          interactions.value[index] = updatedInteraction
        }
        
        // Update current interaction if it's the same one
        if (currentInteraction.value?.id === id) {
          currentInteraction.value = updatedInteraction
        }
        
        return updatedInteraction
      }
      
      throw new Error(response.data.message || 'Failed to update interaction')
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to update interaction'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const deleteInteraction = async (id: string) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await apiClient.delete(`/interactions/${id}`)
      
      if (response.data.status === 'success') {
        // Remove from list
        const index = interactions.value.findIndex(interaction => interaction.id === id)
        if (index !== -1) {
          interactions.value.splice(index, 1)
        }
        
        // Clear current interaction if it's the same one
        if (currentInteraction.value?.id === id) {
          currentInteraction.value = null
        }
        
        return true
      }
      
      throw new Error(response.data.message || 'Failed to delete interaction')
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to delete interaction'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  const clearCurrentInteraction = () => {
    currentInteraction.value = null
  }

  return {
    // State
    interactions,
    currentInteraction,
    isLoading,
    error,
    
    // Getters
    getInteractionById,
    getInteractionsByContact,
    getInteractionsByOrganization,
    getInteractionsByType,
    scheduledInteractions,
    completedInteractions,
    
    // Actions
    fetchInteractions,
    fetchInteractionById,
    createInteraction,
    updateInteraction,
    deleteInteraction,
    clearError,
    clearCurrentInteraction
  }
})