import express from 'express'
import { asyncHandler } from '../middleware/errorHandler'
import { validateRequest } from '../middleware/validation'
import { authenticateToken, requireAnyRole } from '../middleware/auth'
import { InteractionSchema } from '@shared/types'
import { InteractionService } from '../services/InteractionService'

const router = express.Router()
const interactionService = new InteractionService()

// Apply authentication to all routes
router.use(authenticateToken)
router.use(requireAnyRole)

// Get all interactions with search and filtering
router.get('/', asyncHandler(async (req, res) => {
  const {
    query,
    type,
    contactId,
    organizationId,
    userId,
    startDate,
    endDate,
    outcome,
    isCompleted,
    page = 1,
    limit = 20
  } = req.query

  const offset = (Number(page) - 1) * Number(limit)

  const result = await interactionService.searchInteractions({
    query: query as string,
    type: type as string,
    contactId: contactId as string,
    organizationId: organizationId as string,
    userId: userId as string,
    startDate: startDate as string,
    endDate: endDate as string,
    outcome: outcome as string,
    isCompleted: isCompleted === 'true',
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
    message: 'Interactions retrieved successfully'
  })
}))

// Get interaction by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params
  const interaction = await interactionService.getInteractionById(id)
  
  if (!interaction) {
    return res.status(404).json({
      status: 'error',
      message: 'Interaction not found'
    })
  }

  res.json({
    status: 'success',
    data: interaction,
    message: 'Interaction retrieved successfully'
  })
}))

// Create new interaction
router.post('/', 
  validateRequest({ body: InteractionSchema.omit({ id: true, createdAt: true, updatedAt: true }) }),
  asyncHandler(async (req, res) => {
    const userId = req.user?.id || 'system'
    const interaction = await interactionService.createInteraction(req.body, userId)
    
    res.status(201).json({
      status: 'success',
      data: interaction,
      message: 'Interaction created successfully'
    })
  })
)

// Update interaction
router.put('/:id',
  validateRequest({ body: InteractionSchema.omit({ id: true, createdAt: true, updatedAt: true }) }),
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const userId = req.user?.id || 'system'
    const interaction = await interactionService.updateInteraction(id, req.body, userId)
    
    res.json({
      status: 'success',
      data: interaction,
      message: 'Interaction updated successfully'
    })
  })
)

// Delete interaction
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.user?.id || 'system'
  await interactionService.deleteInteraction(id, userId)
  
  res.json({
    status: 'success',
    message: 'Interaction deleted successfully'
  })
}))

// Get interactions by contact
router.get('/contact/:contactId', asyncHandler(async (req, res) => {
  const { contactId } = req.params
  const { limit = 50, offset = 0, includeCompleted = true } = req.query
  
  const result = await interactionService.getInteractionsByContact(contactId, {
    limit: Number(limit),
    offset: Number(offset),
    includeCompleted: includeCompleted === 'true'
  })
  
  res.json({
    status: 'success',
    data: result.data,
    total: result.total,
    message: 'Interactions retrieved successfully'
  })
}))

// Get interactions by organization
router.get('/organization/:organizationId', asyncHandler(async (req, res) => {
  const { organizationId } = req.params
  const { limit = 50, offset = 0, includeCompleted = true } = req.query
  
  const result = await interactionService.getInteractionsByOrganization(organizationId, {
    limit: Number(limit),
    offset: Number(offset),
    includeCompleted: includeCompleted === 'true'
  })
  
  res.json({
    status: 'success',
    data: result.data,
    total: result.total,
    message: 'Interactions retrieved successfully'
  })
}))

// Get scheduled interactions
router.get('/scheduled/list', asyncHandler(async (req, res) => {
  const { userId } = req.query
  const currentUserId = req.user?.id
  
  const interactions = await interactionService.getScheduledInteractions(
    userId as string || currentUserId
  )
  
  res.json({
    status: 'success',
    data: interactions,
    message: 'Scheduled interactions retrieved successfully'
  })
}))

// Complete interaction
router.post('/:id/complete', asyncHandler(async (req, res) => {
  const { id } = req.params
  const { outcome, nextSteps } = req.body
  const userId = req.user?.id || 'system'
  
  const interaction = await interactionService.completeInteraction(id, outcome, nextSteps, userId)
  
  res.json({
    status: 'success',
    data: interaction,
    message: 'Interaction completed successfully'
  })
}))

// Cancel interaction
router.post('/:id/cancel', asyncHandler(async (req, res) => {
  const { id } = req.params
  const { reason } = req.body
  const userId = req.user?.id || 'system'
  
  const interaction = await interactionService.cancelInteraction(id, reason, userId)
  
  res.json({
    status: 'success',
    data: interaction,
    message: 'Interaction cancelled successfully'
  })
}))

// Reschedule interaction
router.post('/:id/reschedule', asyncHandler(async (req, res) => {
  const { id } = req.params
  const { scheduledAt } = req.body
  const userId = req.user?.id || 'system'
  
  const interaction = await interactionService.rescheduleInteraction(id, scheduledAt, userId)
  
  res.json({
    status: 'success',
    data: interaction,
    message: 'Interaction rescheduled successfully'
  })
}))

// Get interaction analytics
router.get('/analytics/overview', asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query
  const dateRange = startDate && endDate ? {
    start: new Date(startDate as string),
    end: new Date(endDate as string)
  } : undefined
  
  const analytics = await interactionService.getInteractionAnalytics(dateRange)
  
  res.json({
    status: 'success',
    data: analytics,
    message: 'Interaction analytics retrieved successfully'
  })
}))

// Get interaction insights
router.get('/insights/dashboard', asyncHandler(async (req, res) => {
  const userId = req.user?.id
  const insights = await interactionService.getInteractionInsights(userId)
  
  res.json({
    status: 'success',
    data: insights,
    message: 'Interaction insights retrieved successfully'
  })
}))

// Get interaction templates
router.get('/templates/list', asyncHandler(async (req, res) => {
  const userId = req.user?.id
  const templates = await interactionService.getInteractionTemplates(userId)
  
  res.json({
    status: 'success',
    data: templates,
    message: 'Interaction templates retrieved successfully'
  })
}))

// Create interaction template
router.post('/templates', asyncHandler(async (req, res) => {
  const userId = req.user?.id || 'system'
  const template = await interactionService.createInteractionTemplate(req.body, userId)
  
  res.status(201).json({
    status: 'success',
    data: template,
    message: 'Interaction template created successfully'
  })
}))

// Bulk update interactions
router.patch('/bulk/update', asyncHandler(async (req, res) => {
  const { interactionIds, updates } = req.body
  const userId = req.user?.id || 'system'
  const updatedInteractions = await interactionService.bulkUpdateInteractions(interactionIds, updates, userId)
  
  res.json({
    status: 'success',
    data: updatedInteractions,
    message: 'Interactions updated successfully'
  })
}))

// Get interaction chain
router.get('/:id/chain', asyncHandler(async (req, res) => {
  const { id } = req.params
  const chain = await interactionService.getInteractionChain(id)
  
  res.json({
    status: 'success',
    data: chain,
    message: 'Interaction chain retrieved successfully'
  })
}))

export { router as interactionRoutes }