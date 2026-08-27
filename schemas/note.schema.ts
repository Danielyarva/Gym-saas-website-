import { z } from 'zod';

export const noteFormSchema = z.object({
  body: z.string().trim().min(1, 'Write something before saving').max(2000),
});
export type NoteFormValues = z.infer<typeof noteFormSchema>;
