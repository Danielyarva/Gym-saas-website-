import { z } from 'zod';

export const createNoteSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

export const updateNoteSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});
