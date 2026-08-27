import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[0-9]/, 'Password must include a number');

export const registerSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: passwordSchema,
  fullName: z.string().trim().min(1).max(120),
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: passwordSchema,
});

export const sessionParamSchema = z.object({
  sessionId: z.string().uuid(),
});
