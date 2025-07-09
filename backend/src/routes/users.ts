import express from 'express'
import { asyncHandler } from '../middleware/errorHandler'
import { validateRequest } from '../middleware/validation'
import { authenticateToken, requireManagerOrAdmin } from '../middleware/auth'
import { UserSchema } from '@shared/types'

const router = express.Router()

// Apply authentication to all routes - users require manager/admin role
router.use(authenticateToken)
router.use(requireManagerOrAdmin)

router.get('/', asyncHandler(async (req, res) => {
  res.json({
    status: 'success',
    data: [],
    message: 'Users retrieved successfully'
  })
}))

router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params
  res.json({
    status: 'success',
    data: { id },
    message: 'User retrieved successfully'
  })
}))

router.post('/', 
  validateRequest({ body: UserSchema.omit({ id: true, createdAt: true, updatedAt: true }) }),
  asyncHandler(async (req, res) => {
    res.status(201).json({
      status: 'success',
      data: req.body,
      message: 'User created successfully'
    })
  })
)

router.put('/:id',
  validateRequest({ body: UserSchema.omit({ id: true, createdAt: true, updatedAt: true }) }),
  asyncHandler(async (req, res) => {
    const { id } = req.params
    res.json({
      status: 'success',
      data: { id, ...req.body },
      message: 'User updated successfully'
    })
  })
)

router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params
  res.json({
    status: 'success',
    message: 'User deleted successfully'
  })
}))

export { router as userRoutes }