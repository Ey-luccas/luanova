import { z } from 'zod';

export const createFeedbackSchema = z.object({
  companyExtensionId: z.number().int().positive('ID da extensão é obrigatório'),
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().optional(),
  suggestions: z.string().optional(),
});

export const updateFeedbackSchema = createFeedbackSchema.partial();

