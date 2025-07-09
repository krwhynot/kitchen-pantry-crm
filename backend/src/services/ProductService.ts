import { BaseService } from './BaseService'
import { Product } from '@shared/types'
import { supabase } from '../config/database'

export class ProductService extends BaseService {
  constructor() {
    super()
  }

  async getAllProducts(options: {
    query?: string
    category?: string
    isActive?: boolean
    limit?: number
    offset?: number
  }): Promise<{
    data: Product[]
    total: number
    page: number
    limit: number
  }> {
    try {
      let query = supabase
        .from('products')
        .select('*, product_categories!inner(*)', { count: 'exact' })

      if (options.query) {
        query = query.or(`name.ilike.%${options.query}%,description.ilike.%${options.query}%,sku.ilike.%${options.query}%`)
      }

      if (options.category) {
        query = query.eq('product_categories.name', options.category)
      }

      if (options.isActive !== undefined) {
        query = query.eq('is_active', options.isActive)
      }

      const limit = options.limit || 20
      const offset = options.offset || 0

      const { data, error, count } = await query
        .order('name')
        .range(offset, offset + limit - 1)

      if (error) {
        throw error
      }

      return {
        data: data || [],
        total: count || 0,
        page: Math.floor(offset / limit) + 1,
        limit
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      throw error
    }
  }

  async getProductById(id: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_categories(*),
          product_pricing_tiers(*),
          product_inventory(*),
          product_media(*),
          product_variants(*),
          product_suppliers(*)
        `)
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw error
      }

      return data
    } catch (error) {
      console.error('Error fetching product:', error)
      throw error
    }
  }

  async createProduct(productData: Partial<Product>, userId: string): Promise<Product> {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          ...productData,
          created_by: userId
        }])
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Error creating product:', error)
      throw error
    }
  }

  async updateProduct(id: string, productData: Partial<Product>, userId: string): Promise<Product> {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          ...productData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Error updating product:', error)
      throw error
    }
  }

  async deleteProduct(id: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          is_active: false,
          deleted_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      throw error
    }
  }

  async searchProducts(searchParams: {
    query?: string
    category?: string
    minPrice?: number
    maxPrice?: number
    isActive?: boolean
    limit?: number
    offset?: number
  }): Promise<{
    data: Product[]
    total: number
    page: number
    limit: number
  }> {
    try {
      let query = supabase
        .from('products')
        .select('*, product_categories(*), product_pricing_tiers(*)', { count: 'exact' })

      if (searchParams.query) {
        query = query.or(`name.ilike.%${searchParams.query}%,description.ilike.%${searchParams.query}%,sku.ilike.%${searchParams.query}%`)
      }

      if (searchParams.category) {
        query = query.eq('product_categories.name', searchParams.category)
      }

      if (searchParams.minPrice !== undefined) {
        query = query.gte('product_pricing_tiers.base_price', searchParams.minPrice)
      }

      if (searchParams.maxPrice !== undefined) {
        query = query.lte('product_pricing_tiers.base_price', searchParams.maxPrice)
      }

      if (searchParams.isActive !== undefined) {
        query = query.eq('is_active', searchParams.isActive)
      }

      const limit = searchParams.limit || 20
      const offset = searchParams.offset || 0

      const { data, error, count } = await query
        .order('name')
        .range(offset, offset + limit - 1)

      if (error) {
        throw error
      }

      return {
        data: data || [],
        total: count || 0,
        page: Math.floor(offset / limit) + 1,
        limit
      }
    } catch (error) {
      console.error('Error searching products:', error)
      throw error
    }
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_categories(*), product_pricing_tiers(*)')
        .eq('product_category_assignments.category_id', categoryId)
        .eq('is_active', true)
        .order('name')

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error fetching products by category:', error)
      throw error
    }
  }

  async getProductCategories(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error fetching product categories:', error)
      throw error
    }
  }

  async getProductAnalytics(dateRange?: { start: Date; end: Date }): Promise<any> {
    try {
      let query = supabase
        .from('product_performance_metrics')
        .select('*')

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start.toISOString())
          .lte('created_at', dateRange.end.toISOString())
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error fetching product analytics:', error)
      throw error
    }
  }

  async getProductInventory(productId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('product_inventory')
        .select('*')
        .eq('product_id', productId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw error
      }

      return data
    } catch (error) {
      console.error('Error fetching product inventory:', error)
      throw error
    }
  }

  async updateProductInventory(productId: string, inventoryData: any, userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('product_inventory')
        .upsert({
          product_id: productId,
          ...inventoryData,
          updated_by: userId,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Error updating product inventory:', error)
      throw error
    }
  }

  async getProductPricing(productId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('product_pricing_tiers')
        .select('*')
        .eq('product_id', productId)
        .eq('is_active', true)
        .order('tier_name')

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error fetching product pricing:', error)
      throw error
    }
  }

  async updateProductPricing(productId: string, pricingData: any, userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('product_pricing_tiers')
        .upsert({
          product_id: productId,
          ...pricingData,
          updated_by: userId,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Error updating product pricing:', error)
      throw error
    }
  }

  async getProductMedia(productId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('product_media')
        .select('*')
        .eq('product_id', productId)
        .eq('is_active', true)
        .order('display_order')

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error fetching product media:', error)
      throw error
    }
  }

  async addProductMedia(productId: string, mediaData: any, userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('product_media')
        .insert({
          product_id: productId,
          ...mediaData,
          created_by: userId
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Error adding product media:', error)
      throw error
    }
  }

  async bulkUpdateProducts(productIds: string[], updates: Partial<Product>, userId: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .in('id', productIds)
        .select()

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error bulk updating products:', error)
      throw error
    }
  }

  async getProductRecommendations(productId: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('product_recommendations')
        .select('recommended_product:products(*)')
        .eq('product_id', productId)
        .eq('is_active', true)
        .order('recommendation_score', { ascending: false })

      if (error) {
        throw error
      }

      return data?.map(item => item.recommended_product) || []
    } catch (error) {
      console.error('Error fetching product recommendations:', error)
      throw error
    }
  }

  async getProductsBySupplier(supplierId: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_suppliers!inner(*)')
        .eq('product_suppliers.supplier_id', supplierId)
        .eq('is_active', true)
        .order('name')

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error fetching products by supplier:', error)
      throw error
    }
  }

  async getProductPerformanceMetrics(productId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('product_performance_metrics')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw error
      }

      return data
    } catch (error) {
      console.error('Error fetching product performance metrics:', error)
      throw error
    }
  }
}