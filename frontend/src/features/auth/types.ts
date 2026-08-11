import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().min(3, 'Username or email must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginCredentials = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(100),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30).regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, and underscores'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  confirm_password: z.string()
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

export type RegisterCredentials = z.infer<typeof registerSchema>;
