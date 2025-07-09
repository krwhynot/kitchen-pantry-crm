import express from 'express'
import { authRoutes } from './auth'
import { organizationRoutes } from './organizations'
import { contactRoutes } from './contacts'
import { interactionRoutes } from './interactions'
import { opportunityRoutes } from './opportunities'
import { productRoutes } from './products'
import { userRoutes } from './users'

const router = express.Router()

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  })
})

// Authentication routes (no auth required)
router.use('/auth', authRoutes)

// Protected API routes
router.use('/organizations', organizationRoutes)
router.use('/contacts', contactRoutes)
router.use('/interactions', interactionRoutes)
router.use('/opportunities', opportunityRoutes)
router.use('/products', productRoutes)
router.use('/users', userRoutes)

export default router