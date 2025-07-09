import express from 'express'
import { asyncHandler } from '../middleware/errorHandler'
import { validateRequest } from '../middleware/validation'
import { authenticateToken, requireAnyRole } from '../middleware/auth'
import { OpportunitySchema } from '@shared/types'
import { OpportunityService } from '../services/OpportunityService'

const router = express.Router()
const opportunityService = new OpportunityService()

// Apply authentication to all routes
router.use(authenticateToken)
router.use(requireAnyRole)

// Get all opportunities with search and filtering
router.get('/', asyncHandler(async (req, res) => {
  const {
    query,
    stage,
    contactId,
    organizationId,
    userId,
    minValue,
    maxValue,
    startDate,
    endDate,
    priority,
    isActive,
    page = 1,
    limit = 20
  } = req.query

  const offset = (Number(page) - 1) * Number(limit)

  const result = await opportunityService.searchOpportunities({
    query: query as string,
    stage: stage as string,
    contactId: contactId as string,
    organizationId: organizationId as string,
    userId: userId as string,
    minValue: minValue ? Number(minValue) : undefined,
    maxValue: maxValue ? Number(maxValue) : undefined,
    startDate: startDate as string,
    endDate: endDate as string,
    priority: priority as string,
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
    message: 'Opportunities retrieved successfully'
  })
}))

// Get opportunity by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params
  const opportunity = await opportunityService.getOpportunityById(id)
  
  if (!opportunity) {
    return res.status(404).json({
      status: 'error',
      message: 'Opportunity not found'
    })
  }

  res.json({
    status: 'success',
    data: opportunity,
    message: 'Opportunity retrieved successfully'
  })
}))

// Create new opportunity
router.post('/', 
  validateRequest({ body: OpportunitySchema.omit({ id: true, createdAt: true, updatedAt: true }) }),
  asyncHandler(async (req, res) => {
    const userId = req.user?.id || 'system'
    const opportunity = await opportunityService.createOpportunity(req.body, userId)
    
    res.status(201).json({
      status: 'success',
      data: opportunity,
      message: 'Opportunity created successfully'
    })
  })
)

// Update opportunity
router.put('/:id',
  validateRequest({ body: OpportunitySchema.omit({ id: true, createdAt: true, updatedAt: true }) }),
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const userId = req.user?.id || 'system'
    const opportunity = await opportunityService.updateOpportunity(id, req.body, userId)
    
    res.json({
      status: 'success',
      data: opportunity,
      message: 'Opportunity updated successfully'
    })
  })
)

// Delete opportunity
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.user?.id || 'system'
  await opportunityService.deleteOpportunity(id, userId)
  
  res.json({
    status: 'success',
    message: 'Opportunity deleted successfully'
  })
}))

// Get opportunities by stage
router.get('/stage/:stage', asyncHandler(async (req, res) => {
  const { stage } = req.params
  const opportunities = await opportunityService.getOpportunitiesByStage(stage)
  
  res.json({
    status: 'success',
    data: opportunities,
    message: 'Opportunities retrieved successfully'
  })
}))

// Get opportunities by user
router.get('/user/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params
  const opportunities = await opportunityService.getOpportunitiesByUser(userId)
  
  res.json({
    status: 'success',
    data: opportunities,
    message: 'Opportunities retrieved successfully'
  })
}))

// Get opportunities closing this month
router.get('/closing/this-month', asyncHandler(async (req, res) => {
  const { userId } = req.query
  const currentUserId = req.user?.id
  
  const opportunities = await opportunityService.getOpportunitiesClosingThisMonth(
    userId as string || currentUserId
  )
  
  res.json({
    status: 'success',
    data: opportunities,
    message: 'Opportunities closing this month retrieved successfully'
  })
}))

// Transition opportunity stage
router.post('/:id/transition', asyncHandler(async (req, res) => {
  const { id } = req.params
  const { stage, reason } = req.body
  const userId = req.user?.id || 'system'
  
  const opportunity = await opportunityService.transitionStage(id, stage, userId, reason)
  
  res.json({
    status: 'success',
    data: opportunity,
    message: 'Opportunity stage transitioned successfully'
  })
}))

// Get opportunity analytics
router.get('/analytics/overview', asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query
  const dateRange = startDate && endDate ? {
    start: new Date(startDate as string),
    end: new Date(endDate as string)
  } : undefined
  
  const analytics = await opportunityService.getOpportunityAnalytics(dateRange)
  
  res.json({
    status: 'success',
    data: analytics,
    message: 'Opportunity analytics retrieved successfully'
  })
}))

// Get opportunity forecast
router.get('/forecast/:period', asyncHandler(async (req, res) => {
  const { period } = req.params
  const forecast = await opportunityService.getOpportunityForecast(period as 'month' | 'quarter' | 'year')
  
  res.json({
    status: 'success',
    data: forecast,
    message: 'Opportunity forecast retrieved successfully'
  })
}))

// Get opportunity insights
router.get('/insights/dashboard', asyncHandler(async (req, res) => {
  const insights = await opportunityService.getOpportunityInsights()
  
  res.json({
    status: 'success',
    data: insights,
    message: 'Opportunity insights retrieved successfully'
  })
}))

// Bulk update opportunities
router.patch('/bulk/update', asyncHandler(async (req, res) => {
  const { opportunityIds, updates } = req.body
  const userId = req.user?.id || 'system'
  const updatedOpportunities = await opportunityService.bulkUpdateOpportunities(opportunityIds, updates, userId)
  
  res.json({
    status: 'success',
    data: updatedOpportunities,
    message: 'Opportunities updated successfully'
  })
}))

// Clone opportunity
router.post('/:id/clone', asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.user?.id || 'system'
  const cloned = await opportunityService.cloneOpportunity(id, req.body, userId)
  
  res.json({
    status: 'success',
    data: cloned,
    message: 'Opportunity cloned successfully'
  })
}))

export { router as opportunityRoutes }