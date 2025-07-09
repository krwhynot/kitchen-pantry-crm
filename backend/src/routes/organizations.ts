import express from 'express'
import { asyncHandler } from '../middleware/errorHandler'
import { validateRequest } from '../middleware/validation'
import { authenticateToken, requireAnyRole } from '../middleware/auth'
import { OrganizationSchema } from '@shared/types'
import { OrganizationService } from '../services/OrganizationService'

const router = express.Router()
const organizationService = new OrganizationService()

// Apply authentication to all routes
router.use(authenticateToken)
router.use(requireAnyRole)

/**
 * @swagger
 * /organizations:
 *   get:
 *     summary: Get all organizations
 *     tags: [Organizations]
 *     parameters:
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
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Organizations retrieved successfully
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
 *                         $ref: '#/components/schemas/Organization'
 */
router.get('/', asyncHandler(async (req, res) => {
  const {
    query,
    type,
    priority,
    segment,
    city,
    state,
    isActive,
    page = 1,
    limit = 20
  } = req.query

  const offset = (Number(page) - 1) * Number(limit)

  const result = await organizationService.searchOrganizations({
    query: query as string,
    type: type as string,
    priority: priority as string,
    segment: segment as string,
    city: city as string,
    state: state as string,
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
    message: 'Organizations retrieved successfully'
  })
}))

/**
 * @swagger
 * /organizations/{id}:
 *   get:
 *     summary: Get organization by ID
 *     tags: [Organizations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: Organization retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Organization'
 *       404:
 *         description: Organization not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params
  const organization = await organizationService.getOrganizationById(id)
  
  if (!organization) {
    return res.status(404).json({
      status: 'error',
      message: 'Organization not found'
    })
  }

  res.json({
    status: 'success',
    data: organization,
    message: 'Organization retrieved successfully'
  })
}))

/**
 * @swagger
 * /organizations:
 *   post:
 *     summary: Create new organization
 *     tags: [Organizations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [restaurant, food_service, distributor, manufacturer]
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               website:
 *                 type: string
 *                 format: uri
 *               parentId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Organization created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Organization'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', 
  validateRequest({ body: OrganizationSchema.omit({ id: true, createdAt: true, updatedAt: true }) }),
  asyncHandler(async (req, res) => {
    const userId = req.user?.id || 'system'
    const organization = await organizationService.createOrganization(req.body, userId)
    
    res.status(201).json({
      status: 'success',
      data: organization,
      message: 'Organization created successfully'
    })
  })
)

/**
 * @swagger
 * /organizations/{id}:
 *   put:
 *     summary: Update organization
 *     tags: [Organizations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [restaurant, food_service, distributor, manufacturer]
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               website:
 *                 type: string
 *                 format: uri
 *               parentId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Organization updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Organization'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Organization not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/:id',
  validateRequest({ body: OrganizationSchema.omit({ id: true, createdAt: true, updatedAt: true }) }),
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const userId = req.user?.id || 'system'
    const organization = await organizationService.updateOrganization(id, req.body, userId)
    
    res.json({
      status: 'success',
      data: organization,
      message: 'Organization updated successfully'
    })
  })
)

/**
 * @swagger
 * /organizations/{id}:
 *   delete:
 *     summary: Delete organization
 *     tags: [Organizations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: Organization deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Organization not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.user?.id || 'system'
  await organizationService.deleteOrganization(id, userId)
  
  res.json({
    status: 'success',
    message: 'Organization deleted successfully'
  })
}))

// Get organization hierarchy
router.get('/:id/hierarchy', asyncHandler(async (req, res) => {
  const { id } = req.params
  const hierarchy = await organizationService.getOrganizationHierarchy(id)
  
  res.json({
    status: 'success',
    data: hierarchy,
    message: 'Organization hierarchy retrieved successfully'
  })
}))

// Get organization analytics
router.get('/analytics/overview', asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query
  const dateRange = startDate && endDate ? {
    start: new Date(startDate as string),
    end: new Date(endDate as string)
  } : undefined
  
  const analytics = await organizationService.getOrganizationAnalytics(dateRange)
  
  res.json({
    status: 'success',
    data: analytics,
    message: 'Organization analytics retrieved successfully'
  })
}))

// Get organization performance metrics
router.get('/:id/metrics', asyncHandler(async (req, res) => {
  const { id } = req.params
  const metrics = await organizationService.getOrganizationPerformanceMetrics(id)
  
  res.json({
    status: 'success',
    data: metrics,
    message: 'Organization performance metrics retrieved successfully'
  })
}))

// Get organization activity feed
router.get('/:id/activity', asyncHandler(async (req, res) => {
  const { id } = req.params
  const { limit = 50 } = req.query
  const activities = await organizationService.getOrganizationActivityFeed(id, Number(limit))
  
  res.json({
    status: 'success',
    data: activities,
    message: 'Organization activity feed retrieved successfully'
  })
}))

// Merge organizations
router.post('/:targetId/merge/:sourceId', asyncHandler(async (req, res) => {
  const { targetId, sourceId } = req.params
  const userId = req.user?.id || 'system'
  const merged = await organizationService.mergeOrganizations(targetId, sourceId, userId)
  
  res.json({
    status: 'success',
    data: merged,
    message: 'Organizations merged successfully'
  })
}))

// Bulk update priority
router.patch('/bulk/priority', asyncHandler(async (req, res) => {
  const { organizationIds, priority } = req.body
  const userId = req.user?.id || 'system'
  const updated = await organizationService.bulkUpdatePriority(organizationIds, priority, userId)
  
  res.json({
    status: 'success',
    data: updated,
    message: 'Organization priorities updated successfully'
  })
}))

// Bulk update segment
router.patch('/bulk/segment', asyncHandler(async (req, res) => {
  const { organizationIds, segment } = req.body
  const userId = req.user?.id || 'system'
  const updated = await organizationService.bulkUpdateSegment(organizationIds, segment, userId)
  
  res.json({
    status: 'success',
    data: updated,
    message: 'Organization segments updated successfully'
  })
}))

// Get organizations needing update
router.get('/maintenance/needs-update', asyncHandler(async (req, res) => {
  const organizations = await organizationService.getOrganizationsNeedingUpdate()
  
  res.json({
    status: 'success',
    data: organizations,
    message: 'Organizations needing update retrieved successfully'
  })
}))

export { router as organizationRoutes }