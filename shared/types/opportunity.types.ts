import { z } from 'zod'

export const OpportunitySchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  value: z.number().min(0),
  stage: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']),
  probability: z.number().min(0).max(100),
  expectedCloseDate: z.date().optional(),
  actualCloseDate: z.date().optional(),
  organizationId: z.string().uuid(),
  contactId: z.string().uuid(),
  userId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type Opportunity = z.infer<typeof OpportunitySchema>