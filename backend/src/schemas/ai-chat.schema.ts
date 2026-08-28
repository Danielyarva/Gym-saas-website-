import { z } from 'zod';

export const sendChatMessageSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

export const listChatMessagesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(50),
});
