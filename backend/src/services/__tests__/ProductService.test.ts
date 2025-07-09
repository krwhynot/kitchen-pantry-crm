import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { ProductService } from '../ProductService'
import { supabase } from '../../config/database'
import { Product } from '@shared/types'

// Mock the supabase client
jest.mock('../../config/database', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(() => ({
            range: jest.fn()
          }))
        })),
        or: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              range: jest.fn()
            }))
          })),
          gte: jest.fn(() => ({
            lte: jest.fn(() => ({
              order: jest.fn(() => ({
                range: jest.fn()
              }))
            }))
          }))
        })),
        order: jest.fn(() => ({
          range: jest.fn()
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn()
          }))
        }))
      }))
    }))
  }
}))

describe('ProductService', () => {
  let productService: ProductService
  let mockSupabase: any

  const mockProduct: Product = {
    id: '1',
    name: 'Test Product',
    description: 'A test product',
    sku: 'TEST-001',
    basePrice: 99.99,
    category: 'electronics',
    specifications: {
      weight: '1kg',
      dimensions: '10x10x5cm'
    },
    isActive: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    createdBy: 'user1',
    updatedBy: 'user1'
  }

  const mockProductCategory = {
    id: 'cat1',
    name: 'Electronics',
    description: 'Electronic products',
    isActive: true
  }

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn(),
      select: jest.fn(),
      eq: jest.fn(),
      or: jest.fn(),
      gte: jest.fn(),
      lte: jest.fn(),
      order: jest.fn(),
      range: jest.fn(),
      single: jest.fn(),
      insert: jest.fn(),
      update: jest.fn()
    }

    // Set up the chain of mocked methods
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.or.mockReturnValue(mockSupabase)
    mockSupabase.gte.mockReturnValue(mockSupabase)
    mockSupabase.lte.mockReturnValue(mockSupabase)
    mockSupabase.order.mockReturnValue(mockSupabase)
    mockSupabase.range.mockReturnValue(mockSupabase)
    mockSupabase.insert.mockReturnValue(mockSupabase)
    mockSupabase.update.mockReturnValue(mockSupabase)

    // Mock the actual supabase object
    jest.mocked(supabase).from.mockReturnValue(mockSupabase)
    
    productService = new ProductService()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getAllProducts', () => {
    it('should return all products with pagination', async () => {
      const mockResponse = {
        data: [mockProduct],
        error: null,
        count: 1
      }

      mockSupabase.range.mockResolvedValue(mockResponse)

      const result = await productService.getAllProducts({
        limit: 10,
        offset: 0
      })

      expect(supabase.from).toHaveBeenCalledWith('products')
      expect(mockSupabase.select).toHaveBeenCalledWith('*, product_categories!inner(*)', { count: 'exact' })
      expect(mockSupabase.order).toHaveBeenCalledWith('name')
      expect(mockSupabase.range).toHaveBeenCalledWith(0, 9)
      expect(result).toEqual({
        data: [mockProduct],
        total: 1,
        page: 1,
        limit: 10
      })
    })

    it('should apply search query filter', async () => {
      const mockResponse = {
        data: [mockProduct],
        error: null,
        count: 1
      }

      mockSupabase.range.mockResolvedValue(mockResponse)

      await productService.getAllProducts({
        query: 'test',
        limit: 10,
        offset: 0
      })

      expect(mockSupabase.or).toHaveBeenCalledWith('name.ilike.%test%,description.ilike.%test%,sku.ilike.%test%')
    })

    it('should apply category filter', async () => {
      const mockResponse = {
        data: [mockProduct],
        error: null,
        count: 1
      }

      mockSupabase.range.mockResolvedValue(mockResponse)

      await productService.getAllProducts({
        category: 'electronics',
        limit: 10,
        offset: 0
      })

      expect(mockSupabase.eq).toHaveBeenCalledWith('product_categories.name', 'electronics')
    })

    it('should apply active filter', async () => {
      const mockResponse = {
        data: [mockProduct],
        error: null,
        count: 1
      }

      mockSupabase.range.mockResolvedValue(mockResponse)

      await productService.getAllProducts({
        isActive: true,
        limit: 10,
        offset: 0
      })

      expect(mockSupabase.eq).toHaveBeenCalledWith('is_active', true)
    })

    it('should use default pagination values', async () => {
      const mockResponse = {
        data: [mockProduct],
        error: null,
        count: 1
      }

      mockSupabase.range.mockResolvedValue(mockResponse)

      await productService.getAllProducts({})

      expect(mockSupabase.range).toHaveBeenCalledWith(0, 19) // 20 items by default
    })

    it('should handle database errors', async () => {
      const mockError = new Error('Database error')
      mockSupabase.range.mockResolvedValue({
        data: null,
        error: mockError,
        count: 0
      })

      await expect(productService.getAllProducts({})).rejects.toThrow('Database error')
    })

    it('should handle empty results', async () => {
      const mockResponse = {
        data: null,
        error: null,
        count: 0
      }

      mockSupabase.range.mockResolvedValue(mockResponse)

      const result = await productService.getAllProducts({})

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 20
      })
    })
  })

  describe('getProductById', () => {
    it('should return product by id with all relations', async () => {
      const mockResponse = {
        data: mockProduct,
        error: null
      }

      mockSupabase.single.mockResolvedValue(mockResponse)

      const result = await productService.getProductById('1')

      expect(supabase.from).toHaveBeenCalledWith('products')
      expect(mockSupabase.select).toHaveBeenCalledWith(`
          *,
          product_categories(*),
          product_pricing_tiers(*),
          product_inventory(*),
          product_media(*),
          product_variants(*),
          product_suppliers(*)
        `)
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1')
      expect(mockSupabase.single).toHaveBeenCalled()
      expect(result).toEqual(mockProduct)
    })

    it('should return null when product not found', async () => {
      const mockResponse = {
        data: null,
        error: { code: 'PGRST116' }
      }

      mockSupabase.single.mockResolvedValue(mockResponse)

      const result = await productService.getProductById('999')

      expect(result).toBeNull()
    })

    it('should throw error for other database errors', async () => {
      const mockError = { code: 'OTHER_ERROR', message: 'Database error' }
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: mockError
      })

      await expect(productService.getProductById('1')).rejects.toEqual(mockError)
    })
  })

  describe('createProduct', () => {
    it('should create product successfully', async () => {
      const productData = {
        name: 'New Product',
        description: 'New product description',
        sku: 'NEW-001',
        basePrice: 149.99,
        category: 'electronics'
      }

      const mockResponse = {
        data: { ...productData, id: '2', createdBy: 'user1' },
        error: null
      }

      mockSupabase.single.mockResolvedValue(mockResponse)

      const result = await productService.createProduct(productData, 'user1')

      expect(supabase.from).toHaveBeenCalledWith('products')
      expect(mockSupabase.insert).toHaveBeenCalledWith([{
        ...productData,
        created_by: 'user1'
      }])
      expect(mockSupabase.select).toHaveBeenCalled()
      expect(mockSupabase.single).toHaveBeenCalled()
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle creation errors', async () => {
      const productData = {
        name: 'New Product',
        sku: 'NEW-001'
      }

      const mockError = new Error('Creation failed')
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: mockError
      })

      await expect(productService.createProduct(productData, 'user1')).rejects.toThrow('Creation failed')
    })
  })

  describe('updateProduct', () => {
    it('should update product successfully', async () => {
      const updateData = {
        name: 'Updated Product',
        description: 'Updated description',
        basePrice: 199.99
      }

      const mockResponse = {
        data: { ...mockProduct, ...updateData },
        error: null
      }

      mockSupabase.single.mockResolvedValue(mockResponse)

      const result = await productService.updateProduct('1', updateData, 'user1')

      expect(supabase.from).toHaveBeenCalledWith('products')
      expect(mockSupabase.update).toHaveBeenCalledWith({
        ...updateData,
        updated_at: expect.any(String)
      })
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1')
      expect(mockSupabase.select).toHaveBeenCalled()
      expect(mockSupabase.single).toHaveBeenCalled()
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle update errors', async () => {
      const updateData = { name: 'Updated Product' }
      const mockError = new Error('Update failed')
      
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: mockError
      })

      await expect(productService.updateProduct('1', updateData, 'user1')).rejects.toThrow('Update failed')
    })
  })

  describe('deleteProduct', () => {
    it('should soft delete product successfully', async () => {
      const mockResponse = {
        error: null
      }

      mockSupabase.eq.mockResolvedValue(mockResponse)

      await productService.deleteProduct('1', 'user1')

      expect(supabase.from).toHaveBeenCalledWith('products')
      expect(mockSupabase.update).toHaveBeenCalledWith({
        is_active: false,
        deleted_at: expect.any(String)
      })
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should handle delete errors', async () => {
      const mockError = new Error('Delete failed')
      mockSupabase.eq.mockResolvedValue({
        error: mockError
      })

      await expect(productService.deleteProduct('1', 'user1')).rejects.toThrow('Delete failed')
    })
  })

  describe('searchProducts', () => {
    it('should search products with all filters', async () => {
      const searchParams = {
        query: 'test',
        category: 'electronics',
        minPrice: 50,
        maxPrice: 200,
        isActive: true,
        limit: 10,
        offset: 0
      }

      const mockResponse = {
        data: [mockProduct],
        error: null,
        count: 1
      }

      mockSupabase.range.mockResolvedValue(mockResponse)

      const result = await productService.searchProducts(searchParams)

      expect(supabase.from).toHaveBeenCalledWith('products')
      expect(mockSupabase.select).toHaveBeenCalledWith('*, product_categories(*), product_pricing_tiers(*)', { count: 'exact' })
      expect(mockSupabase.or).toHaveBeenCalledWith('name.ilike.%test%,description.ilike.%test%,sku.ilike.%test%')
      expect(mockSupabase.eq).toHaveBeenCalledWith('product_categories.name', 'electronics')
      expect(mockSupabase.eq).toHaveBeenCalledWith('is_active', true)
      expect(mockSupabase.gte).toHaveBeenCalledWith('product_pricing_tiers.base_price', 50)
      expect(mockSupabase.lte).toHaveBeenCalledWith('product_pricing_tiers.base_price', 200)
      expect(mockSupabase.order).toHaveBeenCalledWith('name')
      expect(mockSupabase.range).toHaveBeenCalledWith(0, 9)
      expect(result).toEqual({
        data: [mockProduct],
        total: 1,
        page: 1,
        limit: 10
      })
    })

    it('should use default search parameters', async () => {
      const mockResponse = {
        data: [mockProduct],
        error: null,
        count: 1
      }

      mockSupabase.range.mockResolvedValue(mockResponse)

      const result = await productService.searchProducts({})

      expect(mockSupabase.range).toHaveBeenCalledWith(0, 19) // Default limit of 20
      expect(result.limit).toBe(20)
      expect(result.page).toBe(1)
    })

    it('should handle search errors', async () => {
      const mockError = new Error('Search failed')
      mockSupabase.range.mockResolvedValue({
        data: null,
        error: mockError,
        count: 0
      })

      await expect(productService.searchProducts({})).rejects.toThrow('Search failed')
    })

    it('should handle empty search results', async () => {
      const mockResponse = {
        data: null,
        error: null,
        count: 0
      }

      mockSupabase.range.mockResolvedValue(mockResponse)

      const result = await productService.searchProducts({})

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 20
      })
    })
  })

  describe('getProductsByCategory', () => {
    it('should return products by category', async () => {
      const mockResponse = {
        data: [mockProduct],
        error: null
      }

      mockSupabase.order.mockResolvedValue(mockResponse)

      const result = await productService.getProductsByCategory('cat1')

      expect(supabase.from).toHaveBeenCalledWith('products')
      expect(mockSupabase.select).toHaveBeenCalledWith('*, product_categories(*), product_pricing_tiers(*)')
      expect(mockSupabase.eq).toHaveBeenCalledWith('product_category_assignments.category_id', 'cat1')
      expect(mockSupabase.eq).toHaveBeenCalledWith('is_active', true)
      expect(mockSupabase.order).toHaveBeenCalledWith('name')
      expect(result).toEqual([mockProduct])
    })

    it('should handle category fetch errors', async () => {
      const mockError = new Error('Category fetch failed')
      mockSupabase.order.mockResolvedValue({
        data: null,
        error: mockError
      })

      await expect(productService.getProductsByCategory('cat1')).rejects.toThrow('Category fetch failed')
    })

    it('should handle empty category results', async () => {
      const mockResponse = {
        data: null,
        error: null
      }

      mockSupabase.order.mockResolvedValue(mockResponse)

      const result = await productService.getProductsByCategory('cat1')

      expect(result).toEqual([])
    })
  })

  describe('getProductCategories', () => {
    it('should return all active product categories', async () => {
      const mockResponse = {
        data: [mockProductCategory],
        error: null
      }

      mockSupabase.order.mockResolvedValue(mockResponse)

      const result = await productService.getProductCategories()

      expect(supabase.from).toHaveBeenCalledWith('product_categories')
      expect(mockSupabase.select).toHaveBeenCalledWith('*')
      expect(mockSupabase.eq).toHaveBeenCalledWith('is_active', true)
      expect(mockSupabase.order).toHaveBeenCalledWith('name')
      expect(result).toEqual([mockProductCategory])
    })

    it('should handle category fetch errors', async () => {
      const mockError = new Error('Categories fetch failed')
      mockSupabase.order.mockResolvedValue({
        data: null,
        error: mockError
      })

      await expect(productService.getProductCategories()).rejects.toThrow('Categories fetch failed')
    })

    it('should handle empty categories', async () => {
      const mockResponse = {
        data: null,
        error: null
      }

      mockSupabase.order.mockResolvedValue(mockResponse)

      const result = await productService.getProductCategories()

      expect(result).toEqual([])
    })
  })

  describe('error handling', () => {
    it('should log errors to console', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      const mockError = new Error('Database error')
      
      mockSupabase.range.mockResolvedValue({
        data: null,
        error: mockError,
        count: 0
      })

      await expect(productService.getAllProducts({})).rejects.toThrow('Database error')
      
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching products:', mockError)
      
      consoleSpy.mockRestore()
    })
  })
})