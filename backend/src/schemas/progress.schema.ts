import { z } from 'zod';

export const progressRangeEnum = z.enum(['WEEKLY', 'MONTHLY', '3M', '6M', 'ALL']);

export const chartsQuerySchema = z.object({
  range: progressRangeEnum.default('MONTHLY'),
});
