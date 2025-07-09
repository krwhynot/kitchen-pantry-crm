import express from 'express'
import { asyncHandler } from '../middleware/errorHandler'
import { validateRequest } from '../middleware/validation'
import { authenticateToken, requireAnyRole } from '../middleware/auth'
import { ProductSchema } from '@shared/types'
import { ProductService } from '../services/ProductService'

const router = express.Router()
const productService = new ProductService()

// Apply authentication to all routes
router.use(authenticateToken)
router.use(requireAnyRole)

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search query for product name, description, or SKU
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by product category
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 */
router.get('/', asyncHandler(async (req, res) => {
  const {
    query,
    category,
    isActive,
    page = 1,
    limit = 20
  } = req.query

  const offset = (Number(page) - 1) * Number(limit)

  const result = await productService.getAllProducts({
    query: query as string,
    category: category as string,
    isActive: isActive === 'true',
    limit: Number(limit),
    offset
  })

  res.json({
    status: 'success',
    data: result.data,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit)
    },
    message: 'Products retrieved successfully'
  })
}))

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params
  const product = await productService.getProductById(id)
  
  if (!product) {
    return res.status(404).json({
      status: 'error',
      message: 'Product not found'
    })
  }

  res.json({
    status: 'success',
    data: product,
    message: 'Product retrieved successfully'
  })
}))

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create new product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - sku
 *               - category_id
 *             properties:
 *               name:
 *                 type: string
 *               sku:
 *                 type: string
 *               description:
 *                 type: string
 *               category_id:
 *                 type: string
 *                 format: uuid
 *               unit_of_measure:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', 
  validateRequest({ body: ProductSchema.omit({ id: true, createdAt: true, updatedAt: true }) }),
  asyncHandler(async (req, res) => {
    const userId = req.user?.id || 'system'
    const product = await productService.createProduct(req.body, userId)
    
    res.status(201).json({
      status: 'success',
      data: product,
      message: 'Product created successfully'
    })
  })
)

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - sku
 *               - category_id
 *             properties:
 *               name:
 *                 type: string
 *               sku:
 *                 type: string
 *               description:
 *                 type: string
 *               category_id:
 *                 type: string
 *                 format: uuid
 *               unit_of_measure:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Product not found
 */
router.put('/:id',
  validateRequest({ body: ProductSchema.omit({ id: true, createdAt: true, updatedAt: true }) }),
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const userId = req.user?.id || 'system'
    const product = await productService.updateProduct(id, req.body, userId)
    
    res.json({
      status: 'success',
      data: product,
      message: 'Product updated successfully'
    })
  })
)

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete product (soft delete)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.user?.id || 'system'
  await productService.deleteProduct(id, userId)
  
  res.json({
    status: 'success',
    message: 'Product deleted successfully'
  })
}))

// Advanced product search with filters
router.get('/search/advanced', asyncHandler(async (req, res) => {
  const {
    query,
    category,
    minPrice,
    maxPrice,
    isActive,
    page = 1,
    limit = 20
  } = req.query

  const offset = (Number(page) - 1) * Number(limit)

  const result = await productService.searchProducts({
    query: query as string,
    category: category as string,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    isActive: isActive === 'true',
    limit: Number(limit),
    offset
  })

  res.json({
    status: 'success',
    data: result.data,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit)
    },
    message: 'Product search completed successfully'
  })
}))

// Get products by category
router.get('/category/:categoryId', asyncHandler(async (req, res) => {
  const { categoryId } = req.params
  const products = await productService.getProductsByCategory(categoryId)
  
  res.json({
    status: 'success',
    data: products,
    message: 'Products by category retrieved successfully'
  })
}))

// Get product categories
router.get('/categories/list', asyncHandler(async (req, res) => {
  const categories = await productService.getProductCategories()
  
  res.json({
    status: 'success',
    data: categories,
    message: 'Product categories retrieved successfully'
  })
}))

// Get product analytics
router.get('/analytics/overview', asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query
  const dateRange = startDate && endDate ? {
    start: new Date(startDate as string),
    end: new Date(endDate as string)
  } : undefined
  
  const analytics = await productService.getProductAnalytics(dateRange)
  
  res.json({
    status: 'success',
    data: analytics,
    message: 'Product analytics retrieved successfully'
  })
}))

// Get product inventory
router.get('/:id/inventory', asyncHandler(async (req, res) => {
  const { id } = req.params
  const inventory = await productService.getProductInventory(id)
  
  res.json({
    status: 'success',
    data: inventory,
    message: 'Product inventory retrieved successfully'
  })
}))

// Update product inventory
router.put('/:id/inventory', asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.user?.id || 'system'
  const inventory = await productService.updateProductInventory(id, req.body, userId)
  
  res.json({
    status: 'success',
    data: inventory,
    message: 'Product inventory updated successfully'
  })
}))

// Get product pricing
router.get('/:id/pricing', asyncHandler(async (req, res) => {
  const { id } = req.params
  const pricing = await productService.getProductPricing(id)
  
  res.json({
    status: 'success',
    data: pricing,
    message: 'Product pricing retrieved successfully'
  })
}))

// Update product pricing
router.put('/:id/pricing', asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.user?.id || 'system'
  const pricing = await productService.updateProductPricing(id, req.body, userId)
  
  res.json({
    status: 'success',
    data: pricing,
    message: 'Product pricing updated successfully'
  })
}))

// Get product media
router.get('/:id/media', asyncHandler(async (req, res) => {
  const { id } = req.params
  const media = await productService.getProductMedia(id)
  
  res.json({
    status: 'success',
    data: media,
    message: 'Product media retrieved successfully'
  })
}))

// Add product media
router.post('/:id/media', asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.user?.id || 'system'
  const media = await productService.addProductMedia(id, req.body, userId)
  
  res.json({
    status: 'success',
    data: media,
    message: 'Product media added successfully'
  })
}))

// Get product recommendations
router.get('/:id/recommendations', asyncHandler(async (req, res) => {
  const { id } = req.params
  const recommendations = await productService.getProductRecommendations(id)
  
  res.json({
    status: 'success',
    data: recommendations,
    message: 'Product recommendations retrieved successfully'
  })
}))

// Get products by supplier
router.get('/supplier/:supplierId', asyncHandler(async (req, res) => {
  const { supplierId } = req.params
  const products = await productService.getProductsBySupplier(supplierId)
  
  res.json({
    status: 'success',
    data: products,
    message: 'Products by supplier retrieved successfully'
  })
}))

// Get product performance metrics
router.get('/:id/metrics', asyncHandler(async (req, res) => {
  const { id } = req.params
  const metrics = await productService.getProductPerformanceMetrics(id)
  
  res.json({
    status: 'success',
    data: metrics,
    message: 'Product performance metrics retrieved successfully'
  })
}))

// Bulk update products
router.patch('/bulk/update', asyncHandler(async (req, res) => {
  const { productIds, updates } = req.body
  const userId = req.user?.id || 'system'
  const updatedProducts = await productService.bulkUpdateProducts(productIds, updates, userId)
  
  res.json({
    status: 'success',
    data: updatedProducts,
    message: 'Products updated successfully'
  })
}))

export { router as productRoutes }