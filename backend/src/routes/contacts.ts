import express from 'express'
import { asyncHandler } from '../middleware/errorHandler'
import { validateRequest } from '../middleware/validation'
import { authenticateToken, requireAnyRole } from '../middleware/auth'
import { ContactSchema } from '@shared/types'
import { ContactService } from '../services/ContactService'

const router = express.Router()
const contactService = new ContactService()

// Apply authentication to all routes
router.use(authenticateToken)
router.use(requireAnyRole)

// Get all contacts with search and filtering
router.get('/', asyncHandler(async (req, res) => {
  const {
    query,
    organizationId,
    role,
    isDecisionMaker,
    isActive,
    page = 1,
    limit = 20
  } = req.query

  const offset = (Number(page) - 1) * Number(limit)

  const result = await contactService.searchContacts({
    query: query as string,
    organizationId: organizationId as string,
    role: role as string,
    isDecisionMaker: isDecisionMaker === 'true',
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
    message: 'Contacts retrieved successfully'
  })
}))

// Get contact by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params
  const contact = await contactService.getContactById(id)
  
  if (!contact) {
    return res.status(404).json({
      status: 'error',
      message: 'Contact not found'
    })
  }

  res.json({
    status: 'success',
    data: contact,
    message: 'Contact retrieved successfully'
  })
}))

// Create new contact
router.post('/', 
  validateRequest({ body: ContactSchema.omit({ id: true, createdAt: true, updatedAt: true }) }),
  asyncHandler(async (req, res) => {
    const userId = req.user?.id || 'system'
    const contact = await contactService.createContact(req.body, userId)
    
    res.status(201).json({
      status: 'success',
      data: contact,
      message: 'Contact created successfully'
    })
  })
)

// Update contact
router.put('/:id',
  validateRequest({ body: ContactSchema.omit({ id: true, createdAt: true, updatedAt: true }) }),
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const userId = req.user?.id || 'system'
    const contact = await contactService.updateContact(id, req.body, userId)
    
    res.json({
      status: 'success',
      data: contact,
      message: 'Contact updated successfully'
    })
  })
)

// Delete contact
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.user?.id || 'system'
  await contactService.deleteContact(id, userId)
  
  res.json({
    status: 'success',
    message: 'Contact deleted successfully'
  })
}))

// Get contacts by organization
router.get('/organization/:organizationId', asyncHandler(async (req, res) => {
  const { organizationId } = req.params
  const { includeInactive, limit = 100, offset = 0 } = req.query
  
  const result = await contactService.getContactsByOrganization(organizationId, {
    includeInactive: includeInactive === 'true',
    limit: Number(limit),
    offset: Number(offset)
  })
  
  res.json({
    status: 'success',
    data: result.data,
    total: result.total,
    message: 'Contacts retrieved successfully'
  })
}))

// Get decision makers
router.get('/decision-makers/list', asyncHandler(async (req, res) => {
  const { organizationId } = req.query
  const decisionMakers = await contactService.getDecisionMakers(organizationId as string)
  
  res.json({
    status: 'success',
    data: decisionMakers,
    message: 'Decision makers retrieved successfully'
  })
}))

// Get contact relationships
router.get('/:id/relationships', asyncHandler(async (req, res) => {
  const { id } = req.params
  const relationships = await contactService.getContactRelationships(id)
  
  res.json({
    status: 'success',
    data: relationships,
    message: 'Contact relationships retrieved successfully'
  })
}))

// Create contact relationship
router.post('/:id/relationships', asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.user?.id || 'system'
  
  const relationship = {
    contactId: id,
    ...req.body
  }
  
  await contactService.createContactRelationship(relationship, userId)
  
  res.json({
    status: 'success',
    message: 'Contact relationship created successfully'
  })
}))

// Get contact communication history
router.get('/:id/communications', asyncHandler(async (req, res) => {
  const { id } = req.params
  const { limit = 50 } = req.query
  const history = await contactService.getContactCommunicationHistory(id, Number(limit))
  
  res.json({
    status: 'success',
    data: history,
    message: 'Contact communication history retrieved successfully'
  })
}))

// Get contact engagement metrics
router.get('/:id/metrics', asyncHandler(async (req, res) => {
  const { id } = req.params
  const metrics = await contactService.getContactEngagementMetrics(id)
  
  res.json({
    status: 'success',
    data: metrics,
    message: 'Contact engagement metrics retrieved successfully'
  })
}))

// Get contact analytics
router.get('/analytics/overview', asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query
  const dateRange = startDate && endDate ? {
    start: new Date(startDate as string),
    end: new Date(endDate as string)
  } : undefined
  
  const analytics = await contactService.getContactAnalytics(dateRange)
  
  res.json({
    status: 'success',
    data: analytics,
    message: 'Contact analytics retrieved successfully'
  })
}))

// Bulk update contacts
router.patch('/bulk/update', asyncHandler(async (req, res) => {
  const { contactIds, updates } = req.body
  const userId = req.user?.id || 'system'
  const updatedContacts = await contactService.bulkUpdateContacts(contactIds, updates, userId)
  
  res.json({
    status: 'success',
    data: updatedContacts,
    message: 'Contacts updated successfully'
  })
}))

// Import contacts
router.post('/import', asyncHandler(async (req, res) => {
  const { contacts } = req.body
  const userId = req.user?.id || 'system'
  const result = await contactService.importContacts(contacts, userId)
  
  res.json({
    status: 'success',
    data: result,
    message: 'Contacts imported successfully'
  })
}))

// Export contacts
router.get('/export/data', asyncHandler(async (req, res) => {
  const { organizationId } = req.query
  const contacts = await contactService.exportContacts(organizationId as string)
  
  res.json({
    status: 'success',
    data: contacts,
    message: 'Contacts exported successfully'
  })
}))

// Find duplicate contacts
router.get('/maintenance/duplicates', asyncHandler(async (req, res) => {
  const result = await contactService.findDuplicateContacts()
  
  res.json({
    status: 'success',
    data: result,
    message: 'Duplicate contacts found'
  })
}))

// Merge contacts
router.post('/:targetId/merge/:sourceId', asyncHandler(async (req, res) => {
  const { targetId, sourceId } = req.params
  const userId = req.user?.id || 'system'
  const merged = await contactService.mergeContacts(targetId, sourceId, userId)
  
  res.json({
    status: 'success',
    data: merged,
    message: 'Contacts merged successfully'
  })
}))

export { router as contactRoutes }