import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient } from '../utils/api'
import type { Product } from '@shared/types'

export const useProductStore = defineStore('products', () => {
  // State
  const products = ref<Product[]>([])
  const currentProduct = ref<Product | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const getProductById = computed(() => (id: string) => 
    products.value.find(product => product.id === id)
  )

  const getProductsByCategory = computed(() => (category: string) =>
    products.value.filter(product => product.category === category)
  )

  const getProductBySku = computed(() => (sku: string) =>
    products.value.find(product => product.sku === sku)
  )

  const activeProducts = computed(() => 
    products.value.filter(product => product.isActive)
  )

  const inactiveProducts = computed(() => 
    products.value.filter(product => !product.isActive)
  )

  const categories = computed(() => 
    [...new Set(products.value.map(product => product.category))].sort()
  )

  const getProductsByPriceRange = computed(() => (minPrice: number, maxPrice: number) =>
    products.value.filter(product => 
      product.unitPrice >= minPrice && product.unitPrice <= maxPrice
    )
  )

  // Actions
  const fetchProducts = async (params?: {
    page?: number
    limit?: number
    category?: string
    isActive?: boolean
    minPrice?: number
    maxPrice?: number
  }) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await apiClient.get('/products', { params })
      
      if (response.data.status === 'success') {
        products.value = response.data.data
        return response.data.data
      }
      
      throw new Error(response.data.message || 'Failed to fetch products')
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to fetch products'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const fetchProductById = async (id: string) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await apiClient.get(`/products/${id}`)
      
      if (response.data.status === 'success') {
        currentProduct.value = response.data.data
        
        // Update in list if exists
        const index = products.value.findIndex(product => product.id === id)
        if (index !== -1) {
          products.value[index] = response.data.data
        }
        
        return response.data.data
      }
      
      throw new Error(response.data.message || 'Failed to fetch product')
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to fetch product'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const createProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await apiClient.post('/products', productData)
      
      if (response.data.status === 'success') {
        const newProduct = response.data.data
        products.value.push(newProduct)
        return newProduct
      }
      
      throw new Error(response.data.message || 'Failed to create product')
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to create product'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await apiClient.put(`/products/${id}`, productData)
      
      if (response.data.status === 'success') {
        const updatedProduct = response.data.data
        
        // Update in list
        const index = products.value.findIndex(product => product.id === id)
        if (index !== -1) {
          products.value[index] = updatedProduct
        }
        
        // Update current product if it's the same one
        if (currentProduct.value?.id === id) {
          currentProduct.value = updatedProduct
        }
        
        return updatedProduct
      }
      
      throw new Error(response.data.message || 'Failed to update product')
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to update product'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const deleteProduct = async (id: string) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await apiClient.delete(`/products/${id}`)
      
      if (response.data.status === 'success') {
        // Remove from list
        const index = products.value.findIndex(product => product.id === id)
        if (index !== -1) {
          products.value.splice(index, 1)
        }
        
        // Clear current product if it's the same one
        if (currentProduct.value?.id === id) {
          currentProduct.value = null
        }
        
        return true
      }
      
      throw new Error(response.data.message || 'Failed to delete product')
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to delete product'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const searchProducts = (searchTerm: string) => {
    if (!searchTerm.trim()) return products.value
    
    const term = searchTerm.toLowerCase()
    return products.value.filter(product => 
      product.name.toLowerCase().includes(term) ||
      product.description?.toLowerCase().includes(term) ||
      product.sku.toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term)
    )
  }

  const clearError = () => {
    error.value = null
  }

  const clearCurrentProduct = () => {
    currentProduct.value = null
  }

  return {
    // State
    products,
    currentProduct,
    isLoading,
    error,
    
    // Getters
    getProductById,
    getProductsByCategory,
    getProductBySku,
    activeProducts,
    inactiveProducts,
    categories,
    getProductsByPriceRange,
    
    // Actions
    fetchProducts,
    fetchProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    clearError,
    clearCurrentProduct
  }
})