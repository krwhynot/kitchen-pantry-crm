import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient } from '../utils/api'
import type { User } from '@shared/types'

export const useUserStore = defineStore('users', () => {
  // State
  const users = ref<User[]>([])
  const currentUser = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const getUserById = computed(() => (id: string) => 
    users.value.find(user => user.id === id)
  )

  const getUsersByRole = computed(() => (role: User['role']) =>
    users.value.filter(user => user.role === role)
  )

  const getUsersByOrganization = computed(() => (organizationId: string) =>
    users.value.filter(user => user.organizationId === organizationId)
  )

  const adminUsers = computed(() => 
    users.value.filter(user => user.role === 'admin')
  )

  const managerUsers = computed(() => 
    users.value.filter(user => user.role === 'manager')
  )

  const salesRepUsers = computed(() => 
    users.value.filter(user => user.role === 'sales_rep')
  )

  const getUserByEmail = computed(() => (email: string) =>
    users.value.find(user => user.email === email)
  )

  // Actions
  const fetchUsers = async (params?: {
    page?: number
    limit?: number
    role?: User['role']
    organizationId?: string
  }) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await apiClient.get('/users', { params })
      
      if (response.data.status === 'success') {
        users.value = response.data.data
        return response.data.data
      }
      
      throw new Error(response.data.message || 'Failed to fetch users')
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to fetch users'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const fetchUserById = async (id: string) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await apiClient.get(`/users/${id}`)
      
      if (response.data.status === 'success') {
        currentUser.value = response.data.data
        
        // Update in list if exists
        const index = users.value.findIndex(user => user.id === id)
        if (index !== -1) {
          users.value[index] = response.data.data
        }
        
        return response.data.data
      }
      
      throw new Error(response.data.message || 'Failed to fetch user')
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to fetch user'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const createUser = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await apiClient.post('/users', userData)
      
      if (response.data.status === 'success') {
        const newUser = response.data.data
        users.value.push(newUser)
        return newUser
      }
      
      throw new Error(response.data.message || 'Failed to create user')
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to create user'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateUser = async (id: string, userData: Partial<User>) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await apiClient.put(`/users/${id}`, userData)
      
      if (response.data.status === 'success') {
        const updatedUser = response.data.data
        
        // Update in list
        const index = users.value.findIndex(user => user.id === id)
        if (index !== -1) {
          users.value[index] = updatedUser
        }
        
        // Update current user if it's the same one
        if (currentUser.value?.id === id) {
          currentUser.value = updatedUser
        }
        
        return updatedUser
      }
      
      throw new Error(response.data.message || 'Failed to update user')
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to update user'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const deleteUser = async (id: string) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await apiClient.delete(`/users/${id}`)
      
      if (response.data.status === 'success') {
        // Remove from list
        const index = users.value.findIndex(user => user.id === id)
        if (index !== -1) {
          users.value.splice(index, 1)
        }
        
        // Clear current user if it's the same one
        if (currentUser.value?.id === id) {
          currentUser.value = null
        }
        
        return true
      }
      
      throw new Error(response.data.message || 'Failed to delete user')
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to delete user'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const searchUsers = (searchTerm: string) => {
    if (!searchTerm.trim()) return users.value
    
    const term = searchTerm.toLowerCase()
    return users.value.filter(user => 
      user.firstName.toLowerCase().includes(term) ||
      user.lastName.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(term)
    )
  }

  const clearError = () => {
    error.value = null
  }

  const clearCurrentUser = () => {
    currentUser.value = null
  }

  return {
    // State
    users,
    currentUser,
    isLoading,
    error,
    
    // Getters
    getUserById,
    getUsersByRole,
    getUsersByOrganization,
    adminUsers,
    managerUsers,
    salesRepUsers,
    getUserByEmail,
    
    // Actions
    fetchUsers,
    fetchUserById,
    createUser,
    updateUser,
    deleteUser,
    searchUsers,
    clearError,
    clearCurrentUser
  }
})