import { z } from 'zod'

export const InteractionSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['email', 'call', 'meeting', 'note']),
  subject: z.string().min(1),
  content: z.string().optional(),
  contactId: z.string().uuid(),
  organizationId: z.string().uuid(),
  userId: z.string().uuid(),
  scheduledAt: z.date().optional(),
  completedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type Interaction = z.infer<typeof InteractionSchema>