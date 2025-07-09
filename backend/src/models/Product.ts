import { BaseModel } from './BaseModel'
import { Product } from '@shared/types'

export class ProductModel extends BaseModel {
  protected static tableName = 'products'

  static async findAll(options: {
    select?: string
    filters?: Record<string, any>
    orderBy?: { column: string; ascending?: boolean }
    limit?: number
    offset?: number
  } = {}): Promise<Product[]> {
    return super.findAll<Product>(this.tableName, options)
  }

  static async findById(id: string): Promise<Product | null> {
    return super.findById<Product>(this.tableName, id)
  }

  static async create(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    return super.create<Product>(this.tableName, data)
  }

  static async update(id: string, data: Partial<Product>): Promise<Product> {
    return super.update<Product>(this.tableName, id, data)
  }

  static async delete(id: string): Promise<void> {
    return super.delete(this.tableName, id)
  }

  static async findActive(): Promise<Product[]> {
    return this.findAll({ 
      filters: { is_active: true },
      orderBy: { column: 'name', ascending: true }
    })
  }

  static async findByCategory(category: string): Promise<Product[]> {
    return this.findAll({ 
      filters: { category },
      orderBy: { column: 'name', ascending: true }
    })
  }

  static async findBySku(sku: string): Promise<Product | null> {
    const products = await this.findAll({ filters: { sku } })
    return products[0] || null
  }

  static async searchByName(name: string): Promise<Product[]> {
    return this.findAll({
      filters: { name: `%${name}%` },
      orderBy: { column: 'name', ascending: true }
    })
  }

  static async findByPriceRange(minPrice: number, maxPrice: number): Promise<Product[]> {
    return this.findAll({
      filters: { 
        unit_price: { gte: minPrice, lte: maxPrice }
      },
      orderBy: { column: 'unit_price', ascending: true }
    })
  }

  static async getCategories(): Promise<string[]> {
    // This would need to be implemented with a proper distinct query
    const products = await this.findAll({ select: 'category' })
    const categories = [...new Set(products.map(p => p.category))]
    return categories.sort()
  }

  static async count(filters?: Record<string, any>): Promise<number> {
    return super.count(this.tableName, filters)
  }
}