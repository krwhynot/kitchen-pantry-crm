import { Request, Response, NextFunction } from 'express'
import { z, ZodError } from 'zod'
import { AppError } from './errorHandler'

export const validateRequest = (schema: {
  body?: z.ZodSchema
  query?: z.ZodSchema
  params?: z.ZodSchema
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body)
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query)
      }
      if (schema.params) {
        req.params = schema.params.parse(req.params)
      }
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        next(new AppError(`Validation error: ${errorMessages.join(', ')}`, 400))
      } else {
        next(error)
      }
    }
  }
}