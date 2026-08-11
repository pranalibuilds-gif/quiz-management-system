import { z } from 'zod';

export const optionSchema = z.object({
  text: z.string().min(1, 'Option text is required').max(500),
  is_correct: z.boolean().default(false),
});

export const questionSchema = z.object({
  text: z.string().min(1, 'Question text is required').max(1000),
  explanation: z.string().max(1000).optional(),
  marks: z.coerce.number().min(0.5, 'Minimum 0.5 marks').max(100),
  order: z.coerce.number().int().min(0).default(0),
  options: z.array(optionSchema).min(2, 'At least 2 options are required').max(10),
}).refine(data => data.options.filter(opt => opt.is_correct).length === 1, {
  message: "Exactly one correct option must be selected",
  path: ["options"],
});

export type QuestionFormData = z.infer<typeof questionSchema>;
