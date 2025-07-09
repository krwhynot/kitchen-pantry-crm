import { z } from 'zod';
export const ContactSchema = z.object({
    id: z.string().uuid(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    title: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    mobile: z.string().optional(),
    organizationId: z.string().uuid(),
    isDecisionMaker: z.boolean().default(false),
    createdAt: z.date(),
    updatedAt: z.date()
});
