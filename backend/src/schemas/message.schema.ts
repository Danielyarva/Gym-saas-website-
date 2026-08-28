import { z } from 'zod';

export const sendMessageSchema = z.object({
  content: z.string().trim().max(2000).optional(),
});

export const listMessagesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(50),
});
