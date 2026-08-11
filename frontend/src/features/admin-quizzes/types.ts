import { z } from 'zod';
import { QuizStatus, DifficultyLevel } from '@/types/quiz';

export const quizFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().max(500).optional(),
  category_id: z.string().uuid('Please select a valid category'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD'] as const).default('MEDIUM'),
  duration_minutes: z.coerce.number().int().positive('Duration must be positive'),
  passing_percentage: z.coerce.number().int().min(0).max(100),
  maximum_attempts: z.coerce.number().int().positive('Attempts must be positive'),
  negative_marking: z.coerce.number().min(0, 'Negative marks cannot be negative'),
  randomize_questions: z.boolean().default(true),
  randomize_options: z.boolean().default(true),
});

export type QuizFormData = z.infer<typeof quizFormSchema>;

export interface QuizCreateRequest extends QuizFormData {}
export interface QuizUpdateRequest extends Partial<QuizFormData> {}
