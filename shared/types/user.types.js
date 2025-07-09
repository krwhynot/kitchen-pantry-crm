import { z } from 'zod';
export const UserSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    role: z.enum(['admin', 'manager', 'sales_rep']),
    organizationId: z.string().uuid(),
    createdAt: z.date(),
    updatedAt: z.date()
});
