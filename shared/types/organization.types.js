import { z } from 'zod';
export const OrganizationSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    type: z.enum(['restaurant', 'food_service', 'distributor', 'manufacturer']),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    website: z.string().url().optional(),
    parentId: z.string().uuid().optional(),
    createdAt: z.date(),
    updatedAt: z.date()
});
