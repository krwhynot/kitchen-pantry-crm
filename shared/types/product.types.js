import { z } from 'zod';
export const ProductSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    description: z.string().optional(),
    sku: z.string().min(1),
    category: z.string().min(1),
    unitPrice: z.number().min(0),
    unit: z.string().min(1),
    isActive: z.boolean().default(true),
    createdAt: z.date(),
    updatedAt: z.date()
});
