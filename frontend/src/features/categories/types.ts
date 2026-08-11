import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  description: z.string().max(255).optional(),
  is_active: z.boolean().default(true),
});

export type CategoryFormData = z.infer<typeof categorySchema>;
