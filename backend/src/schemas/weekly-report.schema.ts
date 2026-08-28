import { z } from 'zod';

export const generateWeeklyReportSchema = z.object({
  // Any date inside the target Mon–Sun week; the service normalizes it to
  // that week's Monday. Omitted = the most recently completed week.
  weekStart: z.coerce.date().optional(),
});

export const listWeeklyReportsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
