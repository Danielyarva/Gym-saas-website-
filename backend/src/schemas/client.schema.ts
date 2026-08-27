import { z } from 'zod';

export const clientStatusEnum = z.enum(['ON_TRACK', 'NEEDS_ATTENTION', 'AT_RISK', 'INACTIVE']);

export const listClientsQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  status: z
    .string()
    .optional()
    .transform((value) => (value ? value.split(',').map((s) => s.trim()) : undefined))
    .pipe(z.array(clientStatusEnum).optional()),
  archived: z
    .enum(['true', 'false'])
    .optional()
    .default('false')
    .transform((value) => value === 'true'),
  sortBy: z.enum(['fullName', 'status', 'adherencePct', 'lastCheckInAt']).default('fullName'),
  sortDir: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const createClientSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  email: z.string().email().toLowerCase(),
  phone: z.string().trim().max(30).optional(),
  goalText: z.string().trim().max(500).optional(),
  startingWeightKg: z.number().positive().max(500).optional(),
  goalWeightKg: z.number().positive().max(500).optional(),
});

export const updateClientSchema = z.object({
  fullName: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().max(30).optional(),
  status: clientStatusEnum.optional(),
  goalText: z.string().trim().max(500).optional(),
  currentWeightKg: z.number().positive().max(500).optional(),
  goalWeightKg: z.number().positive().max(500).optional(),
});
